# marmo-catalog-bridge

マルモ（LINE bot）を HSビル AI-native booking structure へ段階移行するためのパッチセット。

## 目的

既存の `booking_link_helper.py` を壊さずに、`catalog/services.json` / `catalog/offers.json` を補助レイヤーとして追加する。

## ファイル構成

| ファイル | 役割 |
|---------|------|
| `catalog_bridge.py` | 本番に配置するブリッジモジュール |
| `booking_link_helper_patch.py` | `booking_link_helper.py` への差分（5箇所） |
| `test_catalog_bridge.py` | 単体テスト（本番を止めずに確認可能） |

## 適用手順

```bash
# 1. catalog_bridge.py を bot ディレクトリに配置
cp patches/marmo-catalog-bridge/catalog_bridge.py /Users/miyakeyuki/hs_a2a/

# 2. catalog/ を bot ディレクトリにコピー
cp -r catalog/ /Users/miyakeyuki/hs_a2a/catalog/

# 3. テスト実行（本番を止めずに確認）
cd /Users/miyakeyuki/hs_a2a
python3 -c "from catalog_bridge import resolve_catalog; print(resolve_catalog('coworking_3h'))"
# → ('coworking', 'cw_3h')

# 4. booking_link_helper.py に差分を適用
# booking_link_helper_patch.py の CALL_BOOKING_LINK_SYNC_DIFF を参照

# 5. マルモ再起動
```

## 変更箇所（最小差分）

1. `import` ブロック末尾に `catalog_bridge` を try/except でインポート
2. `build_ticket_message` の WELCOME10 文字列 → `get_welcome_coupon_text()`
3. `call_booking_link_sync` の 1回目 GET params → `build_booking_params()`
4. no_match ブロックの WELCOME10 文字列 → `get_welcome_coupon_text()`
5. 2回目 GET（nearest）の params → `build_booking_params()`

## フォールバック

`catalog_bridge.py` が未配置 / `catalog/` が存在しない場合、既存動作と同一のハードコードにフォールバックします。**bot は止まりません。**

## セキュリティ

- `.env` / token 類は含まない
- 本番の `hs_a2a/` 実体コードは含まない
- catalog JSON に個人情報・認証情報なし
