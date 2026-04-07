# HSビル AI-Native Architecture

This document describes the end-to-end architecture connecting **Discovery → Knowledge → Booking**
across SEO, AIO/LLMO, A2A, MCP, and our LINE-based agents (マルモ / エリカ / ツバサ).

## 1. ASCII Architecture Diagram

```
                                  HSビル AI-Native Stack
                                  ─────────────────────

  ┌──────────────────────────────────────────────────────────────────────────────┐
  │                          DISCOVERY LAYER (人間 + AI)                          │
  │                                                                              │
  │   Human users                Search engines               LLM agents         │
  │   (LINE / web)               (Google / Bing)              (ChatGPT,          │
  │        │                          │                       Perplexity,       │
  │        │                          │                       Claude, Gemini)   │
  └────────┼──────────────────────────┼──────────────────────────┼───────────────┘
           │                          │                          │
           │                          ▼                          │
           │            ┌──────────────────────────┐             │
           │            │   SEO LAYER              │             │
           │            │  - schema.org JSON-LD    │             │
           │            │    (content/schema/*.json│             │
           │            │  - sitemap.xml           │             │
           │            │  - canonical URLs        │             │
           │            └────────────┬─────────────┘             │
           │                         │                           │
           │                         ▼                           │
           │            ┌──────────────────────────┐             │
           │            │   AIO / LLMO LAYER       │◀────────────┘
           │            │  - llm.txt               │
           │            │  - knowledge/*.md        │
           │            │    (pricing / facilities │
           │            │     / coupons / coaching)│
           │            │  - llmo audit (tsubasa)  │
           │            └────────────┬─────────────┘
           │                         │
           ▼                         ▼
  ┌──────────────────────────────────────────────────────────────────────────────┐
  │                        AGENT INTERFACE LAYER                                 │
  │                                                                              │
  │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
  │   │   マルモ      │    │   エリカ     │    │   ツバサ     │                   │
  │   │  (LINE bot)  │    │  (LINE bot)  │    │  (LINE bot)  │                   │
  │   │   facility   │    │  AI solutions│    │  LLMO audit  │                   │
  │   │   booking    │    │  + coaching  │    │  consult only│                   │
  │   └───────┬──────┘    └──────┬───────┘    └──────┬───────┘                   │
  │           │                  │                   │                           │
  │           │ content/agents/{marmo,erika,tsubasa}.json                        │
  │           │ ai-staff/{marumo,erika,tsubasa}/persona.md                       │
  └───────────┼──────────────────┼───────────────────┼───────────────────────────┘
              │                  │                   │
              ▼                  ▼                   ▼
  ┌──────────────────────────────────────────────────────────────────────────────┐
  │                         A2A / MCP LAYER                                      │
  │                                                                              │
  │   ┌─────────────────┐   ┌──────────────────────┐   ┌─────────────────────┐   │
  │   │  agent-card.json│   │  mcp-server/         │   │  openapi.yaml       │   │
  │   │  (.well-known)  │   │  - list_services     │   │  (REST contract)    │   │
  │   │                 │   │  - get_pricing       │   │                     │   │
  │   │                 │   │  - resolve_booking_  │   │                     │   │
  │   │                 │   │    url               │   │                     │   │
  │   └────────┬────────┘   └──────────┬───────────┘   └──────────┬──────────┘   │
  │            │                       │                          │              │
  │            └───────────┬───────────┴──────────────────────────┘              │
  │                        ▼                                                     │
  │          ┌──────────────────────────────────┐                                │
  │          │  KNOWLEDGE / CATALOG (truth)     │                                │
  │          │  - catalog/services.json         │◀── scripts/generate_a2a_       │
  │          │  - catalog/offers.json           │     catalog.py (reconciles     │
  │          │  - knowledge/pricing.md          │     hardcoded SoT against      │
  │          │  - knowledge/coaching/           │     pricing.md)                │
  │          └───────────────┬──────────────────┘                                │
  └──────────────────────────┼───────────────────────────────────────────────────┘
                             │
                             ▼
  ┌──────────────────────────────────────────────────────────────────────────────┐
  │                          BOOKING LAYER                                       │
  │                                                                              │
  │   https://www.hsworking.com/_functions/a2a_booking_link                      │
  │       ?service_id=...&offer_id=...&coupon=WELCOME10                          │
  │                             │                                                │
  │                             ▼                                                │
  │            Wix Bookings / Wix Stores / Stripe / PayPay                       │
  │                                                                              │
  └──────────────────────────────────────────────────────────────────────────────┘
```

