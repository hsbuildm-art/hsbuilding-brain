// backend/http-functions.js
// ──────────────────────────────────────────────────────────
// HSビル・ワーキングスペース ── A2A / AIO 統合エンドポイント
// マージ版 v2.6.0  2026-02-28
// ──────────────────────────────────────────────────────────
// ★ v2.5.0 → v2.6.0 変更点:
//   1. jstToUtc() / utcToJst() ヘルパー関数追加
//   2. get_a2a_booking_link: start_time を JST として処理
//      - スロットマッチング: JST→UTC変換後にUTC文字列で検索
//      - alternatives: UTC→JSTに変換して返す
//      - booking_form_url: UTC→JSTに変換してURL生成
//      - displayEnd: UTC→JSTに変換して表示
//      - response slot: start_utc/end_utc + start_jst/end_jst を返す
//      - ?timezone=UTC パラメータ追加（外部AI後方互換用）
//   3. get_a2a_availability: slots に startDate_jst/endDate_jst 追加
//   4. buildLlmTxt: Updated 2026-02-28、start_time JST明記
//   ※ 既存 POST 系は一切変更なし
// ──────────────────────────────────────────────────────────

import { bookings, services, availabilityCalendar } from 'wix-bookings.v2';
import { checkout } from 'wix-ecom-backend';
import wixSecretsBackend from 'wix-secrets-backend';
import { ok, badRequest, serverError } from 'wix-http-functions';
import { elevate } from 'wix-auth';
import wixData from "wix-data";

const BASE_URL = "https://www.hsworking.com";
const OFFICIAL_URL_PREFIX = `${BASE_URL}/`;

const KNOWLEDGE_BASE = {
  repository: "https://github.com/hsbuildm-art/hsbuilding-brain",
  claude_md: "https://github.com/hsbuildm-art/hsbuilding-brain/blob/main/CLAUDE.md",
  agents_md: "https://github.com/hsbuildm-art/hsbuilding-brain/blob/main/AGENTS.md",
  knowledge_dir: "https://github.com/hsbuildm-art/hsbuilding-brain/tree/main/knowledge",
  linebot_architecture: "https://github.com/hsbuildm-art/hsbuilding-brain/blob/main/knowledge/linebot-architecture.md",
  ai_staff: "https://github.com/hsbuildm-art/hsbuilding-brain/tree/main/ai-staff",
  operations: "https://github.com/hsbuildm-art/hsbuilding-brain/tree/main/operations",
  prompts: "https://github.com/hsbuildm-art/hsbuilding-brain/tree/main/prompts",
  consulting: "https://github.com/hsbuildm-art/hsbuilding-brain/tree/main/consulting"
};

const CANONICAL = {
  name_ja: "HSビル・ワーキングスペース",
  name_en: "HS Building Working Space",
  address_ja: "奈良県奈良市西大寺北町1丁目2-4 ハッピースクールビル",
  access_ja: "近鉄 大和西大寺駅 徒歩4分",
  hours_ja: "8:00〜23:00（原則）",
  timezone: "Asia/Tokyo",
  phone: "0742-51-7830",
  email: "hsbuild.m@gmail.com",
  a2a_master: `${BASE_URL}/a2a-master`,
  agent_card_human: `${BASE_URL}/agent-card`,
  a2a_human: `${BASE_URL}/a2a`,
  a2a_catalog: `${BASE_URL}/_functions/a2a_catalog`,
  a2a_catalog_txt: `${BASE_URL}/a2a_catalog.txt`,
  llm_txt: `${BASE_URL}/llm.txt`,
  llms_txt: `${BASE_URL}/llms.txt`
};

const COUPON_CODE = "WELCOME10";
const COUPON_NOTE = `初回ご利用の方はチェックアウト画面でクーポンコード「${COUPON_CODE}」を入力すると割引が適用されます。※お一人様1回限り（2回目以降は自動で無効になります）`;

const SERVICE_SLUGS = {
  "coworking":       "コワーキングスペース-1時間",
  "coworking_3h":    "コワーキングスペース-3時間",
  "coworking_8h":    "コワーキングスペース-8時間",
  "workbooth":       "テレワーク個室ブース",
  "workbooth_3h":    "テレワーク個室ブース-3時間プラン",
  "workbooth_6h":    "テレワーク個室ブース-6時間プラン",
  "workbooth_8h":    "テレワーク個室ブース-8時間プラン",
  "meeting_room":    "2階-会議室",
  "meeting_room_3h": "2階-会議室-3時間プラン",
  "meeting_room_6h": "2階-会議室-6時間プラン",
  "meeting_room_1d": "2階-会議室-1日プラン",
  "music_studio":    "音楽スタジオ通常プラン",
  "music_studio_3h": "音楽スタジオ3時間プラン",
  "music_studio_1d": "音楽スタジオ1日貸切",
};

// ===== 共通ヘッダー =====
const headersJSONBase = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key"
};

