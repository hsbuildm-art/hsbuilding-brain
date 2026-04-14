# /workbooth 販売導線改善 実装仕様書

作成: 2026-04-14 | 担当: Holy Claude (CTO)
前提: 新規LP不可・`/workbooth` 既存ページ活用・Wix標準機能ベース

---

## 1. 実装方針の結論

**採用: プラン先行 → 予約消化 の2レーン構成**

```
現状: [単発予約が上] → [プランが下に埋もれ]
改善: [法人・定期レーン（プラン決済）] + [単発レーン] を明確分離
```

Wix Pricing Plans と Bookings の連携は**標準機能で成立する**。
プランを買った顧客が対象 Bookings サービスに予約を入れると、セッションが消化される仕組みがすでに存在する。
今回の工事は「表示順・文言・説明文・固定枠逃げ口」の Wix エディタ作業が中心。コード追加は計測のみ。

---

## 2. Wix 標準機能で可能な最短案

### 2-A. Pricing Plans → Bookings 接続の仕組み（確認事項）

| ステップ | Wix の動き |
|---------|-----------|
| 顧客がプランを購入 | Pricing Plans でセッション数 or 期間が付与 |
| 顧客が Bookings ページへ | 対象サービスを選択し予約 |
| 予約確定 | セッション数を1消化（または期間内利用） |
| 残数ゼロ or 期限切れ | 次回は再購入 |

**Wix エディタで実施する接続確認手順:**
1. Wix 管理画面 → `Pricing Plans` → 対象プランを開く
2. 「利用可能なサービス」タブ → 個室ブースの Bookings サービスが選択されているか確認
3. 未接続の場合: 対象サービスにチェックを入れて保存
4. テスト購入（テストモード）→ Bookings でセッション消化できるか確認

### 2-B. ページ構成 変更後の構造

```
/workbooth
├── [Hero] 個室ワークブース
│
├── [Section: 2レーン分岐ナビ]
│   ├── ボタン: 「定期・回数で使いたい」→ Section-Plans へスクロール
│   └── ボタン: 「今すぐ1回使いたい」→ Section-Single へスクロール
│
├── [Section-Plans] 定期・法人利用プラン  ← 上に移動
│   ├── プランカード: 法人短期集中 5回パック
│   ├── プランカード: 個室ブース定期利用 月8回プラン
│   ├── [説明テキスト] オンライン決済で即開始・契約書不要・予約消化方式
│   └── [サブCTA] 「毎週同じ曜日・時間で固定したい法人様はこちら →」
│
└── [Section-Single] 単発予約  ← 下へ移動
    └── Bookings ウィジェット（既存）
```

---

## 3. 編集対象一覧

### 3-1. ページ (`/workbooth`)

| 編集箇所 | 変更内容 |
|---------|---------|
| Section 順序 | Pricing Plans セクションを単発予約より上に移動 |
| 分岐ナビ追加 | 2ボタン（定期利用 / 単発利用）をヒーロー直下に新設 |
| 固定枠相談CTA | プランセクション下部に追加（問い合わせまたは既存フォームへ） |

**分岐ナビ ブロック HTML（Wixカスタムコード or テキスト + ボタン要素）:**

```html
<div style="display:flex;gap:16px;justify-content:center;padding:24px 16px;flex-wrap:wrap;">
  <a href="#plans-section"
     data-track-cta
     data-slug="workbooth"
     data-cta-name="plan_lane"
     data-cta-type="primary"
     data-cta-position="hero"
     data-service-type="booth"
     style="display:inline-block;padding:16px 32px;background:#1a73e8;color:#fff;border-radius:8px;
            text-decoration:none;font-size:16px;font-weight:bold;text-align:center;">
    定期・回数で使いたい<br>
    <span style="font-size:12px;font-weight:normal;opacity:.85;">法人・週2〜 / 5回パック</span>
  </a>
  <a href="#single-section"
     data-track-cta
     data-slug="workbooth"
     data-cta-name="single_lane"
     data-cta-type="secondary"
     data-cta-position="hero"
     data-service-type="booth"
     style="display:inline-block;padding:16px 32px;background:#fff;color:#1a73e8;border:2px solid #1a73e8;
            border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;text-align:center;">
    今すぐ1回使いたい<br>
    <span style="font-size:12px;font-weight:normal;opacity:.75;">単発予約</span>
  </a>
</div>
```

**固定枠相談CTA HTML（プランセクション末尾）:**

```html
<div style="margin:32px auto;padding:20px 24px;background:#f5f5f5;border-left:4px solid #1a73e8;
            max-width:560px;border-radius:4px;">
  <p style="margin:0 0 12px;font-size:15px;color:#333;">
    毎週同じ曜日・時間で個室を固定したい法人様
  </p>
  <a href="/contact"
     data-track-cta
     data-slug="workbooth"
     data-cta-name="fixed_slot_consult"
     data-cta-type="escape"
     data-cta-position="plan_bottom"
     data-service-type="booth"
     style="display:inline-block;padding:12px 24px;background:#555;color:#fff;
            border-radius:6px;text-decoration:none;font-size:14px;">
    固定枠のご相談はこちら →
  </a>
</div>
```

