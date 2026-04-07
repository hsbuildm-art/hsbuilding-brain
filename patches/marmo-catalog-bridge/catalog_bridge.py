"""
catalog_bridge.py — HSビル マルモ catalog 移行ブリッジ
------------------------------------------------------
既存の service_key を catalog の service_id / offer_id に変換する補助レイヤー。

設計方針:
- 既存ロジックを壊さない（置換ではなく補助）
- このファイルが壊れても bot は動き続ける（全処理を try/except で守る）
- service_key → (service_id, offer_id) の変換テーブルを一元管理
- catalog/offers.json を読んで WELCOME10 を data-driven 化

配置先: /Users/miyakeyuki/hs_a2a/catalog_bridge.py
catalog ファイル検索パス:
  1. /Users/miyakeyuki/hs_a2a/catalog/          (bot 直下)
  2. /Users/miyakeyuki/hsbuilding-brain/catalog/ (兄弟 dir)
  3. このファイルの親 dir の catalog/            (汎用フォールバック)
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# service_key → (service_id, offer_id) 変換テーブル
#
# 既存 service_key は suffix 付き文字列 (例: "coworking_3h", "booth_6h")。
# catalog の offer_id とは命名が異なるため、ここで明示マッピングする。
#
# 注意: catalog に 6h オファーは存在しない。
#   workbooth 6h → wb_8h (上位プランへ丸め)
#   meeting_room 6h → mr_8h (同上)
# ---------------------------------------------------------------------------
_SERVICE_KEY_MAP: dict[str, tuple[str, str]] = {
    # coworking
    "coworking":      ("coworking", "cw_3h"),   # 時間未指定 → デフォルト 3h
    "coworking_1h":   ("coworking", "cw_1h"),
    "coworking_3h":   ("coworking", "cw_3h"),
    "coworking_6h":   ("coworking", "cw_8h"),   # 6h → 8h に丸め
    "coworking_8h":   ("coworking", "cw_8h"),
    # workbooth (既存では "workbooth_Xh" と "booth_Xh" が混在)
    "workbooth":      ("workbooth", "wb_1h"),   # 時間未指定 → デフォルト 1h
    "workbooth_1h":   ("workbooth", "wb_1h"),
    "workbooth_3h":   ("workbooth", "wb_3h"),
    "workbooth_6h":   ("workbooth", "wb_8h"),   # 6h → 8h に丸め
    "workbooth_8h":   ("workbooth", "wb_8h"),
    "booth_1h":       ("workbooth", "wb_1h"),
    "booth_3h":       ("workbooth", "wb_3h"),
    "booth_6h":       ("workbooth", "wb_8h"),   # 6h → 8h に丸め
    "booth_8h":       ("workbooth", "wb_8h"),
    # meeting_room
    "meeting_room":   ("meeting_room", "mr_3h"),  # 時間未指定 → デフォルト 3h
    "mr_1h":          ("meeting_room", "mr_1h"),
    "mr_3h":          ("meeting_room", "mr_3h"),
    "mr_6h":          ("meeting_room", "mr_8h"),  # 6h → 8h に丸め
    "mr_8h":          ("meeting_room", "mr_8h"),
    # music_studio
    "music_studio":   ("music_studio", "ms_3h"),  # 時間未指定 → デフォルト 3h
    "studio_1h":      ("music_studio", "ms_1h"),
    "studio_3h":      ("music_studio", "ms_3h"),
    "studio_8h":      ("music_studio", "ms_8h"),
    # classroom
    "classroom":      ("classroom", "cr_1h"),
    "classroom_1h":   ("classroom", "cr_1h"),
    # virtual_office (予約不要 / チケット型に近い)
    "virtual_office": ("virtual_office", "vo_base"),
}

# ---------------------------------------------------------------------------
# catalog ファイルパス解決
# ---------------------------------------------------------------------------
def _find_catalog_dir() -> Optional[Path]:
    candidates = [
        Path("/Users/miyakeyuki/hs_a2a/catalog"),
        Path("/Users/miyakeyuki/hsbuilding-brain/catalog"),
        Path(__file__).parent / "catalog",
        Path(__file__).parent.parent / "hsbuilding-brain" / "catalog",
    ]
    for p in candidates:
        if p.is_dir():
            return p
    return None


# ---------------------------------------------------------------------------
# offers.json ロード（遅延・キャッシュ）
# ---------------------------------------------------------------------------
_offers_cache: Optional[dict] = None

def _load_offers() -> dict:
    global _offers_cache
    if _offers_cache is not None:
        return _offers_cache

    catalog_dir = _find_catalog_dir()
    if catalog_dir is None:
        logger.warning("catalog_bridge: catalog dir not found, using empty offers")
        _offers_cache = {}
        return _offers_cache

    offers_path = catalog_dir / "offers.json"
    if not offers_path.exists():
        logger.warning(f"catalog_bridge: {offers_path} not found")
        _offers_cache = {}
        return _offers_cache

    try:
        _offers_cache = json.loads(offers_path.read_text(encoding="utf-8"))
        logger.info(f"catalog_bridge: loaded offers from {offers_path}")
    except Exception as e:
        logger.warning(f"catalog_bridge: failed to load offers.json: {e}")
        _offers_cache = {}

    return _offers_cache


# ---------------------------------------------------------------------------
# services.json ロード（遅延・キャッシュ）
# ---------------------------------------------------------------------------
_services_cache: Optional[dict] = None

def _load_services() -> dict:
    global _services_cache
    if _services_cache is not None:
        return _services_cache

    catalog_dir = _find_catalog_dir()
    if catalog_dir is None:
        _services_cache = {}
        return _services_cache

    services_path = catalog_dir / "services.json"
    if not services_path.exists():
        _services_cache = {}
        return _services_cache

    try:
        _services_cache = json.loads(services_path.read_text(encoding="utf-8"))
    except Exception as e:
        logger.warning(f"catalog_bridge: failed to load services.json: {e}")
        _services_cache = {}

    return _services_cache


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def resolve_catalog(service_key: str) -> Optional[tuple[str, str]]:
    """
    service_key を (service_id, offer_id) に変換する。
    テーブルにない場合は None を返す（既存ロジックへフォールバック）。

    Usage:
        result = resolve_catalog("coworking_3h")
        # → ("coworking", "cw_3h")
        result = resolve_catalog("unknown_key")
        # → None
    """
    try:
        return _SERVICE_KEY_MAP.get(service_key)
    except Exception as e:
        logger.warning(f"catalog_bridge.resolve_catalog error: {e}")
        return None


def get_welcome_coupon_text() -> str:
    """
    offers.json からアクティブな WELCOME10 クーポンテキストを返す。
    ファイルが読めない場合はハードコードにフォールバック。

    Usage:
        msg += f"\\n\\n{get_welcome_coupon_text()}"
    """
    try:
        offers = _load_offers()
        for coupon in offers.get("coupons", []):
            if coupon.get("coupon_id") == "WELCOME10":
                cid = coupon["coupon_id"]
                desc = coupon.get("description", "初回限定")
                return f"🎁 クーポンコード: {cid}（{desc}）"
    except Exception as e:
        logger.warning(f"catalog_bridge.get_welcome_coupon_text error: {e}")
    # フォールバック: 既存ハードコードと同一文字列
    return "🎁 クーポンコード: WELCOME10（初回限定）"


def is_coupon_eligible(service_id: str) -> bool:
    """
    service_id が WELCOME10 の対象かどうかを offers.json から判定。
    ファイルが読めない場合は True（既存動作: 常に表示）を返す。
    """
    try:
        offers = _load_offers()
        for coupon in offers.get("coupons", []):
            if coupon.get("coupon_id") == "WELCOME10":
                eligible = coupon.get("eligible_service_ids", [])
                return service_id in eligible
    except Exception as e:
        logger.warning(f"catalog_bridge.is_coupon_eligible error: {e}")
    return True  # フォールバック: 表示する（既存動作）


def build_booking_params(
    service_key: str,
    date: str,
    start_time: str,
) -> dict:
    """
    既存 params に service_id / offer_id を付加した dict を返す。
    a2a_booking_link エンドポイントが両方受け取れる設計を前提とする。

    Usage:
        params = build_booking_params("coworking_3h", "2026-04-07", "10:00")
        resp = client.get(A2A_BOOKING_LINK_URL, params=params)

    後方互換: resolve_catalog が None の場合は service_key だけを渡す（既存動作と同じ）。
    """
    params: dict = {
        "service_key": service_key,
        "date": date,
        "start_time": start_time,
    }
    try:
        result = resolve_catalog(service_key)
        if result is not None:
            service_id, offer_id = result
            params["service_id"] = service_id
            params["offer_id"] = offer_id
    except Exception as e:
        logger.warning(f"catalog_bridge.build_booking_params error: {e}")
    return params


def reload_cache() -> None:
    """
    キャッシュを強制クリア（テスト用 / offers.json 更新後の反映）。
    """
    global _offers_cache, _services_cache
    _offers_cache = None
    _services_cache = None
    logger.info("catalog_bridge: cache cleared")