const headersTextBase = {
  "Content-Type": "text/plain; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

// ===== レスポンスヘルパー =====
function jsonResp(obj, cacheSeconds = 300) {
  return ok({
    headers: { ...headersJSONBase, "Cache-Control": `public, max-age=${cacheSeconds}` },
    body: JSON.stringify(obj)
  });
}

function textResp(body, cacheSeconds = 300) {
  return ok({
    headers: { ...headersTextBase, "Cache-Control": `public, max-age=${cacheSeconds}` },
    body
  });
}

function corsOKJSON(cacheSeconds = 300) {
  return ok({
    headers: { ...headersJSONBase, "Cache-Control": `public, max-age=${cacheSeconds}` },
    body: ""
  });
}

function corsOKText(cacheSeconds = 300) {
  return ok({
    headers: { ...headersTextBase, "Cache-Control": `public, max-age=${cacheSeconds}` },
    body: ""
  });
}

// ===== ユーティリティ =====
function toISO(d) {
  try { return d ? new Date(d).toISOString() : null; } catch (e) { return null; }
}

function freshnessFrom(lastUpdatedISO) {
  if (!lastUpdatedISO) return { label: "stale", age_minutes: null };
  const nowMs = Date.now();
  const lastMs = Date.parse(lastUpdatedISO);
  if (Number.isNaN(lastMs)) return { label: "stale", age_minutes: null };
  const ageMinutes = Math.max(0, Math.round((nowMs - lastMs) / 60000));
  const label = ageMinutes <= 60 ? "fresh" : "stale";
  return { label, age_minutes: ageMinutes };
}

function generateId() {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

// ★ v2.5.0 追加: Shareable Booking Form URL 生成
function buildBookingFormUrl({ serviceId, resourceId, startDate, endDate, timezone = "Asia/Tokyo", slug }) {
  const basePath = slug
    ? `${BASE_URL}/booking-form/${encodeURIComponent(slug)}`
    : `${BASE_URL}/book-online`;
  const params = new URLSearchParams();
  if (serviceId)  params.set("bookings_serviceId", serviceId);
  if (resourceId) params.set("bookings_resourceId", resourceId);
  if (startDate)  params.set("bookings_startDate", startDate);
  if (endDate)    params.set("bookings_endDate", endDate);
  params.set("bookings_timezone", timezone);
  return `${basePath}?${params.toString()}`;
}

// ★ v2.5.0 追加: LINE 返信用メッセージ組み立て
function buildLineMessage({ date, startTime, endTime, serviceName, bookingUrl, couponCode }) {
  let msg = `✅ ${date} ${startTime}〜${endTime || ""} ${serviceName} 空きあり！\n`;
  msg += `👉 ご予約はこちら:\n${bookingUrl}\n\n`;
  msg += `🎁 クーポンコード: ${couponCode}\n`;
  msg += `チェックアウト画面で入力してください（初回限定・自動判定）`;
  return msg;
}

// ============================================================
// ★ v2.6.0 追加: タイムゾーン変換ヘルパー（JST ↔ UTC）
// start_time は JST として処理するための変換ユーティリティ
// ============================================================

/**
 * JST日時 → UTCに変換
 * @param {string} dateStr "YYYY-MM-DD" (JST日付)
 * @param {string} timeStr "HH:mm" (JST時刻)
 * @returns {{ utcDate: Date, utcDateStr: string, utcTimeStr: string }}
 */
function jstToUtc(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute]     = timeStr.split(':').map(Number);
  let utcHour = hour - 9;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (utcHour < 0) {
    utcHour += 24;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  const pad = n => String(n).padStart(2, '0');
  const utcDateStr = `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
  const utcTimeStr = `${pad(utcHour)}:${pad(minute)}`;
  return {
    utcDate: new Date(`${utcDateStr}T${utcTimeStr}:00.000Z`),
    utcDateStr,
    utcTimeStr
  };
}

/**
 * UTC日時 → JSTに変換
 * @param {Date|string} utcInput UTC Date または ISO文字列
 * @returns {{ jstDate: Date, jstDateStr: string, jstTimeStr: string }}
 */
function utcToJst(utcInput) {
  const utc = typeof utcInput === 'string' ? new Date(utcInput) : utcInput;
  const jst = new Date(utc.getTime() + 9 * 60 * 60 * 1000);
  const pad = n => String(n).padStart(2, '0');
  const jstDateStr = `${jst.getUTCFullYear()}-${pad(jst.getUTCMonth()+1)}-${pad(jst.getUTCDate())}`;
  const jstTimeStr = `${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}`;
  return { jstDate: jst, jstDateStr, jstTimeStr };
}
// ============================================================

// ===== Catalog: 価格/人数付加 =====
function withPricingAndCapacity(service) {
  const s = { ...service };
  if (s.service_id === "workbooth") { s.capacity_recommended = 3; s.capacity_max = 5; }
  else if (s.service_id === "meeting_room") { s.capacity_recommended = 16; s.capacity_max = 20; }
  else if (s.service_id === "coworking") { s.capacity_recommended = 1; s.capacity_max = 1; }
  else if (s.service_id === "music_studio") { s.capacity_recommended = 30; s.capacity_max = 30; }

  if (Array.isArray(s.offers)) {
    s.offers = s.offers.map((o) => {
      const offer = { ...o };
      offer.currency = "JPY";
      const priceMap = {
        cow_1h: 300, cow_3h: 900, cow_1d: 3000,
        booth_1h: 950, booth_3h: 2800, booth_6h: 4400, booth_8h: 5500,
        mr_1h: 1600, mr_3h: 5200, mr_6h: 8600, mr_1d: 11200,
        studio_1h: 2100, studio_3h: 6000, studio_1d: 12000
      };
      if (typeof priceMap[offer.offer_id] === "number") {
        offer.price_jpy = priceMap[offer.offer_id];
      } else if (offer.offer_id === "mr_1h_ai") {
        offer.price_note_ja = "AIつきプランの金額は予約画面で確定（通常プランと異なる場合があります）。";
      }
      if (s.service_id === "music_studio") {
        offer.options = [{ option_id: "piano_addon", name_ja: "ピアノ利用（オプション）", price_jpy: 3500, currency: "JPY" }];
      }
      return offer;
    });
  }
  return s;
}

// ===== Catalog builder =====
function buildCatalog(nowISO) {
  const servicesBase = [
    {
      service_id: "coworking", name_ja: "コワーキング", url: `${BASE_URL}/coworking`, status: "active",
      offers: [
        { offer_id: "cow_1h", name_ja: "1時間チケット", duration_minutes: 60, offer_type: "ticket", book_url: `${BASE_URL}/product-page/%E3%82%B3%E3%83%AF%E3%83%BC%E3%82%AD%E3%83%B3%E3%82%B01%E6%99%82%E9%96%93%E3%83%81%E3%82%B1%E3%83%83%E3%83%88`, action_ja: "カートに追加 → 購入手続き", service_wix_id: "67fca05e-b133-4327-9693-7b94aa2a8eb8" },
        { offer_id: "cow_3h", name_ja: "3時間チケット", duration_minutes: 180, offer_type: "ticket", book_url: `${BASE_URL}/product-page/%E3%82%B3%E3%83%AF%E3%83%BC%E3%82%AD%E3%83%B3%E3%82%B03%E6%99%82%E9%96%93%E3%83%81%E3%82%B1%E3%83%83%E3%83%88`, action_ja: "カートに追加 → 購入手続き", service_wix_id: "63fa908e-1292-4a28-9601-956a984a1440" },
        { offer_id: "cow_1d", name_ja: "1日フリーパス", duration_label_ja: "1日", offer_type: "ticket", book_url: `${BASE_URL}/product-page/%E3%82%B3%E3%83%AF%E3%83%BC%E3%82%AD%E3%83%B3%E3%82%B01%E6%97%A5%E3%83%95%E3%83%AA%E3%83%BC%E3%83%91%E3%82%B9`, action_ja: "カートに追加 → 購入手続き" }
      ]
    },
    {
      service_id: "workbooth", name_ja: "テレワーク個室ブース", url: `${BASE_URL}/workbooth`, status: "active",
      offers: [
        { offer_id: "booth_1h", name_ja: "1時間", duration_minutes: 60, offer_type: "booking", book_url: `${BASE_URL}/service-page/%E3%83%86%E3%83%AC%E3%83%AF%E3%83%BC%E3%82%AF%E5%80%8B%E5%AE%A4%E3%83%96%E3%83%BC%E3%82%B9`, action_ja: "今すぐ予約 → 日時選択 → 決済", service_wix_id: "164a90ff-2963-41f9-9a13-f5fbf65b479c" },
        { offer_id: "booth_3h", name_ja: "3時間プラン", duration_minutes: 180, offer_type: "booking", book_url: `${BASE_URL}/service-page/%E3%83%86%E3%83%AC%E3%83%AF%E3%83%BC%E3%82%AF%E5%80%8B%E5%AE%A4%E3%83%96%E3%83%BC%E3%82%B9-3%E6%99%82%E9%96%93%E3%83%97%E3%83%A9%E3%83%B3`, action_ja: "今すぐ予約 → 日時選択 → 決済", service_wix_id: "0aacf3c3-ca8e-42b6-ac9b-d9add3ff8c89" },
        { offer_id: "booth_6h", name_ja: "6時間プラン", duration_minutes: 360, offer_type: "booking", book_url: `${BASE_URL}/service-page/%E3%83%86%E3%83%AC%E3%83%AF%E3%83%BC%E3%82%AF%E5%80%8B%E5%AE%A4%E3%83%96%E3%83%BC%E3%82%B9-6%E6%99%82%E9%96%93%E3%83%97%E3%83%A9%E3%83%B3`, action_ja: "今すぐ予約 → 日時選択 → 決済", service_wix_id: "e1fd6153-0724-4be3-a836-22c374cc8db1" },
        { offer_id: "booth_8h", name_ja: "8時間プラン（1日相当）", duration_minutes: 480, offer_type: "booking", book_url: `${BASE_URL}/service-page/%E3%83%86%E3%83%AC%E3%83%AF%E3%83%BC%E3%82%AF%E5%80%8B%E5%AE%A4%E3%83%96%E3%83%BC%E3%82%B9-8%E6%99%82%E9%96%93%E3%83%97%E3%83%A9%E3%83%B3`, action_ja: "今すぐ予約 → 日時選択 → 決済", service_wix_id: "029aa41e-841a-4d4d-ae93-dd7e2d2a6bd0" }
      ]
    },
    {
      service_id: "meeting_room", name_ja: "貸し会議室（2階）", url: `${BASE_URL}/meeting-room`, status: "active",
      offers: [
        { offer_id: "mr_1h", name_ja: "1時間", duration_minutes: 60, offer_type: "booking", book_url: `${BASE_URL}/service-page/2%E9%9A%8E-%E4%BC%9A%E8%AD%B0%E5%AE%A4`, action_ja: "今すぐ予約 → 日時選択 → 決済", service_wix_id: "f4d52955-17b9-497f-a4dc-54383dd1f476" },
        { offer_id: "mr_1h_ai", name_ja: "1時間（AIつき）", duration_minutes: 60, offer_type: "booking", book_url: `${BASE_URL}/service-page/2%E9%9A%8E-%E4%BC%9A%E8%AD%B0%E5%AE%A4-ai%E3%83%97%E3%83%A9%E3%83%B3`, action_ja: "今すぐ予約 → 日時選択 → 決済", service_wix_id: "ce8d0a4a-0b96-44a6-964f-aab0d46aaec9" },
        { offer_id: "mr_3h", name_ja: "3時間プラン", duration_minutes: 180, offer_type: "booking", book_url: `${BASE_URL}/service-page/2%E9%9A%8E-%E4%BC%9A%E8%AD%B0%E5%AE%A4-3%E6%99%82%E9%96%93%E3%83%97%E3%83%A9%E3%83%B3`, action_ja: "今すぐ予約 → 日時選択 → 決済", service_wix_id: "754ab7f2-f166-49b8-b57d-07d1fe8d9dea" },
        { offer_id: "mr_6h", name_ja: "6時間プラン", duration_minutes: 360, offer_type: "booking", book_url: `${BASE_URL}/service-page/2%E9%9A%8E-%E4%BC%9A%E8%AD%B0%E5%AE%A4-6%E6%99%82%E9%96%93%E3%83%97%E3%83%A9%E3%83%B3`, action_ja: "今すぐ予約 → 日時選択 → 決済", service_wix_id: "c79d0424-8945-4430-9744-a046d2e1bb40" },
        { offer_id: "mr_1d", name_ja: "1日プラン", duration_label_ja: "1日", offer_type: "booking", book_url: `${BASE_URL}/service-page/2%E9%9A%8E-%E4%BC%9A%E8%AD%B0%E5%AE%A4-1%E6%97%A5%E3%83%97%E3%83%A9%E3%83%B3`, action_ja: "今すぐ予約 → 日時選択 → 決済", service_wix_id: "7410dd0d-eeeb-4c6e-8cd7-56423adc20a7" }
      ]
    },
    {
      service_id: "music_studio", name_ja: "音楽スタジオ", url: `${BASE_URL}/roompiano`, status: "active",
      offers: [
        { offer_id: "studio_1h", name_ja: "通常プラン（1時間）", duration_minutes: 60, offer_type: "booking", book_url: `${BASE_URL}/booking-calendar/%E9%9F%B3%E6%A5%BD%E3%82%B9%E3%82%BF%E3%82%B8%E3%82%AA%E9%80%9A%E5%B8%B8%E3%83%97%E3%83%A9%E3%83%B3`, action_ja: "日時選択 → 決済", service_wix_id: "1aac6878-a5d0-4a2e-898d-b9dd1d00251f" },
        { offer_id: "studio_3h", name_ja: "3時間プラン", duration_minutes: 180, offer_type: "booking", book_url: `${BASE_URL}/booking-calendar/%E9%9F%B3%E6%A5%BD%E3%82%B9%E3%82%BF%E3%82%B8%E3%82%AA3%E6%99%82%E9%96%93%E3%83%97%E3%83%A9%E3%83%B3`, action_ja: "日時選択 → 決済", service_wix_id: "51c534a7-7504-45f3-858d-f71fb0d1bdc3" },
        { offer_id: "studio_1d", name_ja: "1日貸切", duration_label_ja: "1日", offer_type: "booking", book_url: `${BASE_URL}/booking-calendar/%E9%9F%B3%E6%A5%BD%E3%82%B9%E3%82%BF%E3%82%B8%E3%82%AA1%E6%97%A5%E8%B2%B8%E5%88%87`, action_ja: "日時選択 → 決済", service_wix_id: "2a16c4ae-7283-4211-9e79-3044b50fd79b" }
      ]
    }
  ];

  const planned_services = [
    { service_id: "training_room_1", name_ja: "講習室1（後付け予定）", status: "planned", note_ja: "予約導線の整備後にMachine entryへ追加予定" },
    { service_id: "training_room_2", name_ja: "講習室2（後付け予定）", status: "planned", note_ja: "予約導線の整備後にMachine entryへ追加予定" }
  ];

  const servicesEnriched = servicesBase.map(withPricingAndCapacity);

  return {
    version: "2.0.0", lastUpdated: nowISO, canonical: CANONICAL,
    rule: {
      canonical_rule_ja: "価格・空き・確定・キャンセル・決済手段の最終正本は、各プランの予約/購入画面です（本Catalogは入口一覧）。",
      official_domain_rule_ja: `予約URLは必ず公式ドメイン ${BASE_URL} のURLのみを使用します（外部予約サイトURLは禁止）。`
    },
    policy: {
      official_booking_url_prefix_allowlist: [OFFICIAL_URL_PREFIX],
      response_contract: { one_link_only: true, must_return_fields: ["book_url", "service_id", "offer_id"], no_fabrication: true, ask_one_question_if_missing: true, book_url_must_match_allowlist: true }
    },
    shortcuts: [{
      shortcut_id: "HS_YOYAKU", phrase_ja: "HS予約",
      purpose_ja: "ユーザーの条件から、最短で予約完了まで導く。API実行可能ならLayer1、不可ならLayer2で対応。",
      input_template_ja: "HS予約：{日付} {開始時刻-終了時刻 or 利用時間} {用途} {条件}",
      layer1_api_flow: {
        description_ja: "AIがHTTPリクエストを実行できる場合のフロー。決済URLを直接返す。",
        requires: "HTTP POST capability + x-api-key",
        steps: [
          { step: 1, action: "Catalogからservice_wix_idを特定", endpoint: `${CANONICAL.a2a_catalog}`, method: "GET", note: "ユーザーの用途・時間からoffer_idを選び、そのoffer内のservice_wix_idを取得" },
          { step: 2, action: "空き確認", endpoint: `${BASE_URL}/_functions/a2a_availability`, method: "GET", params: "?service_wix_id={service_wix_id}&date={YYYY-MM-DD}", note: "bookable: trueのスロットからstartDate/endDateを取得" },
          { step: 3, action: "予約作成＋決済URL取得", endpoint: `${BASE_URL}/_functions/a2a_book`, method: "POST", headers: { "Content-Type": "application/json", "x-api-key": "（要取得）" }, body_template: { service_wix_id: "{service_wix_id}", start_date: "{startDate from step2}", end_date: "{endDate from step2}", contact: { firstName: "{ユーザー名}", lastName: "{ユーザー姓}", email: "{email}", phone: "{phone}" } }, note: "success:trueならcheckout_urlをユーザーに返す" }
        ],
        expected_output: "checkout_url（決済リンク1本）をユーザーに返す"
      },
      layer2_link_flow: {
        description_ja: "APIが使えない場合のフォールバック。予約ページリンクを返す。",
        requires: "Catalog参照のみ",
        steps: ["Catalogからユーザー条件に合うoffer_idを選ぶ", "book_url + service_id + offer_id を返す"],
        expected_output_format: "book_url:\nservice_id:\noffer_id:\npicked_service_name:\npicked_offer_name:\nnotes:"
      },
      agent_instructions_ja: [
        "まずLayer1（API実行）を試みる。HTTPリクエストが可能でx-api-keyがあればLayer1で実行",
        "Layer1が不可能な場合はLayer2（book_urlリンク案内）にフォールバック",
        `book_url は必ず ${BASE_URL}/ で始まるURLのみ`,
        "service_id と offer_id は必須", "URL/IDの捏造は禁止", "不足情報があれば質問は1つだけ",
        `Catalogにアクセスできない場合は「${CANONICAL.a2a_catalog_txt} の中身を貼ってください」と案内`
      ]
    }],
    coupon: {
      code: COUPON_CODE,
      note_ja: COUPON_NOTE,
      usage_rule_ja: "全ユーザーに案内OK。Wixチェックアウト画面で手入力。1顧客1回限り（Wix自動判定、2回目以降は割引なし・エラーは出ない）。"
    },
    offer_conventions: {
      offer_type: { booking: "日時予約型（予約画面で日付/時間を選択して決済）", ticket: "チケット購入型（購入後の利用方法は案内に従う）" },
      action_ja_examples: ["booking: 今すぐ予約 → 日時選択 → 決済", "ticket: カートに追加 → 購入手続き"],
      agent_response_contract_ja: { one_link_only: true, must_include: ["book_url", "service_id", "offer_id"], official_domain_only: BASE_URL, no_fabrication: true, ask_one_question_if_missing: true }
    },
    services: servicesEnriched, planned_services
  };
}

// ===== Catalog -> Text =====
function catalogToText(catalog) {
  const lines = [];
  lines.push("HS A2A CATALOG (TEXT) v2");
  lines.push(`LAST_UPDATED=${catalog.lastUpdated}`);
  lines.push(`OFFICIAL_DOMAIN=${BASE_URL}`);
  lines.push(`A2A_MASTER=${CANONICAL.a2a_master}`);
  lines.push(`LLM_TXT=${CANONICAL.llm_txt}`);
  lines.push(`CATALOG_JSON=${CANONICAL.a2a_catalog}`);
  lines.push("");
  lines.push("# HS予約 (合言葉)");
  lines.push("# INPUT: HS予約：{日付} {開始-終了 or 利用時間} {用途} {条件}");
  lines.push("# RULE: Catalog参照→最短リンクを1本／service_id & offer_id必須／捏造禁止／不足は質問1つ");
  lines.push(`# OFFICIAL ONLY: book_urlは必ず ${BASE_URL}/ のみ（外部予約サイトURL禁止）`);
  lines.push(`# COUPON: ${COUPON_CODE} — ${COUPON_NOTE}`);
  lines.push("");
  lines.push("# FORMAT");
  lines.push("# service_id | offer_id | service_name_ja | offer_name_ja | offer_type | duration | capacity(rec/max) | price_jpy | service_wix_id | book_url");
  lines.push("");
  for (const s of catalog.services || []) {
    const cap = (typeof s.capacity_recommended === "number" && typeof s.capacity_max === "number") ? `${s.capacity_recommended}/${s.capacity_max}` : "-/-";
    if (!Array.isArray(s.offers)) { lines.push(`${s.service_id} | - | ${s.name_ja || "-"} | - | ${s.status || "-"} | - | ${cap} | - | - | -`); continue; }
    for (const o of s.offers) {
      const dur = typeof o.duration_minutes === "number" ? `${o.duration_minutes}m` : (o.duration_label_ja || "-");
      const price = typeof o.price_jpy === "number" ? String(o.price_jpy) : (o.price_note_ja ? "NOTE" : "-");
      const wixId = o.service_wix_id || "-";
      lines.push(`${s.service_id} | ${o.offer_id} | ${s.name_ja} | ${o.name_ja} | ${o.offer_type} | ${dur} | ${cap} | ${price} | ${wixId} | ${o.book_url}`);
    }
  }
  if (Array.isArray(catalog.planned_services) && catalog.planned_services.length) {
    lines.push(""); lines.push("# PLANNED (not in active catalog)");
    for (const ps of catalog.planned_services) { lines.push(`${ps.service_id} | planned | ${ps.name_ja} | - | planned | - | -/- | - | - | -`); }
  }
  return lines.join("\n");
}

/* ==========================================================
   ███ ENDPOINTS ███
   ========================================================== */

/* ===== 1) Catalog ===== */
export function options_a2a_catalog() { return corsOKJSON(300); }
export function get_a2a_catalog() { return jsonResp(buildCatalog(new Date().toISOString()), 300); }

/* ===== 1b) Catalog TEXT ===== */
export function options_a2a_catalog_txt() { return corsOKText(300); }
export function get_a2a_catalog_txt() { return textResp(catalogToText(buildCatalog(new Date().toISOString())), 300); }

/* ===== 2) Agent Card (既存・人間向け) ===== */
export function options_agent_card() { return corsOKJSON(300); }
export function get_agent_card() {
  return jsonResp({
    version: "2.0.0", type: "agent_card", name: CANONICAL.name_en,
    description_ja: "奈良・大和西大寺の静けさ×無人運営を軸に、集中/会議/制作を完走させるためのワーク拠点。A2A Catalogに各サービス×各時間プランの予約/購入リンクを掲載。混雑/貸切/イベント/ネット回線は Live Status を参照。",
    canonical_a2a_master: CANONICAL.a2a_master,
    knowledge_base: KNOWLEDGE_BASE,
    human_entries: { agent_card: CANONICAL.agent_card_human, a2a: CANONICAL.a2a_human },
    machine_endpoints: {
      catalog: CANONICAL.a2a_catalog, catalog_text: `${BASE_URL}/_functions/a2a_catalog_txt`,
      availability: `${BASE_URL}/_functions/a2a_availability`, book: `${BASE_URL}/_functions/a2a_book`,
      booking_link: `${BASE_URL}/_functions/a2a_booking_link`,
      facts: `${BASE_URL}/_functions/a2a_facts`, live_status: `${BASE_URL}/_functions/a2a_live_status`,
      live_status_text: `${BASE_URL}/_functions/a2a_live_status_txt`,
      llm_txt: `${BASE_URL}/_functions/llm_txt`, llms_txt: `${BASE_URL}/_functions/llms_txt`,
      a2a_rpc: `${BASE_URL}/_functions/a2a_rpc`, a2a_agent_card: `${BASE_URL}/_functions/a2a_agent_card`
    },
    coupon: { code: COUPON_CODE, note_ja: COUPON_NOTE }
  }, 300);
}

/* ===== 2b) A2A Agent Card (A2Aプロトコル準拠) ===== */
export function options_a2a_agent_card() { return corsOKJSON(3600); }
export function get_a2a_agent_card() {
  return ok({
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({
      name: "マルモ - ハッピースクールビル予約エージェント",
      description: "奈良県奈良市西大寺のコワーキングスペース・テレワーク個室ブース・貸し会議室・音楽スタジオの空き確認と予約を実行するAIエージェントです。",
      url: `${BASE_URL}/_functions/a2a`,
      version: "1.0.0", protocolVersion: "0.3.0",
      defaultInputModes: ["text/plain", "application/json"],
      defaultOutputModes: ["application/json"],
      capabilities: { streaming: false, pushNotifications: false },
      documentation: {
        knowledge_base: KNOWLEDGE_BASE.repository,
        claude_instructions: KNOWLEDGE_BASE.claude_md,
        agents_instructions: KNOWLEDGE_BASE.agents_md,
        knowledge_files: KNOWLEDGE_BASE.knowledge_dir,
        linebot_architecture: KNOWLEDGE_BASE.linebot_architecture,
        ai_staff_personas: KNOWLEDGE_BASE.ai_staff,
        context_continuity_note: "新しいセッションでHSビルについて対応する際は、上記リポジトリのCLAUDE.md（Claude系）またはAGENTS.md（GPT系）を最初に参照してください。事業知識・システム構成・AIスタッフ設定・運用ルールがすべて格納されています。"
      },
      skills: [
        { id: "check_availability", name: "空き確認", description: "指定された施設と日付の空き時間スロットを返します。施設はコワーキング、テレワーク個室ブース、貸し会議室（2階）、音楽スタジオから選べます。", tags: ["coworking", "booking", "availability", "奈良", "nara", "workspace"], examples: ["個室ブースの明日の空きを教えて", "会議室 2月28日 の空き状況", "Is the music studio available on March 1st?"], inputModes: ["text/plain", "application/json"], outputModes: ["application/json"] },
        { id: "create_booking", name: "予約作成", description: "施設・日時・時間を指定して仮予約を作成し、決済用checkout URLを返します。予約確定には決済が必要です。", tags: ["coworking", "booking", "reservation", "checkout", "payment"], examples: ["個室ブース 3時間 明日 9:00 で予約", "Book a meeting room for 3 hours on Feb 28 at 10:00"], inputModes: ["application/json"], outputModes: ["application/json"] }
      ],
      securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "x-api-key" } },
      security: [{ apiKey: [] }]
    }, null, 2)
  });
}