---

### 3-2. Pricing Plans 編集

#### プラン①: 個室ブース3時間×5回パック

| 項目 | 現在 | 変更後 |
|------|------|-------|
| 表示名 | 個室ブース3時間×5回パック | 法人短期集中 5回パック |
| サブタイトル | （なし or 既存） | 3時間×5回 / 有効期間内に自由消化 |
| 説明文 | （追加） | 下記参照 |

**説明文（Wix Pricing Plans の「プランの説明」欄に入力）:**
```
オンライン決済で今すぐ開始。契約書・見積書往復なし。
購入後はマイページから対象サービス「個室ワークブース」を予約し、1回ずつ消化します。
固定曜日・固定時間の専有確保ではありません（都度予約方式）。
有効期限・残回数はマイページで確認できます。
法人の短期集中利用・研修・面談スペース確保にご活用ください。
```

#### プラン②: 個室ブース週2プラン

| 項目 | 現在 | 変更後 |
|------|------|-------|
| 表示名 | 個室ブース週2プラン | 個室ブース定期利用 月8回プラン |
| サブタイトル | （なし or 既存） | 月最大8回 / 週2ペース利用向け |
| 説明文 | （追加） | 下記参照 |

**説明文:**
```
月額オンライン決済。自動継続（キャンセルはマイページからいつでも可）。
購入後はマイページから「個室ワークブース」を予約し、月8回まで消化できます。
固定曜日・固定時間の専有確保ではありません（都度予約方式）。
毎週火・木など一定ペースで使いたい法人様・フリーランス様向けです。
```

---

### 3-3. Bookings サービス確認

確認対象: `個室ワークブース`（Bookings サービス名）

| 確認項目 | 期待状態 | 確認場所 |
|---------|---------|---------|
| 上記2プランとの接続 | 接続済み | Pricing Plans → プラン詳細 → 利用可能サービス |
| 予約枠の公開設定 | 外部公開 ON | Bookings → サービス設定 |
| キャンセルポリシー | 適切に設定 | Bookings → ポリシー設定 |

---

### 3-4. 自動メール（購入後）

**編集対象:** Pricing Plans → メール設定 → 「プラン購入完了」メール

**追加テキスト（既存メール本文の末尾に挿入）:**
```
────────────────────────
【次のステップ：予約して利用を開始する】

1. マイページ（会員ページ）にログイン
2. 「予約する」ボタンから「個室ワークブース」を選択
3. ご都合の日時を選んで予約確定
4. 残回数・有効期限はマイページの「プラン」タブで確認できます

ご不明な点はお気軽にお問い合わせください。
────────────────────────
```

---

### 3-5. 計測追加（cta-tracking.js 拡張）

既存の `cta-tracking.js` は `data-track-cta` によるクリック計測が動いている。
以下のイベントを追加計測する。

#### 追加するイベント定義

| イベント名 | 発火タイミング | 取得パラメーター |
|-----------|-------------|--------------|
| `plan_view` | プランセクションが画面に入ったとき | `plan_name`, `plan_type` |
| `plan_click` | プランの「購入する」ボタンクリック | `plan_name`, `plan_type`, `cta_position` |
| `plan_purchase_complete` | 購入完了ページ到達 | `plan_name`, `plan_type` |
| `post_plan_booking_complete` | プラン購入者の予約確定 | `plan_name`, `service_type` |

#### `plan_view` 計測スニペット（既存 cta-tracking.js に追記）

```javascript
// --- Plan Section Visibility Tracking ---
(function () {
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
```

#### 購入完了ページでの計測（Wix Thank You ページ or Pricing Plans 完了ページ）

Wix の Pricing Plans 購入完了後はデフォルトで Wix 管理のサンキューページへ遷移する。
カスタムコードが挿入可能な場合、以下を追加:

```javascript
// 購入完了ページ判定（URLに plan や checkout-complete を含む場合）
if (/\/(checkout-complete|plans\/purchase-complete)/i.test(location.pathname)) {
  sendEvent('plan_purchase_complete', {
    page_slug: 'workbooth',
    plan_type: 'booth'
  });
}
```

---

## 4. 実装手順（Wix エディタ作業順）

### Phase 1: 接続確認（30分）

1. Wix 管理画面 → Pricing Plans → 「個室ブース3時間×5回パック」
   - 「利用可能なサービス」に個室ワークブースが含まれているか確認
   - 含まれていない場合は追加して保存
2. 同様に「個室ブース週2プラン」も確認
3. テストモードで1プラン購入 → Bookings でセッション消化できることを確認

### Phase 2: プラン文言・説明文更新（20分）

