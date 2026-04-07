"""
test_catalog_bridge.py — catalog_bridge.py の単体テスト
----------------------------------------------------------
本番 bot を動かさずにブリッジロジックを確認する。

実行:
    cd /Users/miyakeyuki/hs_a2a
    python test_catalog_bridge.py
"""

import sys
import json
from pathlib import Path

# catalog_bridge.py が同じ dir にある前提
sys.path.insert(0, str(Path(__file__).parent))

from catalog_bridge import (
    resolve_catalog,
    get_welcome_coupon_text,
    is_coupon_eligible,
    build_booking_params,
    reload_cache,
)

PASS = "✅"
FAIL = "❌"

errors = 0


def check(label: str, actual, expected):
    global errors
    if actual == expected:
        print(f"  {PASS} {label}: {actual!r}")
    else:
        print(f"  {FAIL} {label}: got {actual!r}, expected {expected!r}")
        errors += 1


# ---------------------------------------------------------------------------
# resolve_catalog
# ---------------------------------------------------------------------------
print("\n=== resolve_catalog ===")
check("coworking",      resolve_catalog("coworking"),      ("coworking", "cw_3h"))
check("coworking_3h",   resolve_catalog("coworking_3h"),   ("coworking", "cw_3h"))
check("coworking_8h",   resolve_catalog("coworking_8h"),   ("coworking", "cw_8h"))
check("coworking_6h → cw_8h", resolve_catalog("coworking_6h"), ("coworking", "cw_8h"))  # 丸め
check("workbooth",      resolve_catalog("workbooth"),      ("workbooth", "wb_1h"))
check("booth_3h",       resolve_catalog("booth_3h"),       ("workbooth", "wb_3h"))
check("booth_6h → wb_8h", resolve_catalog("booth_6h"),    ("workbooth", "wb_8h"))  # 丸め
check("mr_3h",          resolve_catalog("mr_3h"),          ("meeting_room", "mr_3h"))
check("mr_6h → mr_8h",  resolve_catalog("mr_6h"),          ("meeting_room", "mr_8h"))  # 丸め
check("studio_1h",      resolve_catalog("studio_1h"),      ("music_studio", "ms_1h"))
check("studio_3h",      resolve_catalog("studio_3h"),      ("music_studio", "ms_3h"))
check("unknown_key → None", resolve_catalog("unknown_key"), None)

# ---------------------------------------------------------------------------
# get_welcome_coupon_text（catalog が無くてもフォールバックで動く）
# ---------------------------------------------------------------------------
print("\n=== get_welcome_coupon_text ===")
text = get_welcome_coupon_text()
assert "WELCOME10" in text, f"WELCOME10 not in text: {text!r}"
print(f"  {PASS} result: {text!r}")

# ---------------------------------------------------------------------------
# build_booking_params
# ---------------------------------------------------------------------------
print("\n=== build_booking_params ===")
params = build_booking_params("coworking_3h", "2026-04-07", "10:00")
check("service_key preserved", params.get("service_key"), "coworking_3h")
check("date preserved",        params.get("date"),        "2026-04-07")
check("start_time preserved",  params.get("start_time"),  "10:00")
check("service_id injected",   params.get("service_id"),  "coworking")
check("offer_id injected",     params.get("offer_id"),    "cw_3h")

params2 = build_booking_params("unknown_key", "2026-04-07", "10:00")
check("unknown: service_key preserved", params2.get("service_key"), "unknown_key")
check("unknown: no service_id",         params2.get("service_id"),  None)

# ---------------------------------------------------------------------------
# is_coupon_eligible（catalog が無ければ True フォールバック）
# ---------------------------------------------------------------------------
print("\n=== is_coupon_eligible ===")
# coworking は eligible_service_ids に含まれるはず
result_cw = is_coupon_eligible("coworking")
print(f"  {PASS if result_cw else FAIL} coworking: {result_cw}")

# corporate プランは対象外のはず（catalog がある場合）
result_corp = is_coupon_eligible("corp_fulltime")
print(f"  {'note'} corp_fulltime: {result_corp} (False if catalog loaded, True if fallback)")

# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------
print(f"\n{'=' * 40}")
if errors == 0:
    print(f"{PASS} 全テスト通過")
else:
    print(f"{FAIL} {errors} 件失敗")
    sys.exit(1)