/* ===== 3) Facts ===== */
export function options_a2a_facts() { return corsOKJSON(86400); }
export function get_a2a_facts() {
  return jsonResp({
    version: "2.0.0", type: "facts", name_ja: CANONICAL.name_ja, name_en: CANONICAL.name_en,
    address_ja: CANONICAL.address_ja, access_ja: CANONICAL.access_ja, hours_ja: CANONICAL.hours_ja,
    timezone: CANONICAL.timezone, phone: CANONICAL.phone, email: CANONICAL.email,
    canonical_rule_ja: "価格/空き/確定/キャンセル/決済は各プランの予約/購入画面が正本です。",
    official_domain_rule_ja: `予約URLは必ず公式ドメイン ${BASE_URL} のみ（外部予約サイトURLは禁止）。`,
    coupon: { code: COUPON_CODE, note_ja: COUPON_NOTE }
  }, 86400);
}

/* ===== 4) Live Status ===== */
export function options_a2a_live_status() { return corsOKJSON(60); }
export async function get_a2a_live_status() {
  const nowISO = new Date().toISOString();
  const now = new Date();
  const [netRes, facRes, cowRes, blockRes, eventRes, noticeRes] = await Promise.all([
    wixData.query("Ops_NetworkStatus").descending("date").limit(1).find().catch(() => ({ items: [] })),
    wixData.query("Ops_FacilityStatus").descending("timestamp").limit(1).find().catch(() => ({ items: [] })),
    wixData.query("Ops_CoworkingLive").descending("timestamp").limit(1).find().catch(() => ({ items: [] })),
    wixData.query("Ops_CoworkingBlocks").ge("end", now).ascending("start").limit(10).find().catch(() => ({ items: [] })),
    wixData.query("Ops_CommunityEvents").ge("start", now).ascending("start").limit(10).find().catch(() => ({ items: [] })),
    wixData.query("Ops_Notices").ge("valid_until", now).descending("timestamp").limit(10).find().catch(() => ({ items: [] }))
  ]);
  const net = netRes.items?.[0] ?? null; const fac = facRes.items?.[0] ?? null; const cow = cowRes.items?.[0] ?? null;
  const netUpdated = toISO(net?.date); const facUpdated = toISO(fac?.timestamp); const cowUpdated = toISO(cow?.timestamp);
  const network = { status: net?.status ?? "unknown", down_mbps: typeof net?.down_mbps === "number" ? net.down_mbps : null, up_mbps: typeof net?.up_mbps === "number" ? net.up_mbps : null, note: net?.note ?? null, last_updated: netUpdated, freshness: freshnessFrom(netUpdated) };
  const facility = { crowd_level: fac?.crowd_level ?? "unknown", noise_level: fac?.noise_level ?? "unknown", note: fac?.note ?? null, last_updated: facUpdated, freshness: freshnessFrom(facUpdated) };
  const coworkingLive = { occupancy: typeof cow?.occupancy === "number" ? cow.occupancy : null, capacity: typeof cow?.capacity === "number" ? cow.capacity : null, method: cow?.method ?? "estimate", note: cow?.note ?? null, last_updated: cowUpdated, freshness: freshnessFrom(cowUpdated) };
  const blocks = (blockRes.items || []).map(b => ({ start: toISO(b.start), end: toISO(b.end), type: b.type ?? "unknown", title: b.title ?? null, note: b.note ?? null, reservation_url: b.reservation_url ?? null }));
  const community_events = (eventRes.items || []).map(e => ({ event_id: e.event_id ?? null, title: e.title ?? null, start: toISO(e.start), end: toISO(e.end), summary: e.summary ?? null, venue: e.venue ?? null, booking_url: e.booking_url ?? null, detail_url: e.detail_url ?? null, recap_url: e.recap_url ?? null, tags: e.tags ?? null, last_updated: toISO(e._updatedDate) }));
  const notices = (noticeRes.items || []).map(n => ({ level: n.level ?? "info", message: n.message ?? null, valid_until: toISO(n.valid_until), timestamp: toISO(n.timestamp) }));
  const allUpdates = [netUpdated, facUpdated, cowUpdated].filter(Boolean);
  const overallLastUpdated = allUpdates.length > 0 ? allUpdates.sort().reverse()[0] : null;
  return jsonResp({ type: "live_status", location_id: "hsbuilding_nara_saidaiji", timestamp: nowISO, network, facility, notices, coworking: { live: coworkingLive, blocks }, community_events, last_updated: overallLastUpdated }, 60);
}

