/**
 * HSビル CTAトラッキング — GA4イベント計測
 * 設置場所: Wix管理画面 > 設定 > カスタムコード > ボディ末尾（全ページ）
 *
 * 必須: WixのGA4連携（マーケティングツール > Google アナリティクス）が設定済みであること
 * GA4 Measurement ID例: G-XXXXXXXXXX
 */

(function () {
  'use strict';

  // ─── cta_click: data属性付きCTAボタンのクリックを計測 ───────────────────────
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track-cta]');
    if (!el) return;

    var params = {
      article_slug:  el.getAttribute('data-slug')         || '',
      cta_name:      el.getAttribute('data-cta-name')     || '',
      cta_type:      el.getAttribute('data-cta-type')     || '',
      cta_position:  el.getAttribute('data-cta-position') || '',
      service_type:  el.getAttribute('data-service-type') || ''
    };

    sendEvent('cta_click', params);

    // LINEリンクのクリックは line_friend_add も同時送信
    var href = el.getAttribute('href') || '';
    if (href.indexOf('lin.ee') !== -1 || href.indexOf('line://') !== -1) {
      sendEvent('line_friend_add', {
        article_slug: params.article_slug,
        cta_position: params.cta_position,
        service_type: params.service_type
      });
    }
  }, true);

  // ─── plan_view: /workbooth のプランセクションが画面内に入ったとき計測 ─────────
  // Wix HTML コンポーネントに id="plans-section" を付与すること
  (function () {
    if (window.location.pathname.indexOf('/workbooth') === -1) return;
    var planSection = document.querySelector('#plans-section');
    if (!planSection || !('IntersectionObserver' in window)) return;

    var observed = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !observed) {
          observed = true;
          sendEvent('plan_view', { page_slug: 'workbooth' });
          io.disconnect();
        }
      });
    }, { threshold: 0.3 });
    io.observe(planSection);
  })();

  // ─── plan_purchase_complete: Pricing Plans 購入完了ページ到達を計測 ─────────
  // Wix の購入完了URLパターンに合わせて PLAN_COMPLETE_PATH を調整してください
  var PLAN_COMPLETE_PATH = '/plans/purchase-complete';
  if (window.location.pathname.indexOf(PLAN_COMPLETE_PATH) !== -1) {
    sendEvent('plan_purchase_complete', {
      page_slug: 'workbooth',
      plan_type: 'booth'
    });
  }

  // ─── application_start: バーチャルオフィス申込フォーム1ページ目の表示を計測 ──
  // 申込フォームページのURLを下記に設定してください
  var APPLY_FORM_URL_PATTERN = '/virtual-office'; // 実際のフォームURLに合わせて変更

  if (window.location.pathname.indexOf(APPLY_FORM_URL_PATTERN) !== -1) {
    sendEvent('application_start', {
      service_type: 'virtual_office'
    });
  }

  // ─── sendEvent: GA4 / dataLayer 両対応 ──────────────────────────────────────
  function sendEvent(eventName, params) {
    // GA4 gtag
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }

    // GTM dataLayer (Wix x GTM 構成の場合)
    if (Array.isArray(window.dataLayer)) {
      var payload = Object.assign({ event: eventName }, params);
      window.dataLayer.push(payload);
    }

    // デバッグ用（本番前に削除またはコメントアウト推奨）
    // console.log('[HS Track]', eventName, params);
  }

})();


/* ─────────────────────────────────────────────────────────────────────────────
 * consultation_submit, booking_complete, application_complete
 *
 * 上記3イベントはボタンクリックではなくフォーム送信完了時に発火させます。
 * Wixのフォーム・Bookingsのthanksページに以下のスニペットを追加してください。
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 【consultation_submit — 15分相談フォーム送信完了画面】
 * Wix Forms のサンクスページ or 送信完了メッセージの表示トリガーに設置
 *
 *   gtag('event', 'consultation_submit', {
 *     form_type: 'consultation_15min'
 *   });
 *
 *
 * 【booking_complete — 個室予約確定画面】
 * Wix Bookings の予約確認ページ (例: /bookings/order-confirmation) に設置
 * Wix Velo を使う場合は $w.onReady で発火
 *
 *   gtag('event', 'booking_complete', {
 *     booking_type: 'private_booth',
 *     value: [予約金額]  // Wix Bookings APIで取得する場合は要Velo
 *   });
 *
 *
 * 【application_complete — バーチャルオフィス申込完了画面】
 * 申込完了・thanksページのカスタムコードに設置
 *
 *   gtag('event', 'application_complete', {
 *     service_type: 'virtual_office'
 *   });
 *
 * ───────────────────────────────────────────────────────────────────────────── */


/* ─────────────────────────────────────────────────────────────────────────────
 * Wix設置手順（作業者向け）
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. Wix管理画面 > 設定 > カスタムコード を開く
 * 2. 「+ カスタムコードを追加」をクリック
 * 3. このファイルの内容（上部の即時実行関数）を貼り付ける
 * 4. 設置場所: 「ボディ - 末尾」
 * 5. ページ適用: 「すべてのページ」
 * 6. 名前: "HS CTA Tracking" 等わかりやすい名前を設定
 * 7. 保存・公開
 *
 * 確認方法:
 * - Google Tag Assistant または GA4 DebugView で cta_click イベントを確認
 * - ブラウザDevTools Console でイベントログを確認（デバッグ行のコメントを外す）
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CTAボタンHTML側に必要なdata属性（記事内HTML要素に設置済み）
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   data-track-cta             （必須: このボタンをトラッキング対象にする）
 *   data-slug="..."            （記事スラッグ）
 *   data-cta-name="..."        （ai_diagnosis / ai_consultation / virtual_office_apply / line_consult / private_booth_reserve / plan_lane / single_lane / fixed_slot_consult）
 *   data-cta-type="..."        （primary / secondary）
 *   data-cta-position="..."    （hero / mid / bottom / faq_after）
 *   data-service-type="..."    （ai / consultation / virtual_office / private_booth）
 *
 * ───────────────────────────────────────────────────────────────────────────── */
