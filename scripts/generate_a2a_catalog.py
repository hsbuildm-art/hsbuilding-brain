#!/usr/bin/env python3
"""
Generate A2A catalog (services.json + offers.json) for HSビル.

The hardcoded SERVICES/COUPONS below are the authoritative structured source.
This script reconciles them against knowledge/pricing.md to detect drift and
warns about any price mismatches.

Last synced from pricing.md 2026-02-20
"""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PRICING_MD = REPO_ROOT / "knowledge" / "pricing.md"
CATALOG_DIR = REPO_ROOT / "catalog"
BOOKING_ENDPOINT = "https://www.hsworking.com/_functions/a2a_booking_link"

# --- Authoritative service catalog (hardcoded, reconciled with pricing.md) ---
SERVICES: list[dict] = [
    {
        "service_id": "coworking",
        "name": "コワーキング（共有席）",
        "name_en": "Coworking (shared desk)",
        "category": "drop_in",
        "booking_agent": "marmo",
        "coupon_eligible": True,
        "offers": [
            {"offer_id": "cw_1h", "label": "1時間", "hours": 1, "price": 300, "currency": "JPY"},
            {"offer_id": "cw_3h", "label": "3時間", "hours": 3, "price": 900, "currency": "JPY"},
            {"offer_id": "cw_8h", "label": "1日（8時間）", "hours": 8, "price": 3000, "currency": "JPY"},
        ],
    },
    {
        "service_id": "workbooth",
        "name": "個室ワークブース",
        "name_en": "Private work booth",
        "category": "drop_in",
        "booking_agent": "marmo",
        "coupon_eligible": True,
        "offers": [
            {"offer_id": "wb_1h", "label": "1時間", "hours": 1, "price": 950, "currency": "JPY"},
            {"offer_id": "wb_3h", "label": "3時間", "hours": 3, "price": 2800, "currency": "JPY"},
            {"offer_id": "wb_8h", "label": "1日（8時間）", "hours": 8, "price": 9800, "currency": "JPY"},
        ],
    },
    {
        "service_id": "meeting_room",
        "name": "貸し会議室（16名）",
        "name_en": "Meeting room (16 seats)",
        "category": "drop_in",
        "booking_agent": "marmo",
        "coupon_eligible": True,
        "offers": [
            {"offer_id": "mr_1h", "label": "1時間", "hours": 1, "price": 1600, "currency": "JPY"},
            {"offer_id": "mr_3h", "label": "3時間（Wix Bookings単発）", "hours": 3, "price": 5200, "currency": "JPY"},
            {"offer_id": "mr_8h", "label": "1日（8時間）", "hours": 8, "price": 9800, "currency": "JPY"},
        ],
    },
    {
        "service_id": "music_studio",
        "name": "音楽スタジオ",
        "name_en": "Music studio",
        "category": "drop_in",
        "booking_agent": "marmo",
        "coupon_eligible": True,
        "offers": [
            {"offer_id": "ms_1h", "label": "1時間", "hours": 1, "price": 2100, "currency": "JPY"},
            {"offer_id": "ms_3h", "label": "3時間", "hours": 3, "price": 6000, "currency": "JPY"},
            {"offer_id": "ms_8h", "label": "1日（8時間）", "hours": 8, "price": 12000, "currency": "JPY"},
        ],
    },
    {
        "service_id": "classroom",
        "name": "貸し教室",
        "name_en": "Classroom",
        "category": "drop_in",
        "booking_agent": "marmo",
        "coupon_eligible": True,
        "offers": [
            {"offer_id": "cr_1h", "label": "1時間", "hours": 1, "price": 1200, "currency": "JPY"},
        ],
    },
    {
        "service_id": "virtual_office",
        "name": "バーチャルオフィス",
        "name_en": "Virtual office",
        "category": "subscription",
        "booking_agent": "marmo",
        "coupon_eligible": False,
        "offers": [
            {"offer_id": "vo_base", "label": "法人登記可プラン", "period": "monthly", "price_from": 550, "currency": "JPY"},
        ],
    },
    {
        "service_id": "coworking_premium",
        "name": "コワーキングプレミアムプラン",
        "name_en": "Coworking premium (unlimited)",
        "category": "pack",
        "booking_agent": "marmo",
        "coupon_eligible": True,
        "offers": [
            {"offer_id": "cw_prem", "label": "月額・1h/3h/8h無制限", "period": "monthly", "price": 15000, "currency": "JPY"},
        ],
    },
    {
        "service_id": "workbooth_5pack",
        "name": "個室ブース3時間×5回パック",
        "name_en": "Workbooth 3h x 5 pack",
        "category": "pack",
        "booking_agent": "marmo",
        "coupon_eligible": True,
        "offers": [
            {"offer_id": "wb_5pack", "label": "3h×5回（3ヶ月有効）", "sessions": 5, "hours_per_session": 3, "validity_months": 3, "price": 12000, "currency": "JPY"},
        ],
    },
    {
        "service_id": "workbooth_weekly2",
        "name": "個室ブース週2プラン",
        "name_en": "Workbooth weekly x2",
        "category": "pack",
        "booking_agent": "marmo",
        "coupon_eligible": True,
        "offers": [
            {"offer_id": "wb_weekly2", "label": "8h×月8回", "period": "monthly", "sessions": 8, "hours_per_session": 8, "price": 25000, "currency": "JPY"},
        ],
    },
    {
        "service_id": "classroom_monthly4",
        "name": "教室運営プラン（月4回×3時間）",
        "name_en": "Studio/Classroom monthly 4x3h",
        "category": "pack",
        "booking_agent": "marmo",
        "coupon_eligible": True,
        "offers": [
            {"offer_id": "cr_monthly4", "label": "スタジオ or 教室 3h×月4回", "period": "monthly", "sessions": 4, "hours_per_session": 3, "price": 24000, "currency": "JPY"},
        ],
    },
    {
        "service_id": "meeting_weekly1",
        "name": "貸し会議室週1利用プラン",
        "name_en": "Meeting room weekly x1",
        "category": "pack",
        "booking_agent": "marmo",
        "coupon_eligible": True,
        "offers": [
            {"offer_id": "mr_weekly1", "label": "3h×4回（3ヶ月有効）", "sessions": 4, "hours_per_session": 3, "validity_months": 3, "price": 12000, "currency": "JPY"},
        ],
    },
    {
        "service_id": "meeting_10day",
        "name": "貸し会議室10Dayプラン",
        "name_en": "Meeting room 10 day pack",
        "category": "pack",
        "booking_agent": "marmo",
        "coupon_eligible": True,
        "offers": [
            {"offer_id": "mr_10day", "label": "3h×10回（3ヶ月有効）", "sessions": 10, "hours_per_session": 3, "validity_months": 3, "price": 24000, "currency": "JPY"},
        ],
    },
    {
        "service_id": "meeting_corporate",
        "name": "法人向け会議室サブスク",
        "name_en": "Corporate meeting room subscription",
        "category": "pack",
        "booking_agent": "marmo",
        "coupon_eligible": False,
        "offers": [
            {"offer_id": "mr_corp", "label": "6h×月4回", "period": "monthly", "sessions": 4, "hours_per_session": 6, "price": 30000, "currency": "JPY"},
        ],
    },
    {
        "service_id": "corp_fulltime",
        "name": "フルタイム（法人月額）",
        "name_en": "Corporate Full-time",
        "category": "corporate",
        "booking_agent": "marmo",
        "coupon_eligible": False,
        "offers": [
            {"offer_id": "corp_ft", "label": "月額", "period": "monthly", "price": 15000, "currency": "JPY", "includes": ["coworking", "web_booth_3h"]},
        ],
    },
    {
        "service_id": "corp_business_starter",
        "name": "ビジネススターター（法人月額）",
        "name_en": "Corporate Business Starter",
        "category": "corporate",
        "booking_agent": "marmo",
        "coupon_eligible": False,
        "offers": [
            {"offer_id": "corp_bs", "label": "月額", "period": "monthly", "price": 25000, "currency": "JPY", "includes": ["coworking", "booth_5h", "meeting_10h", "virtual_office"]},
        ],
    },
    {
        "service_id": "corp_ai_coaching",
        "name": "AIコーチング併用（法人月額）",
        "name_en": "Corporate AI Coaching",
        "category": "corporate",
        "booking_agent": "erika",
        "coupon_eligible": False,
        "offers": [
            {"offer_id": "corp_aic", "label": "月額", "period": "monthly", "price": 29800, "currency": "JPY", "includes": ["coworking", "booth_15h", "studio_1x", "ai_seminar"]},
        ],
    },
    {
        "service_id": "corp_premium",
        "name": "プレミアムアクセス（法人月額）",
        "name_en": "Corporate Premium Access",
        "category": "corporate",
        "booking_agent": "marmo",
        "coupon_eligible": False,
        "offers": [
            {"offer_id": "corp_prem", "label": "月額", "period": "monthly", "price_from": 54000, "currency": "JPY", "includes": ["coworking", "booth_20h", "meeting_20h", "virtual_office", "parking_1"]},
        ],
    },
    {
        "service_id": "ai_helpdesk",
        "name": "HS式 AIヘルプデスク構築代行",
        "name_en": "HS AI Helpdesk Build",
        "category": "ai_solution",
        "booking_agent": "erika",
        "coupon_eligible": False,
        "offers": [
            {"offer_id": "ai_hd", "label": "構築代行（一括）", "period": "one_time", "price": 298000, "currency": "JPY"},
        ],
    },
    {
        "service_id": "ai_digital_library",
        "name": "AIデジタルライブラリー",
        "name_en": "AI Digital Library",
        "category": "ai_solution",
        "booking_agent": "erika",
        "coupon_eligible": False,
        "offers": [
            {"offer_id": "ai_dl", "label": "月額", "period": "monthly", "price": 2980, "currency": "JPY"},
        ],
    },
    {
        "service_id": "ai_coaching_90day",
        "name": "90日実装コーチング",
        "name_en": "90-day AI coaching",
        "category": "ai_solution",
        "booking_agent": "erika",
        "coupon_eligible": False,
        "offers": [
            {"offer_id": "ai_c90", "label": "要問い合わせ", "period": "program", "price": None, "currency": "JPY", "inquiry_required": True},
        ],
    },
    {
        "service_id": "parking_day",
        "name": "駐車場（オンライン予約）",
        "name_en": "Parking (day)",
        "category": "drop_in",
        "booking_agent": "marmo",
        "coupon_eligible": False,
        "offers": [
            {"offer_id": "pk_day", "label": "1回", "price": 600, "currency": "JPY"},
        ],
    },
    {
        "service_id": "parking_monthly",
        "name": "駐車場 月極（7番）",
        "name_en": "Parking (monthly slot 7)",
        "category": "subscription",
        "booking_agent": "marmo",
        "coupon_eligible": False,
        "offers": [
            {"offer_id": "pk_month", "label": "月額", "period": "monthly", "price": 11000, "currency": "JPY"},
        ],
    },
]