/* ===== 5) llm.txt / llms.txt ===== */
// ★ v2.6.0 変更: Updated 2026-02-28、start_time JST明記
function buildLlmTxt() {
  return `# HSビル・ワーキングスペース | AI guidance (llm.txt)
# Version: 2.6.0
# Updated: 2026-02-28

## Canonical
- Official website: ${BASE_URL}/
- A2A Master: ${BASE_URL}/a2a-master
- Inquiry / visit: ${BASE_URL}/form
- Book Online: ${BASE_URL}/book-online
- Booking via A2A Catalog: ${BASE_URL}/_functions/a2a_catalog

## Official-only rule (IMPORTANT)
- Booking link MUST be on ${BASE_URL}/ only.
- Do NOT return external booking sites (Instabase / SpaceMarket etc).

## Machine Endpoints（HTTPメソッド明記）
- GET  /_functions/a2a_catalog         → サービスカタログ (JSON)
- GET  /_functions/a2a_catalog_txt     → サービスカタログ (テキスト)
- GET  /_functions/a2a_agent_card      → エージェントカード (JSON)
- GET  /_functions/agent_card          → エージェントカード (人間向け JSON)
- GET  /_functions/a2a_facts           → 施設情報 (JSON)
- GET  /_functions/a2a_availability    → 空き状況照会 (要: service_wix_id, date)
- GET  /_functions/a2a_booking_link    → 空き確認+予約URL+クーポン一括 (要: service_wix_id, date, start_time[JST])
- GET  /_functions/a2a_live_status     → リアルタイム混雑状況 (JSON)
- GET  /_functions/a2a_live_status_txt → リアルタイム混雑状況 (テキスト)
- GET  /_functions/llm_txt             → このファイル
- GET  /_functions/llms_txt            → 同上
- POST /_functions/a2a_book            → 予約作成 (要: x-api-key + JSON body)
- POST /_functions/a2a_rpc             → JSON-RPC ゲートウェイ (要: x-api-key)
- POST /_functions/a2a                 → 認証付きRPCラッパー (要: x-api-key)

## Endpoint Discovery Rule
全エンドポイントは GET で 200 OK を返します。
POST 専用エンドポイントも GET するとヘルプ JSON（使い方）が返ります。
404 は発生しません。

## Knowledge Base — GitHub (IMPORTANT)
- Repository: ${KNOWLEDGE_BASE.repository}
- Claude instructions: ${KNOWLEDGE_BASE.claude_md}
- GPT/Codex instructions: ${KNOWLEDGE_BASE.agents_md}
- Business knowledge: ${KNOWLEDGE_BASE.knowledge_dir}
- LINEbot architecture: ${KNOWLEDGE_BASE.linebot_architecture}
- AI staff personas (Erika/Tsubasa/Marumo): ${KNOWLEDGE_BASE.ai_staff}
- Operations: ${KNOWLEDGE_BASE.operations}
- Prompts: ${KNOWLEDGE_BASE.prompts}
- Consulting: ${KNOWLEDGE_BASE.consulting}

## Context continuity rule (IMPORTANT)
1. Read this llm.txt FIRST.
2. Read the GitHub repository for full business knowledge.
3. For Claude: read CLAUDE.md. For GPT/Codex: read AGENTS.md.
4. Do NOT ask the user to re-explain documented info.

## Coupon (IMPORTANT — 全ユーザーに案内OK)
- Code: ${COUPON_CODE}
- 案内文: ${COUPON_NOTE}
- Wixチェックアウト画面で手動入力。1顧客1回限り。
- Wixが自動で使用済み判定 → 2回目以降は割引なし（エラーは出ない）。
- 予約案内時は必ずクーポンコードも添えること。

## Recommended Booking Flow（推奨: a2a_booking_link 利用）
1. カタログから service_wix_id を特定
2. GET /_functions/a2a_booking_link?service_wix_id=XXX&date=YYYY-MM-DD&start_time=HH:mm(JST)&service_key=YYY
   ※ start_time は JST で指定してください（例: 18:00 = 午後6時）
   ※ timezone=UTC パラメータで UTC指定も可能（外部AI後方互換用）
3. レスポンスの booking_form_url をユーザーに返す
4. line_message フィールドにクーポン案内込み定型文あり → LINE Botはそのまま返信可能
※ POST /_functions/a2a_book による直接予約作成も利用可能（要 API key）

## Shortcut (合言葉)
"HS予約" → a2a_booking_link を呼び出し → booking_form_url + coupon を返す

## Primary "Book Now" paths (humans)
- Coworking: ${BASE_URL}/coworking
- Work booth: ${BASE_URL}/workbooth
- Meeting room: ${BASE_URL}/meeting-room
- Music studio: ${BASE_URL}/roompiano
- Virtual office: ${BASE_URL}/virtual-office
- AI solutions: ${BASE_URL}/ai-solutions

## Real-time availability
- Live Status (human): ${BASE_URL}/live-status
- Live Status (text): ${BASE_URL}/_functions/a2a_live_status_txt
- Live Status (JSON): ${BASE_URL}/_functions/a2a_live_status

## Agent booking rule (MOST IMPORTANT)
When the user request includes date/time, ALWAYS do:
1) Use Catalog to find matching service/offer.
2) Return ONLY ONE best booking link (book_url) + service_id + offer_id.
3) Also include coupon code ${COUPON_CODE} in the response.
If no exact match: return closest alternative + fallback ${BASE_URL}/form

## Pricing consistency rule
If any price differs across pages, treat the booking/payment screen as the final source of truth.

## Attribution (optional)
utm_source=ai&utm_medium=a2a&utm_campaign=agent_booking

## LINE Official Accounts
- マルモ（施設案内・予約）: @090mrhbt — https://page.line.me/090mrhbt
- エリカのAI相談（AI相談・週次AIトレンド配信）: @968rcbue
- AI経営企画室（経営戦略）: 準備中

## Automated Services
- Weekly AI Trend Report: 毎週月曜8:00、エリカのAI相談(@968rcbue)から全友だちにAIニュース3選を自動配信。Google News RSS → JAN 4B要約 → LINE broadcast。
- Weekly Internal Report: 毎週月曜9:00、マルモ/エリカのログ分析結果を管理者に配信。
- Morning Status: 毎日11:00、室内状況+予約+入金リマインドをGAS経由で通知。
`;
}

export function options_llm_txt() { return corsOKText(3600); }
export function get_llm_txt() { return textResp(buildLlmTxt(), 3600); }
export function options_llms_txt() { return corsOKText(3600); }
export function get_llms_txt() { return textResp(buildLlmTxt(), 3600); }

/* ===== POST Live Status Update ===== */
export async function post_a2a_live_status_update(request) {
  try {
    const body = await request.body.json();
    const apiKey = request.headers["x-api-key"] || "";
    if (apiKey !== "hs2026live") {
      return ok({ headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "unauthorized" }) });
    }
    const { collection, data } = body;
    const allowed = ["Ops_CoworkingLive", "Ops_FacilityStatus", "Ops_NetworkStatus"];
    if (!allowed.includes(collection)) {
      return ok({ headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "invalid_collection", allowed }) });
    }
    const record = { ...data };
    if (collection === "Ops_NetworkStatus") { record.date = new Date(); } else { record.timestamp = new Date(); }
    const result = await wixData.insert(collection, record);
    return ok({ headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, id: result._id }) });
  } catch (err) {
    return ok({ headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "update_failed", detail: err.message }) });
  }
}

/* ===== .well-known/agent.json ===== */
export function get_well_known_agent_json() {
  return jsonResp({
    name: "HS Building Working Space",
    description: "奈良・大和西大寺の静けさ×集中に最適化されたビジネスアトリエ。コワーキング・個室ブース・会議室・音楽スタジオ・バーチャルオフィスを提供。リアルタイム空き状況・料金プラン・施設情報のAPI照会および対話型予約案内が可能。",
    url: `${BASE_URL}/_functions/a2a_rpc`,
    provider: { organization: "HSビル・ワーキングスペース", url: BASE_URL },
    version: "2.0.0", documentationUrl: `${BASE_URL}/_functions/llm_txt`,
    knowledge_base: KNOWLEDGE_BASE,
    capabilities: { streaming: false, pushNotifications: false, stateTransitionHistory: true },
    defaultInputModes: ["text/plain"], defaultOutputModes: ["application/json", "text/plain"],
    skills: [
      { id: "check_availability", name: "空き状況確認", description: "コワーキングスペースのリアルタイム空き状況（利用人数/定員）、混雑度、騒音レベル、ネットワーク速度を返します。", tags: ["availability", "realtime", "coworking", "occupancy"], examples: ["今空いてますか？", "コワーキングの混雑状況", "Wi-Fiの速度"], inputModes: ["text/plain"], outputModes: ["application/json"] },
      { id: "book_facility", name: "施設予約（対話型）", description: "コワーキング・個室ブース・会議室・音楽スタジオの予約を対話形式で案内します。施設や利用時間が不明な場合は質問し、条件が揃ったら最適な予約URLを1件返します。マルチターン対応。", tags: ["booking", "reservation", "multi-turn", "catalog"], examples: ["予約したい", "会議室を3時間予約したい", "明日コワーキング使いたい", "音楽スタジオ1日貸切"], inputModes: ["text/plain"], outputModes: ["application/json"] },
      { id: "browse_catalog", name: "料金プラン検索", description: "全施設の料金プランと予約URLの一覧を返します。", tags: ["pricing", "catalog"], examples: ["料金を教えて", "コワーキングはいくら？"], inputModes: ["text/plain"], outputModes: ["application/json"] },
      { id: "get_facts", name: "施設情報照会", description: "営業時間・住所・アクセス・電話番号・設備一覧などの基本情報を返します。", tags: ["info", "hours", "access", "contact"], examples: ["営業時間は？", "駐車場ありますか？"], inputModes: ["text/plain"], outputModes: ["application/json"] }
    ]
  }, 3600);
}

/* ==========================================================
   ███ A2A RPC v2.0 — マルチターン予約対話対応 ███
   ========================================================== */

