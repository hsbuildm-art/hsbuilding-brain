# 記事再構成 実装計画書

作成日: 2026-04-13  
対象: HSビルAI組織 Wixブログ 4記事

---

## 1. 実装対象ページ一覧

| 優先 | スラッグ | 役割 | 実装種別 |
|------|----------|------|----------|
| ★★ 先行 | `/post/chatgpt-vs-gemini-vs-claude-comparison-2026` | 流入母艦 | 差分修正（8ブロック追加） |
| ★★ 先行 | `/post/virtual-office-ai-550yen` | 申込回収 | 準LP全文差し替え |
| ★ 次 | `/post/ai-selection-guide-small-business` | 受け皿 | 差分修正（4ブロック追加） |
| ★ 最後 | `/post/nara-web-meeting-private-booth` | 予約回収 | 差分修正（5ブロック追加） |

---

## 2. 各ページの修正ブロック一覧

### 比較記事 (`comparison-2026`)

| ブロックID | 内容 | 挿入位置 |
|-----------|------|----------|
| C-1 | 「この記事はこんな人向け」ボックス | タイトル直下・本文最上部 |
| C-2 | 3パターン即答チャート | 比較表（H2「結論先出し」セクション）直後 |
| C-3 | 主CTA①「30秒AI診断」HTML埋め込み | C-2直後（mid） |
| C-4 | AI選び方記事への内部リンク文 | Claudeセクション末尾または「まとめ」冒頭 |
| C-5 | 追加FAQ 3問 | 既存FAQの上部に挿入 |
| C-6 | 主CTA②「30秒AI診断」HTML埋め込み | まとめセクション末尾（bottom） |
| C-7 | サブCTA「15分相談」HTML埋め込み | C-6直下（bottom） |
| C-8 | 物理導線（コワーキング体験・予約）降格 | CTA「予約リンク」→テキストリンクへ差し替え |

### バーチャルオフィス記事 (`virtual-office-550yen`)

| ブロックID | 内容 | 挿入位置 |
|-----------|------|----------|
| V-1 | 主CTA①「今すぐ申し込む」HTML | タイトル直下（hero） |
| V-2 | 結論・必要ケース・特徴・相場比較 全文 | 本文全面差し替え |
| V-3 | 主CTA②「今すぐ申し込む」HTML | 特徴セクション末尾（mid） |
| V-4 | 利用開始まで・FAQセクション | V-2後半 |
| V-5 | 主CTA③「今すぐ申し込む」HTML | FAQ直後（faq_after） |
| V-6 | サブCTA「LINEで質問する」HTML | 記事末尾（bottom） |

### AI選び方記事 (`ai-selection-guide`)

| ブロックID | 内容 | 挿入位置 |
|-----------|------|----------|
| A-1 | 「比較で迷った方へ」ブリッジ文＋比較記事逆リンク | 冒頭 |
| A-2 | 主CTA①「30秒AI診断」HTML | 冒頭ブリッジ直後（hero） |
| A-3 | 小規模事業者向け実例ブロック | 本文中間に挿入 |
| A-4 | 主CTA②「30秒AI診断」HTML | 本文末尾（bottom） |
| A-5 | サブCTA「15分相談」HTML | A-4直下（bottom） |

### 個室記事 (`private-booth`)

| ブロックID | 内容 | 挿入位置 |
|-----------|------|----------|
| P-1 | 用途別訴求（Web会議/面接/商談/録画/1on1） | 冒頭直後 |
| P-2 | 主CTA①「予約する」HTML | P-1直後（hero） |
| P-3 | 追加FAQ 4問 | 既存FAQ末尾に追加 |
| P-4 | 「こういう方に向いています」まとめ | FAQ直後 |
| P-5 | 主CTA②「予約する」HTML | P-4直後（faq_after） |
| P-6 | サブCTA「LINEで相談する」HTML | 記事末尾（bottom） |

---

## 3. CTA設置位置まとめ

| 記事 | 位置 | CTA種別 | cta_name | cta_position |
|------|------|---------|----------|--------------|
| 比較 | mid（比較表後） | primary | ai_diagnosis | mid |
| 比較 | bottom（まとめ後） | primary | ai_diagnosis | bottom |
| 比較 | bottom | secondary | ai_consultation | bottom |
| バーチャルオフィス | hero | primary | virtual_office_apply | hero |
| バーチャルオフィス | mid（特徴後） | primary | virtual_office_apply | mid |
| バーチャルオフィス | faq_after | primary | virtual_office_apply | faq_after |
| バーチャルオフィス | bottom | secondary | line_consult | bottom |
| AI選び方 | hero | primary | ai_diagnosis | hero |
| AI選び方 | bottom | primary | ai_diagnosis | bottom |
| AI選び方 | bottom | secondary | ai_consultation | bottom |
| 個室 | hero | primary | private_booth_reserve | hero |
| 個室 | faq_after | primary | private_booth_reserve | faq_after |
| 個室 | bottom | secondary | line_consult | bottom |

---

## 4. 計測イベント一覧

| イベント名 | トリガー | 実装場所 |
|-----------|---------|----------|
| `cta_click` | CTAボタンクリック | 全記事・サイト全体Custom Code |
| `consultation_submit` | 15分相談フォーム送信完了 | 相談フォームthanks画面 |
| `booking_complete` | 個室予約確定 | Wix Bookings 予約完了画面 |
| `application_start` | 申込フォーム1ステップ目到達 | バーチャルオフィス申込フォーム冒頭 |
| `application_complete`（推奨） | 申込フォーム送信完了 | 申込thanksページ |
| `line_friend_add`（推奨） | LINE友だち追加リンク クリック | LINEボタン全箇所（cta_clickと重複計測可） |

---

## 5. パラメータ一覧