## 2. Layer Responsibilities

### 2.1 Discovery Layer
- **Humans** find HSビル via Google / SNS / LINE QR.
- **Search engines** crawl the public Wix site (`hsworking.com`) and `sitemap.xml`.
- **LLM agents** (ChatGPT / Perplexity / Claude / Gemini) crawl `llm.txt`, `agent-card.json`,
  and the public `catalog/` JSON files.

### 2.2 SEO Layer (`content/schema/`, sitemap)
- `schema.org` JSON-LD for `LocalBusiness`, `Service`, `Offer`, `Reservation`.
- Canonical URLs and OG tags per page (`content/pages/`).
- Tsubasa monitors crawl health and AI recommendation index (ARI score).

### 2.3 AIO / LLMO Layer (`llm.txt`, `knowledge/`)
- `llm.txt` is the LLM-facing index that points at `knowledge/*.md` and `catalog/*.json`.
- `knowledge/pricing.md` and `knowledge/facilities.md` are human-readable source of truth
  for narrative content.
- `scripts/generate_a2a_catalog.py` reconciles `pricing.md` against the structured catalog
  and warns on drift, keeping LLM-readable narrative and machine-readable catalog in sync.

### 2.4 Agent Interface Layer (`content/agents/`, `ai-staff/`)
- One JSON file per LINE agent declares which `service_id`s it handles, persona path,
  routing config, and escalation paths.
- マルモ owns facility booking; エリカ owns AI solutions and corporate coaching;
  ツバサ is consultation-only and routes confirmed leads to エリカ or マルモ.

### 2.5 A2A / MCP Layer
- **`agent-card.json`** (`.well-known/agent-card.json`) advertises capabilities to remote agents.
- **`openapi.yaml`** is the REST contract for external A2A callers.
- **`mcp-server/`** is the local Model Context Protocol surface used by Claude / VS Code /
  other MCP hosts. It exposes 3 tools — `list_services`, `get_pricing`, `resolve_booking_url`
  — backed by `catalog/services.json` and `catalog/offers.json`.

### 2.6 Knowledge / Catalog (single source of truth)
- `catalog/services.json` and `catalog/offers.json` are the **authoritative structured
  source** for prices, offer ids, booking endpoint, and coupons.
- They are generated by `scripts/generate_a2a_catalog.py`. Manual edits to the JSON are
  discouraged — change the SERVICES list in the script and re-run.

### 2.7 Booking Layer
- Booking URL pattern:
  `{booking_endpoint}?service_id=...&offer_id=...&coupon=...`
- `_functions/a2a_booking_link` is a Wix Velo endpoint that deterministically maps the
  triple to the correct Wix Bookings service / Wix Stores product / Stripe checkout.

## 3. Data Flow (Discovery → Booking)

```
1. LLM crawls llm.txt
       ▼
2. llm.txt links knowledge/pricing.md + catalog/services.json
       ▼
3. LLM picks service_id based on user intent
       ▼
4. LLM (or マルモ via MCP) calls resolve_booking_url(service_id, offer_id, coupon?)
       ▼
5. mcp-server validates against catalog/services.json + catalog/offers.json
       ▼
6. Returns canonical URL → user clicks → Wix _functions/a2a_booking_link
       ▼
7. a2a_booking_link routes to the correct Wix Bookings / Stores / Stripe product
       ▼
8. Confirmation email + LINE push from マルモ (or エリカ for AI solutions)
```

## 4. Sync & Drift Control

- `scripts/generate_a2a_catalog.py` runs in CI on changes to `knowledge/pricing.md` or
  the script itself. Drift between `pricing.md` and the hardcoded SoT raises a warning
  that must be resolved before merge.
- `scripts/sync_llmtxt_to_github.py` keeps the public `llm.txt` aligned with the latest
  `knowledge/` snapshot.
- ツバサ runs an LLMO audit weekly and reports ARI score deltas.

## 5. Why this shape?

1. **Single source of truth**: every layer reads from `catalog/*.json`, never hardcodes.
2. **Drift detection**: the generator warns if pricing.md and catalog disagree.
3. **Multi-protocol**: the same catalog is exposed via SEO (JSON-LD), AIO (llm.txt),
   A2A (agent-card / openapi), and MCP (mcp-server) — each layer reuses the same data.
4. **Agent ownership**: each `service_id` has exactly one owning agent, preventing
   duplicate booking attempts.
5. **Coupon eligibility is data-driven**: `WELCOME10` lives in `offers.json` and is
   enforced uniformly by `mcp-server` and the LINE bots.