const BOOKING_CATALOG = {
  coworking: {
    name_ja: "コワーキング",
    offers: [
      { offer_id: "cow_1h", name_ja: "1時間チケット", duration: 60, price: 300, book_url: `${BASE_URL}/product-page/%E3%82%B3%E3%83%AF%E3%83%BC%E3%82%AD%E3%83%B3%E3%82%B01%E6%99%82%E9%96%93%E3%83%81%E3%82%B1%E3%83%83%E3%83%88` },
      { offer_id: "cow_3h", name_ja: "3時間チケット", duration: 180, price: 900, book_url: `${BASE_URL}/product-page/%E3%82%B3%E3%83%AF%E3%83%BC%E3%82%AD%E3%83%B3%E3%82%B03%E6%99%82%E9%96%93%E3%83%81%E3%82%B1%E3%83%83%E3%83%88` },
      { offer_id: "cow_1d", name_ja: "1日フリーパス", duration: 480, price: 3000, book_url: `${BASE_URL}/product-page/%E3%82%B3%E3%83%AF%E3%83%BC%E3%82%AD%E3%83%B3%E3%82%B01%E6%97%A5%E3%83%95%E3%83%AA%E3%83%BC%E3%83%91%E3%82%B9` }
    ]
  },
  workbooth: {
    name_ja: "テレワーク個室ブース",
    offers: [
      { offer_id: "booth_1h", name_ja: "1時間", duration: 60, price: 950, book_url: `${BASE_URL}/service-page/%E3%83%86%E3%83%AC%E3%83%AF%E3%83%BC%E3%82%AF%E5%80%8B%E5%AE%A4%E3%83%96%E3%83%BC%E3%82%B9` },
      { offer_id: "booth_3h", name_ja: "3時間プラン", duration: 180, price: 2800, book_url: `${BASE_URL}/service-page/%E3%83%86%E3%83%AC%E3%83%AF%E3%83%BC%E3%82%AF%E5%80%8B%E5%AE%A4%E3%83%96%E3%83%BC%E3%82%B9-3%E6%99%82%E9%96%93%E3%83%97%E3%83%A9%E3%83%B3` },
      { offer_id: "booth_6h", name_ja: "6時間プラン", duration: 360, price: 4400, book_url: `${BASE_URL}/service-page/%E3%83%86%E3%83%AC%E3%83%AF%E3%83%BC%E3%82%AF%E5%80%8B%E5%AE%A4%E3%83%96%E3%83%BC%E3%82%B9-6%E6%99%82%E9%96%93%E3%83%97%E3%83%A9%E3%83%B3` },
      { offer_id: "booth_8h", name_ja: "8時間プラン（1日相当）", duration: 480, price: 5500, book_url: `${BASE_URL}/service-page/%E3%83%86%E3%83%AC%E3%83%AF%E3%83%BC%E3%82%AF%E5%80%8B%E5%AE%A4%E3%83%96%E3%83%BC%E3%82%B9-8%E6%99%82%E9%96%93%E3%83%97%E3%83%A9%E3%83%B3` }
    ]
  },
  meeting_room: {
    name_ja: "貸し会議室（2階）",
    offers: [
      { offer_id: "mr_1h", name_ja: "1時間", duration: 60, price: 1600, book_url: `${BASE_URL}/service-page/2%E9%9A%8E-%E4%BC%9A%E8%AD%B0%E5%AE%A4` },
      { offer_id: "mr_3h", name_ja: "3時間プラン", duration: 180, price: 5200, book_url: `${BASE_URL}/service-page/2%E9%9A%8E-%E4%BC%9A%E8%AD%B0%E5%AE%A4-3%E6%99%82%E9%96%93%E3%83%97%E3%83%A9%E3%83%B3` },
      { offer_id: "mr_6h", name_ja: "6時間プラン", duration: 360, price: 8600, book_url: `${BASE_URL}/service-page/2%E9%9A%8E-%E4%BC%9A%E8%AD%B0%E5%AE%A4-6%E6%99%82%E9%96%93%E3%83%97%E3%83%A9%E3%83%B3` },
      { offer_id: "mr_1d", name_ja: "1日プラン", duration: 480, price: 11200, book_url: `${BASE_URL}/service-page/2%E9%9A%8E-%E4%BC%9A%E8%AD%B0%E5%AE%A4-1%E6%97%A5%E3%83%97%E3%83%A9%E3%83%B3` }
    ]
  },
  music_studio: {
    name_ja: "音楽スタジオ",
    offers: [
      { offer_id: "studio_1h", name_ja: "通常プラン（1時間）", duration: 60, price: 2100, book_url: `${BASE_URL}/booking-calendar/%E9%9F%B3%E6%A5%BD%E3%82%B9%E3%82%BF%E3%82%B8%E3%82%AA%E9%80%9A%E5%B8%B8%E3%83%97%E3%83%A9%E3%83%B3` },
      { offer_id: "studio_3h", name_ja: "3時間プラン", duration: 180, price: 6000, book_url: `${BASE_URL}/booking-calendar/%E9%9F%B3%E6%A5%BD%E3%82%B9%E3%82%BF%E3%82%B8%E3%82%AA3%E6%99%82%E9%96%93%E3%83%97%E3%83%A9%E3%83%B3` },
      { offer_id: "studio_1d", name_ja: "1日貸切", duration: 480, price: 12000, book_url: `${BASE_URL}/booking-calendar/%E9%9F%B3%E6%A5%BD%E3%82%B9%E3%82%BF%E3%82%B8%E3%82%AA1%E6%97%A5%E8%B2%B8%E5%88%87` }
    ]
  }
};

function detectBookingIntent(t) { return /予約|よやく|book|reserve|利用したい|使いたい|借りたい/.test(t); }
function detectService(t) {
  if (/コワーキング|coworking|コワーク|自習/.test(t)) return "coworking";
  if (/個室|ブース|テレワーク|workbooth|booth/.test(t)) return "workbooth";
  if (/会議室|ミーティング|meeting/.test(t)) return "meeting_room";
  if (/スタジオ|ピアノ|音楽|studio|piano/.test(t)) return "music_studio";
  return null;
}
function detectDuration(t) {
  if (/1日|一日|終日|貸切|1day|fullday/.test(t)) return 480;
  if (/8時間|8h/.test(t)) return 480;
  if (/6時間|6h|半日/.test(t)) return 360;
  if (/3時間|3h/.test(t)) return 180;
  if (/2時間|2h/.test(t)) return 120;
  if (/1時間半|90分|1\.5時間|1\.5h/.test(t)) return 90;
  if (/1時間|1h|60分/.test(t)) return 60;
  return null;
}
function pickOffer(serviceId, durationMin) {
  const svc = BOOKING_CATALOG[serviceId];
  if (!svc) return null;
  const exact = svc.offers.find(o => o.duration === durationMin);
  if (exact) return { match: "exact", offers: [exact] };
  const sorted = [...svc.offers].sort((a, b) => a.duration - b.duration);
  const lower = sorted.filter(o => o.duration < durationMin).pop();
  const upper = sorted.find(o => o.duration > durationMin);
  const candidates = [lower, upper].filter(Boolean);
  if (candidates.length > 0) return { match: "approximate", offers: candidates };
  return { match: "none", offers: svc.offers };
}
function serviceListText() { return Object.values(BOOKING_CATALOG).map(v => v.name_ja).join("・"); }
function durationListText(serviceId) { const svc = BOOKING_CATALOG[serviceId]; if (!svc) return ""; return svc.offers.map(o => o.name_ja).join("・"); }

async function getSession(contextId) {
  try {
    const res = await wixData.query("A2A_Sessions").eq("contextId", contextId).descending("_createdDate").limit(1).find({ suppressAuth: true });
    return res.items.length > 0 ? res.items[0] : null;
  } catch (e) { return null; }
}
async function getSessionByTaskId(taskId) {
  try {
    const res = await wixData.query("A2A_Sessions").eq("title", taskId).limit(1).find({ suppressAuth: true });
    return res.items.length > 0 ? res.items[0] : null;
  } catch (e) { return null; }
}
async function saveSession(session) {
  try {
    if (session._id) { return await wixData.update("A2A_Sessions", session, { suppressAuth: true }); }
    else { return await wixData.insert("A2A_Sessions", session, { suppressAuth: true }); }
  } catch (e) { return null; }
}

function buildInputRequired(rpcId, taskId, contextId, agentText, history) {
  return {
    jsonrpc: "2.0", id: rpcId,
    result: {
      id: taskId, contextId,
      status: { state: "input-required", message: { role: "agent", parts: [{ kind: "text", text: agentText }], messageId: generateId(), taskId, contextId }, timestamp: new Date().toISOString() },
      history, kind: "task"
    }
  };
}
function buildBookingCompleted(rpcId, taskId, contextId, agentText, structuredData, history) {
  return {
    jsonrpc: "2.0", id: rpcId,
    result: {
      id: taskId, contextId,
      status: { state: "completed", timestamp: new Date().toISOString() },
      artifacts: [{ artifactId: generateId(), name: "booking_recommendation", parts: [{ kind: "text", text: agentText }, { kind: "data", data: structuredData }] }],
      history, kind: "task"
    }
  };
}

function rpcMessage(reqId, txt) {
  return jsonResp({ jsonrpc: "2.0", id: reqId, result: { messageId: generateId(), contextId: generateId(), role: "agent", parts: [{ kind: "text", text: txt }], kind: "message" } }, 0);
}
function rpcTaskCompleted(reqId, summaryText, structuredData) {
  const artifacts = [{ artifactId: generateId(), name: "response", parts: [{ kind: "text", text: summaryText }] }];
  if (structuredData) { artifacts.push({ artifactId: generateId(), name: "structured_data", parts: [{ kind: "data", data: structuredData }] }); }
  return jsonResp({ jsonrpc: "2.0", id: reqId, result: { id: generateId(), contextId: generateId(), status: { state: "completed", timestamp: new Date().toISOString() }, artifacts, kind: "task" } }, 0);
}

/* ===== A2A RPC エンドポイント（公開・認証不要） ===== */
export function options_a2a_rpc() { return corsOKJSON(60); }

export async function post_a2a_rpc(request) {
  try {
    const body = await request.body.json();
    if (body.jsonrpc !== "2.0" || !body.method || !body.id) {
      return jsonResp({ jsonrpc: "2.0", id: body.id || null, error: { code: -32600, message: "Invalid Request" } }, 0);
    }
    const rpcId = body.id;
    const method = body.method;
    const params = body.params || {};

    if (method === "tasks/get") {
      const taskId = params.id;
      if (!taskId) return jsonResp({ jsonrpc: "2.0", id: rpcId, error: { code: -32602, message: "Missing task id" } }, 0);
      const session = await getSessionByTaskId(taskId);
      if (!session) return jsonResp({ jsonrpc: "2.0", id: rpcId, error: { code: -32001, message: "Task not found" } }, 0);
      const history = JSON.parse(session.history_json || "[]");
      return jsonResp({ jsonrpc: "2.0", id: rpcId, result: { id: session.title, contextId: session.contextId, status: { state: session.state, timestamp: session.updated || new Date().toISOString() }, history, kind: "task" } }, 0);
    }

    if (method !== "message/send") {
      return jsonResp({ jsonrpc: "2.0", id: rpcId, error: { code: -32601, message: `Method not found: ${method}` } }, 0);
    }

    const message = params.message || {};
    const parts = message.parts || [];
    const userText = parts.filter(p => p.kind === "text").map(p => p.text).join(" ").trim();
    const userTextLower = userText.toLowerCase();
    const incomingContextId = message.contextId || params.contextId;

    if (!userText) return rpcMessage(rpcId, "ご質問をどうぞ。空き状況、料金プラン、予約、施設情報についてお答えできます。");

    let session = null;
    if (incomingContextId) { session = await getSession(incomingContextId); }

    if (session && session.state === "input-required") {
      return await handleBookingContinuation(rpcId, session, userText, userTextLower, message);
    }

    if (detectBookingIntent(userTextLower)) {
      return await handleBookingStart(rpcId, userText, userTextLower, message);
    }

    if (matchesAvailability(userTextLower)) return await handleCheckAvailability(rpcId, userText);
    if (matchesCatalog(userTextLower)) return await handleBrowseCatalog(rpcId, userTextLower);
    return handleGetFacts(rpcId, userTextLower);

  } catch (err) {
    return jsonResp({ jsonrpc: "2.0", id: null, error: { code: -32603, message: "Internal error", data: err.message } }, 0);
  }
}