COUPONS: list[dict] = [
    {
        "coupon_id": "WELCOME10",
        "discount_percent": 10,
        "eligible_categories": ["drop_in", "pack"],
        "eligible_service_ids": [
            "coworking",
            "workbooth",
            "meeting_room",
            "music_studio",
            "classroom",
        ],
        "description": "初回利用者向けウェルカムクーポン（10%OFF）",
        "usage_hint": "予約導線・A2A案内時に表示推奨",
        "first_time_only": True,
    }
]


def _yen_to_int(s: str) -> int:
    return int(s.replace("¥", "").replace(",", "").strip())


def reconcile_with_pricing_md() -> list[str]:
    """Compare hardcoded catalog prices against pricing.md and return warnings."""
    warnings: list[str] = []
    if not PRICING_MD.exists():
        return [f"pricing.md not found at {PRICING_MD}"]

    text = PRICING_MD.read_text(encoding="utf-8")

    # Expected drop-in prices from hardcoded SERVICES
    drop_in_expected = {
        "コワーキング（共有席）": (300, 900, 3000),
        "個室ワークブース": (950, 2800, 9800),
        # meeting_room 3h is intentionally ¥5,200 (Wix Bookings single), but
        # pricing.md table shows ¥4,560 (pack-equivalent per-session).
        "貸し会議室（16名）": (1600, None, 9800),
        "音楽スタジオ": (2100, 6000, 12000),
    }

    row_re = re.compile(
        r"^\|\s*(?P<name>[^|]+?)\s*\|\s*(?P<c1>[^|]+?)\s*\|\s*(?P<c2>[^|]+?)\s*\|\s*(?P<c3>[^|]+?)\s*\|",
        re.MULTILINE,
    )
    for m in row_re.finditer(text):
        name = m.group("name").strip()
        if name not in drop_in_expected:
            continue
        expected = drop_in_expected[name]
        cells = [m.group("c1"), m.group("c2"), m.group("c3")]
        for idx, exp in enumerate(expected):
            if exp is None:
                continue
            cell = cells[idx].strip()
            if cell in ("-", ""):
                continue
            try:
                found = _yen_to_int(cell)
            except ValueError:
                continue
            if found != exp:
                warnings.append(
                    f"price drift: {name} column[{idx}] pricing.md=¥{found:,} catalog=¥{exp:,}"
                )

    # Known intentional divergence
    if "¥4,560" in text:
        # Confirms the meeting_room pack-equivalent row is still there
        pass

    return warnings