4. Pricing Plans → 各プランの表示名・説明文を上記仕様に更新
5. 保存・プレビュー確認

### Phase 3: /workbooth ページ編集（45分）

6. Wix エディタで `/workbooth` を開く
7. 既存の Pricing Plans ウィジェットセクションを単発予約ウィジェットより上に移動
8. 移動したプランセクションに `id="plans-section"` を付与（Velo またはカスタム属性）
9. 単発予約セクションに `id="single-section"` を付与
10. ヒーロー直下に分岐ナビ（2ボタン）HTML を追加（Wix HTML コンポーネント）
11. プランセクション末尾に固定枠相談CTA HTML を追加（Wix HTML コンポーネント）
12. 表示確認（モバイル / PC 両方）

### Phase 4: 自動メール更新（15分）

13. Pricing Plans → メール設定 → 購入完了メール
14. 「次のステップ」テキストを末尾に追記
15. テスト送信で確認

### Phase 5: 計測コード更新（30分）

16. `cta-tracking.js` に `plan_view` スニペットを追記
17. GitHub に push
18. Wix 管理画面 → カスタムコード → 既存コードを更新
19. GA4 DebugView で `plan_view`, `cta_click` が発火するか確認

---

## 5. 優先度B: 5日パック / 10日パック追加可否

### 判断

**追加可能・推奨。Pricing Plans で最短実装できる。**

| プラン案 | 内容 | Wix 実装方法 |
|---------|------|------------|
| 短期集中 10回パック | 3時間×10回 / 3ヶ月有効 | Pricing Plans → 新規プラン（セッション型・10回） |
| 短期滞在 3日パック | 1日利用×3回 / 1ヶ月有効 | Pricing Plans → 新規プラン（セッション型・3回） |

**追加要件:**
- 既存の Bookings サービス（個室ワークブース）と接続するだけ
- ページ上のプランウィジェットは複数プランを表示できる（Wix Pricing Plans ウィジェットの標準機能）
- 新プランを作成後、ウィジェットの「表示するプラン」設定で追加選択するだけ

**推奨追加タイミング:** Phase 1 の接続確認が完了した後に同時実施

---

## 6. 将来の完全自動化（固定枠専有）の可否と工数

### 結論

**実現可能だが工数は「大」。現時点では調査のみ推奨。**

### 技術的検討

| 課題 | 検討内容 | 判定 |
|------|---------|------|
| Wix Bookings の繰り返し予約 | スタッフが入力する「繰り返し予約」は標準機能あり。顧客自身が繰り返し予約を確定する機能は**標準なし** | 要カスタム |
| Time Slots API で複数枠選択UI | Velo の `wix-bookings-v2` API でスロット取得・複数選択UIは構築可能。ただし決済連動は別途実装が必要 | 工数大 |
| 決済完了後の複数予約自動確定 | Velo バックエンド: `createBooking()` を決済 webhook 受信後にループ実行。Wix Payments webhook → Velo serverless function → Bookings API | 実現可能・工数大 |
| 固定枠の競合排除 | 特定スロットを "特定ユーザー専有" にする機能は Wix 標準にない。Velo でスロットの availability を操作する必要あり | 実現可能・難度高 |

### 標準機能の不足点まとめ

- 顧客が購入時に「毎週○曜○時」を選択し自動的に複数週分を確定する UI → **なし**
- 特定スロットを特定顧客専用に "ロック" する機能 → **なし**
- 決済完了トリガーで複数予約を自動作成する built-in 機能 → **なし**（Velo で構築要）

### 工数感

| フェーズ | 内容 | 工数感 |
|---------|------|-------|
| 設計 | データモデル・UX フロー確定 | 小 |
| Velo 実装 | 選択UI + 決済 webhook + Bookings API 多重呼び出し | 大 |
| 競合ロック実装 | スロット制御ロジック | 大 |
| テスト | エッジケース（予約失敗・返金・変更） | 中 |
| **合計** | | **大（2〜4週間以上）** |

### 推奨

現状は「固定枠希望 → 相談ボタンへ誘導 → スタッフが手動で Wix Bookings の繰り返し予約を設定」
を運用で対応する。自動化は受注数が増えてからで十分。

---

## 7. チェックリスト（実装完了確認）

- [ ] Pricing Plans → Bookings 接続確認済み
- [ ] テスト購入 → 予約消化 動作確認
- [ ] プラン表示名・説明文更新済み
- [ ] /workbooth ページ: プランが単発予約より上に表示
- [ ] 分岐ナビ（2ボタン）表示・スクロール動作確認
- [ ] 固定枠相談CTA 表示・リンク先確認
- [ ] 購入完了メール: 次のステップ追記済み
- [ ] cta-tracking.js 更新・Wix カスタムコード反映
- [ ] GA4 DebugView でイベント確認
- [ ] モバイル表示確認

---

*出力ファイル: `output/workbooth-plan.md` | hsbuilding-brain リポジトリ*
