"""
booking_link_helper_patch.py
------------------------------
booking_link_helper.py に追加・変更する差分のみ。
既存ファイルは壊さず、このパッチを適用する。

適用手順:
  Step 1: catalog_bridge.py を /Users/miyakeyuki/hs_a2a/ に配置
  Step 2: catalog/ を /Users/miyakeyuki/hs_a2a/catalog/ にコピー
  Step 3: booking_link_helper.py の先頭 import ブロックに下記を追加
  Step 4: build_ticket_message の WELCOME10 文字列を置換
  Step 5: call_booking_link_sync の WELCOME10 文字列を置換
  Step 6: call_booking_link_sync の params 生成を build_booking_params に置換
"""

# ===========================================================================
# STEP 3: booking_link_helper.py の import ブロック末尾に追加
# ===========================================================================

try:
    from catalog_bridge import (
        get_welcome_coupon_text,
        is_coupon_eligible,
        build_booking_params,
        resolve_catalog,
    )
    _CATALOG_BRIDGE_AVAILABLE = True
except ImportError:
    # catalog_bridge.py が未配置の場合: フォールバック関数を定義
    _CATALOG_BRIDGE_AVAILABLE = False

    def get_welcome_coupon_text() -> str:
        return "🎁 クーポンコード: WELCOME10（初回限定）"

    def is_coupon_eligible(service_id: str) -> bool:
        return True

    def build_booking_params(service_key, date, start_time) -> dict:
        return {"service_key": service_key, "date": date, "start_time": start_time}

    def resolve_catalog(service_key):
        return None


# ===========================================================================
# STEP 4: build_ticket_message の変更箇所（1行だけ）
#
# before:
#     f"🎁 クーポンコード: WELCOME10（初回限定）"
#
# after:
#     get_welcome_coupon_text()
# ===========================================================================

def build_ticket_message_patched(service_key: str, TICKET_SERVICES: dict) -> str:
    """
    既存 build_ticket_message の差分版。
    TICKET_SERVICES は booking_link_helper.py のグローバル変数を渡す。
    実際の適用は既存関数内の 1 行を置き換えるだけ。
    """
    ticket = TICKET_SERVICES[service_key]
    return (
        f"マルモくん: {ticket['name']}のご案内です🙂\n\n"
        f"コワーキング共有席は【チケット制】です。\n"
        f"予約枠の確保は不要で、営業時間内（8:00〜23:00）であれば\n"
        f"いつでもご来店・ご利用いただけます。\n\n"
        f"📌 {ticket['name']}（{ticket['price']}円）\n"
        f"ご購入はこちら👇\n"
        f"{ticket['url']}\n\n"
        f"{get_welcome_coupon_text()}"   # ← WELCOME10 をここで data-driven 化
    )


# ===========================================================================
# STEP 5 + 6: call_booking_link_sync の変更箇所
#
# 変更点 A: params 生成を build_booking_params に置換
#   before:
#       resp = client.get(A2A_BOOKING_LINK_URL, params={
#           "service_key": service_key,
#           "date": date,
#           "start_time": start_time,
#       })
#   after:
#       params = build_booking_params(service_key, date, start_time)
#       resp = client.get(A2A_BOOKING_LINK_URL, params=params)
#
# 変更点 B: no_match ブロック末尾の WELCOME10 文字列
#   before:
#       msg += "\n\n🎁 クーポンコード: WELCOME10（初回限定）"
#   after:
#       msg += f"\n\n{get_welcome_coupon_text()}"
#
# 変更点 C: 2 回目の GET（nearest_available 用）も同様
#   before:
#       resp2 = client2.get(A2A_BOOKING_LINK_URL, params={
#           "service_key": service_key,
#           "date": date,
#           "start_time": seen[0],
#       })
#   after:
#       params2 = build_booking_params(service_key, date, seen[0])
#       resp2 = client2.get(A2A_BOOKING_LINK_URL, params=params2)
# ===========================================================================

# 差分をそのまま貼り付けられる形で提示:
CALL_BOOKING_LINK_SYNC_DIFF = """
--- a/booking_link_helper.py
+++ b/booking_link_helper.py
@@ import ブロック末尾 @@
+try:
+    from catalog_bridge import get_welcome_coupon_text, build_booking_params
+    _CATALOG_BRIDGE_AVAILABLE = True
+except ImportError:
+    _CATALOG_BRIDGE_AVAILABLE = False
+    def get_welcome_coupon_text():
+        return "🎁 クーポンコード: WELCOME10（初回限定）"
+    def build_booking_params(service_key, date, start_time):
+        return {"service_key": service_key, "date": date, "start_time": start_time}

@@ build_ticket_message @@
-        f"🎁 クーポンコード: WELCOME10（初回限定）"
+        f"{get_welcome_coupon_text()}"

@@ call_booking_link_sync — 1回目 GET @@
-            resp = client.get(A2A_BOOKING_LINK_URL, params={
-                "service_key": service_key,
-                "date": date,
-                "start_time": start_time,
-            })
+            params = build_booking_params(service_key, date, start_time)
+            resp = client.get(A2A_BOOKING_LINK_URL, params=params)

@@ call_booking_link_sync — no_match WELCOME10 @@
-            msg += "\\n\\n🎁 クーポンコード: WELCOME10（初回限定）"
+            msg += f"\\n\\n{get_welcome_coupon_text()}"

@@ call_booking_link_sync — 2回目 GET (nearest) @@
-                        resp2 = client2.get(A2A_BOOKING_LINK_URL, params={
-                            "service_key": service_key,
-                            "date": date,
-                            "start_time": seen[0],
-                        })
+                        params2 = build_booking_params(service_key, date, seen[0])
+                        resp2 = client2.get(A2A_BOOKING_LINK_URL, params=params2)
"""