async function handleBookingStart(rpcId, userText, userTextLower, message) {
  const taskId = generateId(); const contextId = generateId();
  const detectedService = detectService(userTextLower);
  const detectedDuration = detectDuration(userTextLower);
  let history = [{ role: "user", parts: [{ kind: "text", text: userText }], messageId: message.messageId || generateId(), taskId, contextId }];

  if (detectedService && detectedDuration) {
    return await resolveBooking(rpcId, taskId, contextId, detectedService, detectedDuration, history);
  }
  if (detectedService && !detectedDuration) {
    const svcName = BOOKING_CATALOG[detectedService].name_ja;
    const options = durationListText(detectedService);
    const agentText = `${svcName}のご利用ですね。ご利用時間をお知らせください（${options}）`;
    history.push({ role: "agent", parts: [{ kind: "text", text: agentText }], messageId: generateId(), taskId, contextId });
    await saveSession({ title: taskId, contextId, state: "input-required", detected_service: detectedService, detected_duration: null, detected_offer_id: null, history_json: JSON.stringify(history), updated: new Date().toISOString() });
    return jsonResp(buildInputRequired(rpcId, taskId, contextId, agentText, history), 0);
  }
  if (!detectedService && detectedDuration) {
    const agentText = `${detectedDuration}分のご利用ですね。どの施設をご利用ですか？（${serviceListText()}）`;
    history.push({ role: "agent", parts: [{ kind: "text", text: agentText }], messageId: generateId(), taskId, contextId });
    await saveSession({ title: taskId, contextId, state: "input-required", detected_service: null, detected_duration: detectedDuration, detected_offer_id: null, history_json: JSON.stringify(history), updated: new Date().toISOString() });
    return jsonResp(buildInputRequired(rpcId, taskId, contextId, agentText, history), 0);
  }
  const agentText = `ご予約を承ります。どの施設をご利用ですか？（${serviceListText()}）`;
  history.push({ role: "agent", parts: [{ kind: "text", text: agentText }], messageId: generateId(), taskId, contextId });
  await saveSession({ title: taskId, contextId, state: "input-required", detected_service: null, detected_duration: null, detected_offer_id: null, history_json: JSON.stringify(history), updated: new Date().toISOString() });
  return jsonResp(buildInputRequired(rpcId, taskId, contextId, agentText, history), 0);
}

async function handleBookingContinuation(rpcId, session, userText, userTextLower, message) {
  const taskId = session.title; const contextId = session.contextId;
  let history = JSON.parse(session.history_json || "[]");
  history.push({ role: "user", parts: [{ kind: "text", text: userText }], messageId: message.messageId || generateId(), taskId, contextId });
  let detectedService = session.detected_service || null;
  let detectedDuration = session.detected_duration || null;
  const newService = detectService(userTextLower);
  const newDuration = detectDuration(userTextLower);
  if (newService) detectedService = newService;
  if (newDuration) detectedDuration = newDuration;

  if (detectedService && detectedDuration) {
    return await resolveBooking(rpcId, taskId, contextId, detectedService, detectedDuration, history, session);
  }
  if (!detectedService) {
    const agentText = `どの施設をご利用ですか？（${serviceListText()}）`;
    history.push({ role: "agent", parts: [{ kind: "text", text: agentText }], messageId: generateId(), taskId, contextId });
    session.detected_service = null; session.detected_duration = detectedDuration;
    session.history_json = JSON.stringify(history); session.updated = new Date().toISOString();
    await saveSession(session);
    return jsonResp(buildInputRequired(rpcId, taskId, contextId, agentText, history), 0);
  }
  const svcName = BOOKING_CATALOG[detectedService].name_ja;
  const options = durationListText(detectedService);
  const agentText = `${svcName}ですね。ご利用時間をお知らせください（${options}）`;
  history.push({ role: "agent", parts: [{ kind: "text", text: agentText }], messageId: generateId(), taskId, contextId });
  session.detected_service = detectedService; session.detected_duration = null;
  session.history_json = JSON.stringify(history); session.updated = new Date().toISOString();
  await saveSession(session);
  return jsonResp(buildInputRequired(rpcId, taskId, contextId, agentText, history), 0);
}

async function resolveBooking(rpcId, taskId, contextId, serviceId, durationMin, history, existingSession) {
  const result = pickOffer(serviceId, durationMin);
  const svcName = BOOKING_CATALOG[serviceId].name_ja;
  let agentText, structuredData;
  const couponLine = `\n\n🎁 初回ご利用の方はチェックアウト画面でクーポンコード「${COUPON_CODE}」を入力してください。`;
  if (result.match === "exact") {
    const o = result.offers[0];
    agentText = `${svcName}の${o.name_ja}（¥${o.price.toLocaleString()}）をご案内します。\n\n予約はこちら: ${o.book_url}${couponLine}`;
    structuredData = { book_url: o.book_url, service_id: serviceId, offer_id: o.offer_id, name_ja: o.name_ja, price_jpy: o.price, duration_minutes: o.duration, coupon: { code: COUPON_CODE, note_ja: COUPON_NOTE } };
  } else {
    const lines = result.offers.map(o => `・${o.name_ja}（¥${o.price.toLocaleString()}）\n  ${o.book_url}`);
    agentText = `${svcName}で${durationMin}分ぴったりのプランはありませんが、近いプランをご案内します。\n\n${lines.join("\n\n")}\n\nご希望のプランの予約リンクからお手続きください。${couponLine}`;
    structuredData = { service_id: serviceId, candidates: result.offers.map(o => ({ book_url: o.book_url, offer_id: o.offer_id, name_ja: o.name_ja, price_jpy: o.price, duration_minutes: o.duration })), coupon: { code: COUPON_CODE, note_ja: COUPON_NOTE } };
  }
  history.push({ role: "agent", parts: [{ kind: "text", text: agentText }], messageId: generateId(), taskId, contextId });
  const sessionData = { ...(existingSession || {}), title: taskId, contextId, state: "completed", detected_service: serviceId, detected_duration: durationMin, detected_offer_id: result.match === "exact" ? result.offers[0].offer_id : null, history_json: JSON.stringify(history), updated: new Date().toISOString() };
  await saveSession(sessionData);
  return jsonResp(buildBookingCompleted(rpcId, taskId, contextId, agentText, structuredData, history), 0);
}

function matchesAvailability(t) {
  const kw = ["空い", "混雑", "混んで", "occupancy", "availability", "空き", "今", "リアルタイム", "wifi", "wi-fi", "ネット", "回線", "速度"];
  return kw.some(k => t.includes(k));
}
function matchesCatalog(t) {
  const kw = ["料金", "値段", "いくら", "価格", "プラン", "ドロップイン", "チケット", "price", "catalog", "hs予約", "バーチャル", "法人登記"];
  return kw.some(k => t.includes(k));
}

async function handleCheckAvailability(reqId, userText) {
  try {
    const [netRes, facRes, cowRes] = await Promise.all([
      wixData.query("Ops_NetworkStatus").descending("date").limit(1).find().catch(() => ({ items: [] })),
      wixData.query("Ops_FacilityStatus").descending("timestamp").limit(1).find().catch(() => ({ items: [] })),
      wixData.query("Ops_CoworkingLive").descending("timestamp").limit(1).find().catch(() => ({ items: [] }))
    ]);
    const net = netRes.items?.[0]; const fac = facRes.items?.[0]; const cow = cowRes.items?.[0];
    const occ = cow?.occupancy ?? "不明"; const cap = cow?.capacity ?? 14;
    const crowd = fac?.crowd_level ?? "不明"; const noise = fac?.noise_level ?? "不明";
    const down = net?.down_mbps ?? "不明"; const up = net?.up_mbps ?? "不明";
    const summary = `現在のHSビルワーキングスペースの状況です。\n利用人数: ${occ}名 / 定員${cap}席\n混雑度: ${crowd}\n騒音: ${noise}\nWi-Fi: 下り${down}Mbps / 上り${up}Mbps\n営業時間: 8:00〜23:00（年中無休）`;
    const data = { occupancy: occ, capacity: cap, crowd_level: crowd, noise_level: noise, network: { down_mbps: down, up_mbps: up }, hours: "8:00-23:00", live_status_url: `${BASE_URL}/_functions/a2a_live_status` };
    return rpcTaskCompleted(reqId, summary, data);
  } catch (err) {
    return rpcMessage(reqId, `空き状況の取得に失敗しました。直接ご確認ください: ${BASE_URL}/_functions/a2a_live_status`);
  }
}

async function handleBrowseCatalog(reqId, userText) {
  const nowISO = new Date().toISOString();
  const catalog = buildCatalog(nowISO);
  let matchedService = null;
  if (/会議|ミーティング/.test(userText)) matchedService = catalog.services.find(s => s.service_id === "meeting_room");
  else if (/個室|ブース|テレワーク/.test(userText)) matchedService = catalog.services.find(s => s.service_id === "workbooth");
  else if (/スタジオ|ピアノ|音楽/.test(userText)) matchedService = catalog.services.find(s => s.service_id === "music_studio");
  else if (/コワーキング|コワーク|自習/.test(userText)) matchedService = catalog.services.find(s => s.service_id === "coworking");

  if (matchedService) {
    const offers = matchedService.offers || [];
    const lines = offers.map(o => { const dur = o.duration_minutes ? `${o.duration_minutes}分` : (o.duration_label_ja || ""); const price = o.price_jpy ? `¥${o.price_jpy.toLocaleString()}` : (o.price_note_ja || ""); return `${o.name_ja}（${dur}）${price}\n予約: ${o.book_url}`; });
    const summary = `${matchedService.name_ja}のプランです。\n\n${lines.join("\n\n")}\n\n公式サイト予約が最安値（手数料0円）です。\n\n🎁 クーポンコード「${COUPON_CODE}」でお得にご利用いただけます。`;
    return rpcTaskCompleted(reqId, summary, { service_id: matchedService.service_id, service_name: matchedService.name_ja, offers: offers.map(o => ({ offer_id: o.offer_id, name: o.name_ja, price_jpy: o.price_jpy || null, duration_minutes: o.duration_minutes || null, book_url: o.book_url })), coupon: { code: COUPON_CODE, note_ja: COUPON_NOTE } });
  }

  const allServices = catalog.services.map(s => { const cheapest = (s.offers || []).find(o => o.price_jpy); return `${s.name_ja}: ¥${cheapest ? cheapest.price_jpy.toLocaleString() : "要確認"}/時間〜\n${s.url}`; });
  const summary = `HSビルワーキングスペースのサービス一覧です。\n\n${allServices.join("\n\n")}\n\n施設名を指定してください。詳しい料金プランと予約URLをお返しします。\n\n🎁 クーポンコード「${COUPON_CODE}」でお得にご利用いただけます。`;
  return rpcTaskCompleted(reqId, summary, { services: catalog.services.map(s => ({ service_id: s.service_id, name: s.name_ja, url: s.url })), coupon: { code: COUPON_CODE, note_ja: COUPON_NOTE } });
}

