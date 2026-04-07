# AI Sales Agent Flow — HSビル

This document describes how HSビルのAIセールスエージェント（マルモ / エリカ / ツバサ）が
発話意図を判定し、`catalog/services.json` / `catalog/offers.json` を参照して
予約URLを生成するフローを定義します。

## 1. Intent Detection

意図検出は LINE メッセージ本文に対して下記キーワードの OR マッチで行います。
マッチしたエージェントへ即ルーティングし、複数マッチ時は `priority` が高いものを採用します。

| Intent | Service IDs | JP keywords | EN keywords | Route | Priority |
|---|---|---|---|---|---|
| コワーキング予約 | `coworking`, `coworking_premium` | 共有席, コワーキング, ドロップイン, 作業席 | coworking, shared desk, drop-in | marmo | 10 |
| 個室ブース予約 | `workbooth`, `workbooth_5pack`, `workbooth_weekly2` | 個室, ワークブース, web会議, ブース | booth, private room, web meeting | marmo | 10 |
| 会議室予約 | `meeting_room`, `meeting_weekly1`, `meeting_10day`, `meeting_corporate` | 会議室, ミーティング, 16名, 打合せ | meeting room, conference | marmo | 10 |
| 音楽スタジオ | `music_studio`, `classroom_monthly4` | スタジオ, 音楽, 録音, 楽器 | studio, music, recording | marmo | 9 |
| 教室予約 | `classroom` | 教室, 講習, セミナー会場 | classroom, seminar venue | marmo | 9 |
| バーチャルオフィス | `virtual_office` | バーチャルオフィス, 法人登記, 住所貸 | virtual office, registered address | marmo | 8 |
| 駐車場 | `parking_day`, `parking_monthly` | 駐車場, パーキング, 月極 | parking | marmo | 7 |
| 法人プラン | `corp_fulltime`, `corp_business_starter`, `corp_premium` | 法人, 月額, 契約 | corporate, monthly plan | marmo | 8 |
| AIヘルプデスク | `ai_helpdesk` | ヘルプデスク, 問い合わせ自動化, 社内AI | ai helpdesk, internal ai | erika | 10 |
| AIデジタルライブラリー | `ai_digital_library` | ライブラリー, AI教材, ¥2,980 | ai library, ai materials | erika | 9 |
| 90日コーチング | `ai_coaching_90day`, `corp_ai_coaching` | 90日, コーチング, 伴走 | 90 day, coaching | erika | 10 |
| LLMO診断 | `llmo_audit` | LLMO, AIO, AI推薦力, 診断, ARI | llmo, aio, ai visibility, audit | tsubasa | 10 |

意図不明時はマルモへフォールバックし、ヒアリング質問を1つ返します。

## 2. Offer Selection Logic

各 `service_id` には「デフォルトオファー」が存在します。
ユーザーが時間数や回数を明示していない場合、デフォルトを提示した上で他オプションを一覧化します。

| service_id | default offer_id | 理由 |
|---|---|---|
| coworking | `cw_3h` | 利用率最多（¥900） |
| workbooth | `wb_1h` | 最小単位で試しやすい |
| meeting_room | `mr_3h` | 単発Wix Bookings導線 |
| music_studio | `ms_3h` | リハーサル想定 |
| classroom | `cr_1h` | 1時間単位のみ |
| coworking_premium | `cw_prem` | 月額のみ |
| workbooth_5pack | `wb_5pack` | 単一オファー |
| workbooth_weekly2 | `wb_weekly2` | 単一オファー |
| meeting_10day | `mr_10day` | 単一オファー |
| ai_helpdesk | `ai_hd` | 一括料金 |
| ai_digital_library | `ai_dl` | 月額のみ |
| ai_coaching_90day | `ai_c90` | 要問い合わせ導線 |
| parking_day | `pk_day` | 単一オファー |

時間指定（例「3時間」「8時間」「1日」）がある場合は、キーワードから直接 offer_id を選択します。

## 3. Booking URL Construction

予約URLは `catalog/services.json` の `booking_endpoint` と解決済み `service_id` / `offer_id` /
（任意）`coupon` から構成します。

