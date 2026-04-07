#!/usr/bin/env node
/**
 * HSビル A2A Catalog MCP Server
 *
 * Exposes three tools to AI agents:
 *   - list_services: returns all service_ids with names and categories
 *   - get_pricing(service_id): returns offers for a specific service
 *   - resolve_booking_url(service_id, offer_id, coupon?): constructs a booking URL
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import {
  findCoupon,
  findOffer,
  findService,
  isCouponEligible,
  loadOffers,
  loadServices,
} from "./catalog.js";

const server = new Server(
  {
    name: "hsbuilding-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_services",
      description:
        "List all HSビル services (coworking, workbooth, meeting room, AI solutions, etc.) with service_id, name, name_en, category, and booking agent.",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description:
              "Optional category filter: drop_in, pack, subscription, corporate, ai_solution",
          },
        },
      },
    },
    {
      name: "get_pricing",
      description:
        "Return all pricing offers for a given service_id (e.g. coworking → cw_1h/cw_3h/cw_8h).",
      inputSchema: {
        type: "object",
        properties: {
          service_id: {
            type: "string",
            description: "Service identifier, e.g. 'coworking', 'ai_helpdesk'",
          },
        },
        required: ["service_id"],
      },
    },
    {
      name: "resolve_booking_url",
      description:
        "Construct a booking URL for the given service_id and offer_id. Optionally apply a coupon code (e.g. WELCOME10) if eligible.",
      inputSchema: {
        type: "object",
        properties: {
          service_id: { type: "string" },
          offer_id: { type: "string" },
          coupon: {
            type: "string",
            description: "Optional coupon id (e.g. WELCOME10)",
          },
        },
        required: ["service_id", "offer_id"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  if (name === "list_services") {
    const doc = loadServices();
    const category = (args as { category?: string }).category;
    const filtered = category
      ? doc.services.filter((s) => s.category === category)
      : doc.services;
    const summary = filtered.map((s) => ({
      service_id: s.service_id,
      name: s.name,
      name_en: s.name_en,
      category: s.category,
      booking_agent: s.booking_agent,
      offer_count: s.offers.length,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
    };
  }

  if (name === "get_pricing") {
    const { service_id } = args as { service_id: string };
    const doc = loadServices();
    const service = findService(doc, service_id);
    if (!service) {
      return {
        isError: true,
        content: [{ type: "text", text: `Unknown service_id: ${service_id}` }],
      };
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              service_id: service.service_id,
              name: service.name,
              category: service.category,
              coupon_eligible: service.coupon_eligible,
              offers: service.offers,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (name === "resolve_booking_url") {
    const {
      service_id,
      offer_id,
      coupon: couponId,
    } = args as { service_id: string; offer_id: string; coupon?: string };

    const servicesDoc = loadServices();
    const service = findService(servicesDoc, service_id);
    if (!service) {
      return {
        isError: true,
        content: [{ type: "text", text: `Unknown service_id: ${service_id}` }],
      };
    }
    const offer = findOffer(service, offer_id);
    if (!offer) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Unknown offer_id '${offer_id}' for service '${service_id}'`,
          },
        ],
      };
    }
    if (offer.inquiry_required) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                booking_url: null,
                inquiry_url: "https://www.hsworking.com/contact",
                reason: "inquiry_required",
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const params = new URLSearchParams({
      service_id,
      offer_id,
    });

    let appliedCoupon: string | null = null;
    if (couponId) {
      const offersDoc = loadOffers();
      const coupon = findCoupon(offersDoc, couponId);
      if (coupon && isCouponEligible(service, coupon)) {
        params.set("coupon", coupon.coupon_id);
        appliedCoupon = coupon.coupon_id;
      }
    }

    const url = `${servicesDoc.booking_endpoint}?${params.toString()}`;
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              booking_url: url,
              service_id,
              offer_id,
              applied_coupon: appliedCoupon,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  return {
    isError: true,
    content: [{ type: "text", text: `Unknown tool: ${name}` }],
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("hsbuilding-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