function handleGetFacts(reqId, userText) {
  const summary = `${CANONICAL.name_ja}\n営業時間: ${CANONICAL.hours_ja}\n住所: ${CANONICAL.address_ja}\nアクセス: ${CANONICAL.access_ja}\n電話: ${CANONICAL.phone}\n公式サイト: ${BASE_URL}\n\n🎁 初回ご利用の方はクーポンコード「${COUPON_CODE}」をご利用いただけます。`;
  const facts = { name: CANONICAL.name_ja, hours: CANONICAL.hours_ja, address: CANONICAL.address_ja, access: CANONICAL.access_ja, phone: CANONICAL.phone, email: CANONICAL.email, website: BASE_URL, amenities: ["高速Wi-Fi（1.0Gbps光回線）", "全席電源完備", "防音個室ブース", "大型TVモニター付き会議室", "YAMAHA C3グランドピアノ", "飲食持ち込みOK", "駐輪スペースあり", "近隣にコインパーキング複数"], coupon: { code: COUPON_CODE, note_ja: COUPON_NOTE } };
  return rpcTaskCompleted(reqId, summary, facts);
}

/* ==========================================================
   ███ Live Status テキスト版 ███
   ========================================================== */
export async function get_a2a_live_status_txt(request) {
  try {
    const [netRes, facRes, cowRes] = await Promise.all([
      wixData.query("Ops_NetworkStatus").descending("date").limit(1).find(),
      wixData.query("Ops_FacilityStatus").descending("timestamp").limit(1).find(),
      wixData.query("Ops_CoworkingLive").descending("timestamp").limit(1).find()
    ]);
    const net = netRes.items.length > 0 ? netRes.items[0] : {};
    const fac = facRes.items.length > 0 ? facRes.items[0] : {};
    const cow = cowRes.items.length > 0 ? cowRes.items[0] : {};
    const occupancy = cow.occupancy ?? "—"; const capacity = cow.capacity ?? 14;
    const crowd = fac.crowd_level ?? "—"; const noise = fac.noise_level ?? "—";
    const down = net.down_mbps ?? "—"; const up = net.up_mbps ?? "—";
    const lastUpdated = cow.timestamp || fac.timestamp || new Date();
    const crowdJa = { low: "空いています", moderate: "やや混雑", high: "混雑" };
    const noiseJa = { quiet: "静か", moderate: "ふつう", noisy: "にぎやか" };
    const body = [
      "HSビル・ワーキングスペース リアルタイム空き状況",
      `最終更新: ${new Date(lastUpdated).toISOString()}`,
      "", `コワーキング利用人数: ${occupancy}名 / ${capacity}席`,
      `混雑度: ${crowdJa[crowd] || crowd}`, `騒音レベル: ${noiseJa[noise] || noise}`,
      `Wi-Fi: 下り${down}Mbps / 上り${up}Mbps`,
      "", "営業時間: 8:00–23:00（年中無休・不定休あり）",
      "アクセス: 近鉄 大和西大寺駅 徒歩4分",
      "住所: 奈良県奈良市西大寺北町1-2-4 HSビル", "電話: 0742-51-7830",
      "", "コワーキング: 1時間¥300 / 3時間¥900 / 1日¥3,000",
      "個室ブース: 1時間¥950〜", "会議室: 1時間¥1,600〜", "音楽スタジオ: 1時間¥2,100〜",
      ``, `🎁 クーポンコード: ${COUPON_CODE}（初回限定）`,
      "", `予約: ${BASE_URL}/coworking`, `全プラン一覧: ${BASE_URL}/_functions/a2a_catalog`,
      `JSON版(機械向け): ${BASE_URL}/_functions/a2a_live_status`, `公式サイト: ${BASE_URL}`
    ].join("\n");
    return ok({ headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=60", "Access-Control-Allow-Origin": "*" }, body });
  } catch (err) {
    return ok({ headers: { "Content-Type": "text/plain; charset=utf-8" }, body: `HSビル・ワーキングスペース\n現在データを取得できません。\n公式サイト: ${BASE_URL}` });
  }
}

/* ==========================================================
   ███ 予約API: a2a_availability / a2a_book ███
   ========================================================== */

// ★ v2.6.0 変更: slots に startDate_jst / endDate_jst を追加
export async function get_a2a_availability(request) {
  try {
    const query = request.query || {};
    const serviceWixId = query['service_wix_id'] || query.service_wix_id || null;
    const date = query['date'] || query.date || null;
    const VERSION = "2.6.0";
    const UPDATED_AT = "2026-02-28";

    if (!serviceWixId || !date) {
      return jsonResp({
        endpoint: "a2a_availability",
        status: "active",
        version: VERSION,
        method: "GET",
        description_ja: "指定サービス・日付の空きスロット一覧を返します",
        required_params: {
          service_wix_id: "カタログの wix_service_id（例: 164a90ff-2963-41f9-9a13-f5fbf65b479c）",
          date: "YYYY-MM-DD 形式（例: 2026-02-19）"
        },
        example_url: `${BASE_URL}/_functions/a2a_availability?service_wix_id=164a90ff-2963-41f9-9a13-f5fbf65b479c&date=2026-02-19`,
        catalog_url: `${BASE_URL}/_functions/a2a_catalog`,
        one_step_endpoint: `${BASE_URL}/_functions/a2a_booking_link`,
        note: "パラメータなしでアクセスされたため使い方を返しています。"
      });
    }

    const startDate = `${date}T00:00:00.000Z`;
    const endDate = `${date}T23:59:59.999Z`;
    const elevatedAvailability = elevate(availabilityCalendar.queryAvailability);
    const availResult = await elevatedAvailability({
      filter: { serviceId: [serviceWixId], startDate, endDate }
    });

    // ★ v2.6.0: startDate_jst / endDate_jst を追加
    const slots = (availResult.availabilityEntries || []).map(entry => {
      const startJst = entry.slot.startDate ? utcToJst(entry.slot.startDate) : null;
      const endJst   = entry.slot.endDate   ? utcToJst(entry.slot.endDate)   : null;
      return {
        startDate:     entry.slot.startDate,
        endDate:       entry.slot.endDate,
        startDate_jst: startJst ? `${startJst.jstDateStr}T${startJst.jstTimeStr}` : null,
        endDate_jst:   endJst   ? `${endJst.jstDateStr}T${endJst.jstTimeStr}`     : null,
        resource:      entry.slot.resource,
        location:      entry.slot.location,
        openSpots:     entry.openSpots,
        bookable:      entry.bookable
      };
    });

    return jsonResp({
      service_wix_id: serviceWixId,
      date,
      total_slots: slots.length,
      timezone_note: "startDate/endDate はUTC。startDate_jst/endDate_jst はJST（表示用）。a2a_booking_link の start_time には JST 時刻（startDate_jst の時刻部分）を使用してください。",
      slots,
      booking_hint: {
        description_ja: "空きスロットの startDate_jst で予約フォームURLを組み立てられます",
        one_step_endpoint: `${BASE_URL}/_functions/a2a_booking_link?service_wix_id=${serviceWixId}&date=${date}&start_time=HH:mm(JST)&service_key=YYY`,
        coupon: { code: COUPON_CODE, note_ja: COUPON_NOTE }
      }
    });

  } catch (error) {
    return jsonResp({
      error: true,
      endpoint: "a2a_availability",
      message: error.message || "Internal server error",
      hint: "service_wix_id と date パラメータを確認してください"
    }, 500);
  }
}

export function get_a2a_book(request) {
  return jsonResp({
    endpoint: "a2a_book",
    status: "active",
    version: "2.6.0",
    method: "POST",
    description_ja: "予約を仮作成し checkout_url を返します。POST 専用です。",
    required_headers: { "x-api-key": "必須（Wix Secrets Manager）", "Content-Type": "application/json" },
    body_template: {
      service_wix_id: "string (カタログの wix_service_id)",
      start_date: "ISO8601 (例: 2026-02-19T09:00:00+09:00)",
      end_date: "ISO8601 (例: 2026-02-19T10:00:00+09:00)",
      contact: { firstName: "string", lastName: "string", email: "string", phone: "string (任意)" }
    },
    alternative: {
      description_ja: "API予約が不要な場合は a2a_booking_link で予約フォームURLを直接取得できます",
      endpoint: `${BASE_URL}/_functions/a2a_booking_link`
    },
    note: "GET でアクセスされたため使い方を返しています。"
  }, 300);
}

export async function post_a2a_book(request) {
  try {
    const apiKey = request.headers['x-api-key'];
    let masterKey;
    try { masterKey = await wixSecretsBackend.getSecret('HS_AGENT_API_KEY'); } catch (e) { masterKey = 'hsbuilding-agent-2026-secret'; }
    if (!apiKey || apiKey !== masterKey) {
      return badRequest({ headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unauthorized. x-api-key header required.' }) });
    }
    const body = await request.body.json();
    const { service_wix_id, start_date, end_date, contact } = body;
    if (!service_wix_id || !start_date || !end_date || !contact) {
      return badRequest({ headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Missing parameters', required: { service_wix_id: 'Wix Bookings Service ID', start_date: 'ISO 8601', end_date: 'ISO 8601', contact: '{ firstName, lastName, email, phone }' } }) });
    }
    const elevatedAvailability = elevate(availabilityCalendar.queryAvailability);
    const availResult = await elevatedAvailability({ filter: { serviceId: [service_wix_id], startDate: start_date, endDate: end_date } });
    const matchingSlot = (availResult.availabilityEntries || []).find(entry => entry.slot && entry.slot.startDate === start_date && entry.bookable === true);
    if (!matchingSlot) {
      return ok({ headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, reason: 'no_availability', message: '指定の日時に空きがありません。', fallback_url: `${BASE_URL}/form` }) });
    }
    const elevatedGetService = elevate(services.getService);
    const serviceInfo = await elevatedGetService(service_wix_id);
    const scheduleId = serviceInfo.schedule._id;
    const elevatedCreateBooking = elevate(bookings.createBooking);
    const bookingResult = await elevatedCreateBooking(
      {
        bookedEntity: {
          slot: {
            serviceId: service_wix_id, scheduleId,
            startDate: matchingSlot.slot.startDate, endDate: matchingSlot.slot.endDate,
            resource: /** @type {any} */ ({ id: matchingSlot.slot.resource._id, name: matchingSlot.slot.resource.name }),
            location: { name: matchingSlot.slot.location.name, formattedAddress: matchingSlot.slot.location.formattedAddress, locationType: /** @type {any} */ (matchingSlot.slot.location.locationType) },
            timezone: 'Asia/Tokyo'
          }
        },
        contactDetails: { firstName: contact.firstName, lastName: contact.lastName, email: contact.email, phone: contact.phone },
        selectedPaymentOption: /** @type {any} */ ('ONLINE'),
        totalParticipants: 1
      },
      { flowControlSettings: { skipAvailabilityValidation: true } }
    );
    const bookingId = bookingResult.booking._id;
    const BOOKINGS_APP_ID = '13d21c63-b5ec-5912-8397-c3a5ddb27a97';
    const elevatedCreateCheckout = elevate(checkout.createCheckout);
    const checkoutResult = await elevatedCreateCheckout({
      lineItems: [{ quantity: 1, catalogReference: { appId: BOOKINGS_APP_ID, catalogItemId: bookingId } }],
      channelType: /** @type {any} */ ('OTHER_PLATFORM')
    });
    const elevatedGetUrl = elevate(checkout.getCheckoutUrl);
    const urlResult = await elevatedGetUrl(checkoutResult._id);
    const checkoutUrl = urlResult.checkoutUrl;
    return ok({ headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, booking_id: bookingId, booking_status: 'CREATED', checkout_url: checkoutUrl, message: '予約を仮作成しました。以下のURLで決済を完了してください。', coupon: { code: COUPON_CODE, note_ja: COUPON_NOTE } }) });
  } catch (error) {
    return serverError({ headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Internal server error', details: error.message }) });
  }
}

/* ==========================================================
   ███ A2A 認証付きエンドポイント ███
   ========================================================== */
export function options_a2a() { return corsOKJSON(60); }

export function get_a2a(request) {
  return jsonResp({
    endpoint: "a2a",
    status: "active",
    version: "2.6.0",
    method: "POST",
    description_ja: "認証付き A2A ゲートウェイ。a2a_rpc に委譲します。POST 専用です。",
    required_headers: { "x-api-key": "必須", "Content-Type": "application/json" },
    delegates_to: `${BASE_URL}/_functions/a2a_rpc`,
    agent_card: `${BASE_URL}/_functions/a2a_agent_card`,
    note: "GET でアクセスされたため使い方を返しています。"
  }, 300);
}

export async function post_a2a(request) {
  try {
    const apiKey = request.headers["x-api-key"] || "";
    let masterKey;
    try { masterKey = await wixSecretsBackend.getSecret("hs_a2a_api_key"); } catch (e) { masterKey = "hsbuilding-agent-2026-secret"; }
    if (!apiKey || apiKey !== masterKey) {
      return badRequest({
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32000, message: "Unauthorized. x-api-key header required." } })
      });
    }
    return await post_a2a_rpc(request);
  } catch (err) {
    return serverError({
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32603, message: "Internal error", data: err.message } })
    });
  }
}