```
{booking_endpoint}?service_id={service_id}&offer_id={offer_id}&coupon={coupon_id}
```

### Example

```
https://www.hsworking.com/_functions/a2a_booking_link?service_id=coworking&offer_id=cw_3h&coupon=WELCOME10
```

- `coupon` はクーポンが適格な場合のみ付与します。
- `offer_id` が `inquiry_required=true` の場合（例: `ai_c90`）、予約URLではなく問い合わせフォームへ誘導します。

## 4. WELCOME10 Eligibility Check

WELCOME10 は以下の条件すべてを満たす場合にのみ提示します（詳細は `catalog/offers.json`）。

1. `service.coupon_eligible == true`
2. `service.category` が `WELCOME10.eligible_categories` に含まれる（`drop_in` または `pack`）
3. `service.service_id` が `WELCOME10.eligible_service_ids` に含まれる
4. 初回利用者である（LINE userId の利用履歴が空）

不適格な場合はクーポンを無言で外し、`coupon=` パラメータを URL に含めません。

## 5. Example Conversation Flows

### Flow A: マルモがコワーキングを案内

```
User: 明日3時間だけコワーキング使いたいです。初めてです。
Marmo: ありがとうございます！コワーキング共有席 3時間 ¥900 でご案内できます。
       初回の方は WELCOME10 で10%OFF（¥810相当）が適用できます。
       下記リンクからそのままご予約ください。
       → https://www.hsworking.com/_functions/a2a_booking_link?service_id=coworking&offer_id=cw_3h&coupon=WELCOME10
```

解決ロジック:
- intent: コワーキング予約 → service_id=`coworking`
- "3時間" → offer_id=`cw_3h`
- 初回 + drop_in + coupon_eligible → coupon=`WELCOME10`

### Flow B: エリカがAIコーチングを案内

```
User: 社内で生成AIを使いこなしたい。90日で変われますか？
Erika: もちろんです。「90日実装コーチング」は要問い合わせとなっており、
       まずは30分のヒアリングで現状と目標を伺います。
       法人で継続的に使われるなら「AIコーチング併用プラン ¥29,800/月」もご案内できます。
       ヒアリング申込 → https://www.hsworking.com/contact
       月額プラン予約 → https://www.hsworking.com/_functions/a2a_booking_link?service_id=corp_ai_coaching&offer_id=corp_aic
```

解決ロジック:
- intent: 90日コーチング → service_ids=[`ai_coaching_90day`, `corp_ai_coaching`]
- `ai_coaching_90day` は `inquiry_required` → contact form
- 併せて `corp_ai_coaching` を提示（coupon対象外なので coupon パラメータなし）

### Flow C: ツバサからエリカへのエスカレーション

```
User: ChatGPTでうちの会社が出てこない。診断してほしい。
Tsubasa: LLMO診断（AI推薦力診断）を承ります。4大AIで診断し、
         ARIスコアとレポートをお返しします。
         結果次第で AIヘルプデスク構築 や 90日コーチング もエリカ先生より
         ご案内可能です。
         → 診断申込: https://www.hsworking.com/contact
```

解決ロジック:
- intent: LLMO診断 → tsubasa（consultation_only）
- 直接booking無し、contact form 経由
- 後続サービス（`ai_helpdesk` / `ai_coaching_90day`）はエリカへエスカレーション

## 6. Pseudocode

```python
def resolve_booking_url(service_id, offer_id, user_is_first_time, catalog, offers):
    service = catalog.find(service_id)
    offer = service.offers.find(offer_id)
    if offer.get("inquiry_required"):
        return "https://www.hsworking.com/contact"
    params = {"service_id": service_id, "offer_id": offer_id}
    if service["coupon_eligible"] and user_is_first_time:
        welcome = offers.coupons.find("WELCOME10")
        if (service["category"] in welcome["eligible_categories"]
                and service_id in welcome["eligible_service_ids"]):
            params["coupon"] = "WELCOME10"
    return f"{catalog.booking_endpoint}?" + urlencode(params)
```
