import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface Offer {
  offer_id: string;
  label: string;
  hours?: number;
  sessions?: number;
  hours_per_session?: number;
  validity_months?: number;
  period?: string;
  price?: number | null;
  price_from?: number;
  currency: string;
  includes?: string[];
  inquiry_required?: boolean;
}

export interface Service {
  service_id: string;
  name: string;
  name_en: string;
  category: string;
  booking_agent: string;
  coupon_eligible: boolean;
  offers: Offer[];
}

export interface ServicesDoc {
  schema_version: string;
  generated_at: string;
  booking_endpoint: string;
  services: Service[];
}

export interface Coupon {
  coupon_id: string;
  discount_percent: number;
  eligible_categories: string[];
  eligible_service_ids: string[];
  description: string;
  usage_hint: string;
  first_time_only?: boolean;
}

export interface OffersDoc {
  schema_version: string;
  generated_at: string;
  coupons: Coupon[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// mcp-server/src -> repo root is two levels up
const REPO_ROOT = resolve(__dirname, "..", "..");
const SERVICES_PATH = resolve(REPO_ROOT, "catalog", "services.json");
const OFFERS_PATH = resolve(REPO_ROOT, "catalog", "offers.json");

export function loadServices(): ServicesDoc {
  const raw = readFileSync(SERVICES_PATH, "utf-8");
  return JSON.parse(raw) as ServicesDoc;
}

export function loadOffers(): OffersDoc {
  const raw = readFileSync(OFFERS_PATH, "utf-8");
  return JSON.parse(raw) as OffersDoc;
}

export function findService(doc: ServicesDoc, serviceId: string): Service | undefined {
  return doc.services.find((s) => s.service_id === serviceId);
}

export function findOffer(service: Service, offerId: string): Offer | undefined {
  return service.offers.find((o) => o.offer_id === offerId);
}

export function findCoupon(doc: OffersDoc, couponId: string): Coupon | undefined {
  return doc.coupons.find((c) => c.coupon_id === couponId);
}

export function isCouponEligible(
  service: Service,
  coupon: Coupon
): boolean {
  if (!service.coupon_eligible) return false;
  if (!coupon.eligible_categories.includes(service.category)) return false;
  if (!coupon.eligible_service_ids.includes(service.service_id)) return false;
  return true;
}