### `cta_click` 必須パラメータ

| パラメータ | 型 | 値の例 |
|-----------|-----|--------|
| `article_slug` | string | `chatgpt-vs-gemini-vs-claude-comparison-2026` |
| `cta_name` | string | `ai_diagnosis` / `ai_consultation` / `virtual_office_apply` / `line_consult` / `private_booth_reserve` |
| `cta_type` | string | `primary` / `secondary` |
| `cta_position` | string | `hero` / `mid` / `bottom` / `faq_after` |
| `service_type` | string | `ai` / `consultation` / `virtual_office` / `private_booth` |

### `consultation_submit` パラメータ

| パラメータ | 値 |
|-----------|-----|
| `form_type` | `consultation_15min` |
| `source_page` | リファラーURL（自動取得） |

### `booking_complete` パラメータ

| パラメータ | 値 |
|-----------|-----|
| `booking_type` | `private_booth` |
| `value` | 予約金額（Wix Bookings連携で取得） |

### `application_start` / `application_complete` パラメータ

| パラメータ | 値 |
|-----------|-----|
| `service_type` | `virtual_office` |
| `plan` | プラン名（取得可能な場合） |

---

## 6. 取得可能CV

| CV | イベント | 想定月間数（初期） |
|----|---------|-----------------|
| AI診断開始 | `cta_click`（ai_diagnosis） | 計測のみ（遷移先次第） |
| 15分相談申込 | `consultation_submit` | 月2〜5件想定 |
| 個室予約完了 | `booking_complete` | 月10〜30件 |
| バーチャルオフィス申込開始 | `application_start` | 月3〜10件 |
| バーチャルオフィス申込完了 | `application_complete` | 月2〜8件 |
| LINE友だち追加 | `line_friend_add` / `cta_click` | 月5〜20件 |

**注**: AI診断のCVはランディング先フォームの計測設定が必要。診断URL確定後に別途実装。

---

## 7. 実装上の懸念点

| # | 懸念点 | 影響 | 対処 |
|---|-------|------|------|
| 1 | **30秒AI診断URLが未確定** | 比較記事・AI選び方記事のprimary CTAが機能しない | URL確定まで仮リンクでも公開可能。GA4はクリック計測のみ、遷移先CVは後追い実装 |
| 2 | **Wixブログ記事へのHTML埋め込み制限** | data属性付きCTAボタンが標準リッチテキストでは設置不可 | WixエディタのHTML要素（コード埋め込み）を各CTA位置に挿入が必要。Wix Velo利用の場合は別アプローチ |
| 3 | **バーチャルオフィス申込フォームの有無** | 「今すぐ申し込む」のリンク先が存在しない場合、CTA成立しない | 申込フォームURL（/virtual-office または外部フォーム）を事前確認 |
| 4 | **GA4 Measurement IDの確認** | tracking.jsのgtag設定が機能しない | Wix設定 > マーケティングツール > Google アナリティクスのIDを確認 |
| 5 | **バーチャルオフィス記事の既存コンテンツ** | 差し替え前の既存本文をWixエディタからコピーしてバックアップ必要 | 実装前に既存記事を保存 |
| 6 | **consultation_submit計測** | 相談フォームがWix Forms / 外部フォームのどちらか不明 | フォームの種類によって計測コード挿入場所が異なる |

---

## 8. 人間確認が必要な箇所

| 箇所 | 現在の扱い | 確認内容 |
|------|-----------|----------|
| **30秒AI診断のURL** | `[AI_DIAGNOSIS_URL]`プレースホルダー | 実際のURLまたは作成計画を確認 |
| **15分相談の予約URL** | `[CONSULTATION_URL]`プレースホルダー | Calendly / Wix Bookings / LINE のどれか |
| **バーチャルオフィス申込URL** | `/virtual-office`想定 | 実際の申込導線URLを確認 |
| **個室予約URL** | `[BOOKING_URL]`プレースホルダー | Wix Bookingsの実際の予約ページURL |
| **法人登記の表現** | 「法人登記が可能です（詳細はお問い合わせください）」に落とし込み | 「実績あり」と書けるか確認 |
| **銀行法人口座の開設** | 今回の記事から除外 | 記載可否を確認してから追加 |
| **郵便転送の頻度・方法** | 「郵便物対応あり（詳細はお問い合わせください）」に落とし込み | 頻度・方法の詳細を確認 |
| **最短即日** | 「最短翌営業日〜」に落とし込み | 即日対応が可能かどうかを確認 |
| **県外契約者割合** | 「全国対応可能」に落とし込み | 具体的な割合・実績を記載可能か確認 |
| **GA4 Measurement ID** | `G-XXXXXXXXXX`プレースホルダー | Wixアナリティクス設定から取得 |
| **LINE公式アカウントID** | `@968rcbue`（既存ファイルから） | 現在も有効かを確認 |

---

## 実装チェックリスト（Wix作業者向け）

### 先行実装（比較記事 + バーチャルオフィス記事）

- [ ] `cta-tracking.js` を Wix設定 > カスタムコード > ボディ末尾 に設置
- [ ] 比較記事：C-1〜C-8ブロックを順番に挿入（`article-comparison.md`参照）
- [ ] バーチャルオフィス記事：既存本文をバックアップ後、V-1〜V-6で全面差し替え（`article-virtual-office.md`参照）
- [ ] GA4でcta_clickイベントが発火することを確認（DebugViewで確認）

### 次実装（AI選び方記事）

- [ ] A-1〜A-5ブロックを挿入（`article-ai-selection.md`参照）

### 最終実装（個室記事）

- [ ] P-1〜P-6ブロックを挿入（`article-private-booth.md`参照）

---

*担当: HSビル AIチーム｜次回レビュー: 実装完了後1週間*