def generate() -> tuple[Path, Path]:
    CATALOG_DIR.mkdir(parents=True, exist_ok=True)
    now = datetime.now(timezone.utc).isoformat()

    services_doc = {
        "schema_version": "1.0",
        "generated_at": now,
        "booking_endpoint": BOOKING_ENDPOINT,
        "services": SERVICES,
    }
    offers_doc = {
        "schema_version": "1.0",
        "generated_at": now,
        "coupons": COUPONS,
    }

    services_path = CATALOG_DIR / "services.json"
    offers_path = CATALOG_DIR / "offers.json"
    services_path.write_text(json.dumps(services_doc, ensure_ascii=False, indent=2), encoding="utf-8")
    offers_path.write_text(json.dumps(offers_doc, ensure_ascii=False, indent=2), encoding="utf-8")
    return services_path, offers_path


def main() -> int:
    warnings = reconcile_with_pricing_md()
    services_path, offers_path = generate()

    total_offers = sum(len(s.get("offers", [])) for s in SERVICES)
    categories: dict[str, int] = {}
    for s in SERVICES:
        categories[s["category"]] = categories.get(s["category"], 0) + 1

    print("=" * 60)
    print("A2A catalog generated")
    print("=" * 60)
    print(f"services.json: {services_path}  ({len(SERVICES)} services)")
    print(f"offers.json:   {offers_path}  ({len(COUPONS)} coupons)")
    print(f"total offers:  {total_offers}")
    print("categories:")
    for cat, count in sorted(categories.items()):
        print(f"  - {cat}: {count}")
    print()
    if warnings:
        print(f"WARN: {len(warnings)} price drift(s) detected vs pricing.md:")
        for w in warnings:
            print(f"  ! {w}")
        print("→ review pricing.md or update SERVICES in this script")
    else:
        print("OK: no price drift detected vs pricing.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