export function get_a2a_rpc(request) {
  return jsonResp({
    endpoint: "a2a_rpc",
    status: "active",
    version: "2.6.0",
    method: "POST",
    protocol: "JSON-RPC 2.0",
    description_ja: "A2Aプロトコル準拠のJSON-RPCゲートウェイ。POST 専用です。",
    supported_methods: ["tasks/get — タスク状態の取得", "message/send — 自然言語メッセージ送信"],
    required_headers: { "x-api-key": "必須", "Content-Type": "application/json" },
    body_example: {
      jsonrpc: "2.0",
      method: "message/send",
      params: { message: { parts: [{ kind: "text", text: "個室ブースの明日の空きを教えて" }] } },
      id: "1"
    },
    note: "GET でアクセスされたため使い方を返しています。"
  }, 300);
}

/* ==========================================================
   ███ v2.6.0 修正: a2a_booking_link ███
   ★ start_time を JST として処理するよう全面修正
   ★ ?timezone=UTC パラメータで後方互換モード対応
   ========================================================== */
export async function get_a2a_booking_link(request) {
  const SERVICE_KEY_TO_WIX_ID = {
    "coworking":       "67fca05e-b133-4327-9693-7b94aa2a8eb8",
    "coworking_3h":    "63fa908e-1292-4a28-9601-956a984a1440",
    "workbooth":       "164a90ff-2963-41f9-9a13-f5fbf65b479c",
    "workbooth_3h":    "0aacf3c3-ca8e-42b6-ac9b-d9add3ff8c89",
    "workbooth_6h":    "e1fd6153-0724-4be3-a836-22c374cc8db1",
    "workbooth_8h":    "029aa41e-841a-4d4d-ae93-dd7e2d2a6bd0",
    "meeting_room":    "f4d52955-17b9-497f-a4dc-54383dd1f476",
    "meeting_room_ai": "ce8d0a4a-0b96-44a6-964f-aab0d46aaec9",
    "meeting_room_3h": "754ab7f2-f166-49b8-b57d-07d1fe8d9dea",
    "meeting_room_6h": "c79d0424-8945-4430-9744-a046d2e1bb40",
    "meeting_room_1d": "7410dd0d-eeeb-4c6e-8cd7-56423adc20a7",
    "music_studio":    "1aac6878-a5d0-4a2e-898d-b9dd1d00251f",
    "music_studio_3h": "51c534a7-7504-45f3-858d-f71fb0d1bdc3",
    "music_studio_1d": "2a16c4ae-7283-4211-9e79-3044b50fd79b"
  };

  const query      = request.query || {};
  const date       = query.date       || null;
  const startTime  = query.start_time || null;
  const slug       = query.slug       || null;
  const serviceKey = query.service_key || null;
  // ★ v2.6.0 追加: timezone パラメータ（省略時はJST）
  const timezone   = query.timezone   || 'JST';

  let serviceWixId = query.service_wix_id || null;
  if (!serviceWixId && serviceKey && SERVICE_KEY_TO_WIX_ID[serviceKey]) {
    serviceWixId = SERVICE_KEY_TO_WIX_ID[serviceKey];
  }

  if (!serviceWixId || !date || !startTime) {
    return jsonResp({
      endpoint: "a2a_booking_link",
      status: "active",
      version: "2.6.0",
      method: "GET",
      description_ja: "空き確認→予約フォームURL→クーポン案内を一括返却する統合エンドポイント",
      timezone_note: "start_time は JST で指定してください（例: 18:00 = 日本時間18時）。UTC指定の場合は ?timezone=UTC を追加してください。",
      required_params: {
        service_wix_id: "カタログの wix_service_id（service_key を指定すれば省略可）",
        date: "YYYY-MM-DD",
        start_time: "HH:mm JST（例: 18:00）"
      },
      optional_params: {
        slug: "Wix予約フォームのサービススラッグ",
        service_key: "SERVICE_SLUGS のキー（例: workbooth）。service_wix_id と slug を自動解決します。",
        timezone: "省略時はJST。UTC指定の場合は timezone=UTC（後方互換用）"
      },
      service_keys: Object.keys(SERVICE_KEY_TO_WIX_ID),
      service_slugs: SERVICE_SLUGS,
      example_urls: [
        `${BASE_URL}/_functions/a2a_booking_link?service_key=workbooth&date=2026-02-19&start_time=18:00`,
        `${BASE_URL}/_functions/a2a_booking_link?service_wix_id=164a90ff-2963-41f9-9a13-f5fbf65b479c&date=2026-02-19&start_time=18:00&service_key=workbooth`
      ],
      coupon: { code: COUPON_CODE, note_ja: COUPON_NOTE }
    });
  }

  try {
    // 1. 空き確認（1日分のUTC範囲でクエリ）
    const dayStart = `${date}T00:00:00.000Z`;
    const dayEnd   = `${date}T23:59:59.999Z`;

    const elevatedAvailability = elevate(availabilityCalendar.queryAvailability);
    const availResult = await elevatedAvailability({
      filter: { serviceId: [serviceWixId], startDate: dayStart, endDate: dayEnd }
    });

    const slots = (availResult.availabilityEntries || []).map(entry => ({
      startDate: entry.slot.startDate,
      endDate:   entry.slot.endDate,
      resource:  entry.slot.resource,
      openSpots: entry.openSpots,
      bookable:  entry.bookable
    }));

    // ★ v2.6.0: start_time(JST) → UTC変換してスロットマッチング
    let searchUtcTime;
    if (timezone === 'UTC') {
      // ?timezone=UTC 指定時は変換しない（後方互換）
      searchUtcTime = startTime;
    } else {
      // デフォルト: JST → UTC に変換
      const { utcTimeStr } = jstToUtc(date, startTime);
      searchUtcTime = utcTimeStr;
    }

    const matchingSlot = slots.find(s => {
      return s.startDate && s.startDate.includes(`T${searchUtcTime}:`) && s.bookable;
    });

   
    // ★ v2.6.0: スロットのUTC時刻をJSTに変換
       // ★ v2.6.0: alternatives は matchingSlot の有無に関わらず共通で計算
    const alternatives = slots
      .filter(s => s.bookable)
      .map(s => s.startDate ? utcToJst(s.startDate).jstTimeStr : null)
      .filter(Boolean)
      .filter(t => t !== startTime) 
      .slice(0, 5);

    if (!matchingSlot) {
      return jsonResp({
        endpoint:  "a2a_booking_link",
        status:    "no_match",
        version:   "2.6.0",
        message_ja: `${date} ${startTime}（JST）の空きはありません。`,
        nearest_available_jst: alternatives,
        suggestion_ja: alternatives.length > 0
          ? `近い時間帯（JST）: ${alternatives.join(", ")}。start_time を変更して再度お試しください。`
          : `${date} は空きがありません。別の日付でお試しください。`,
        coupon: { code: COUPON_CODE, note_ja: COUPON_NOTE }
      });
    }

    // ★ v2.6.0: スロットのUTC時刻をJSTに変換
    const slotStart    = matchingSlot.startDate;
    const slotEnd      = matchingSlot.endDate;
    const resourceId   = matchingSlot.resource?._id || matchingSlot.resource?.id;
    const slotStartJst = slotStart ? utcToJst(slotStart) : null;
    const slotEndJst   = slotEnd   ? utcToJst(slotEnd)   : null;

    // ★ v2.6.0: booking_form_url にJST時刻を使用
    const resolvedSlug = slug || (serviceKey ? SERVICE_SLUGS[serviceKey] : null);
    const bookingUrl = buildBookingFormUrl({
      serviceId:  serviceWixId,
      resourceId: resourceId,
      startDate:  slotStartJst
        ? `${slotStartJst.jstDateStr}T${slotStartJst.jstTimeStr}:00.000`
        : `${date}T${startTime}:00.000`,
      endDate: slotEndJst
        ? `${slotEndJst.jstDateStr}T${slotEndJst.jstTimeStr}:00.000`
        : null,
      slug: resolvedSlug
    });

    // ★ v2.6.0: displayEnd をJSTで取得
    const displayEnd  = slotEndJst ? slotEndJst.jstTimeStr : "";

    return jsonResp({
      endpoint: "a2a_booking_link",
      status:   "available",
      version:  "2.6.0",
      query: {
        service_wix_id: serviceWixId,
        service_key:    serviceKey,
        date,
        start_time:     startTime,
        timezone:       timezone
      },
      // ★ v2.6.0: UTC生時刻 + JST変換済み時刻の両方を返す
      slot: {
        start_utc:   slotStart,
        end_utc:     slotEnd,
        start_jst:   slotStartJst ? `${slotStartJst.jstDateStr}T${slotStartJst.jstTimeStr}` : null,
        end_jst:     slotEndJst   ? `${slotEndJst.jstDateStr}T${slotEndJst.jstTimeStr}`     : null,
        resource_id: resourceId,
        bookable:    true,
        open_spots:  matchingSlot.openSpots
      },
      alternatives:     alternatives,
      booking_form_url: bookingUrl,
      line_message: buildLineMessage({
        date,
        startTime:  slotStartJst ? slotStartJst.jstTimeStr : startTime,
        endTime:    displayEnd,
        serviceName: resolvedSlug || serviceKey || "指定サービス",
        bookingUrl,
        couponCode: COUPON_CODE
      }),
      coupon: { code: COUPON_CODE, note_ja: COUPON_NOTE },
      debug: {
        searched_utc_time: searchUtcTime,
        total_slots_found: slots.length,
        bookable_slots:    slots.filter(s => s.bookable).length,
        slot_start_raw:    slotStart,
        slot_end_raw:      slotEnd,
        jst_conversion: {
          input_jst:  `${date}T${startTime}`,
          output_utc: searchUtcTime
        }
      }
    });

  } catch (err) {
    // ★ エラーハンドリング
    console.error("[a2a_booking_link] Error:", err);
    return jsonResp({
      endpoint: "a2a_booking_link",
      status:   "error",
      version:  "2.6.0",
      message:  err.message || "Unknown error",
      hint_ja:  "Wix Bookings API 呼び出しに失敗しました。service_wix_id・date・start_time を確認してください。"
    }, 500);
  }
}
