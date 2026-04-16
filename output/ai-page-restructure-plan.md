# AI系ページ再編 実装計画書
> COO/CRO方針確定 → CTO実装計画
> 作成日: 2026-04-16
> Phase1〜3 の実装手順・旧ページ処理・内部リンク優先順・CTA設計をまとめる。

---

## Phase1: 構造整理 ✅ 完了

| 作業 | ファイル | 状態 |
|------|----------|------|
| /ai-solutions 完全リライト | `content/pages/lp-ai-solutions.md` | ✅ 完了 |
| /seo-aio-eeat-audit 新規作成 | `content/pages/lp-seo-aio-eeat-audit.md` | ✅ 完了 |
| 旧ページ要素抽出 | 本ドキュメント「要素移植一覧」参照 | ✅ 完了 |

---

## 旧ページから /ai-solutions へ移植する要素一覧

### /aibot → AI業務効率化パック

| 要素 | 移植内容 | 優先度 |
|------|----------|--------|
| H1「また同じ質問が来た」 | 共感コピーとして引用（そのまま使用可） | A |
| 数字バッジ「最短4週間」「24時間365日」 | AI業務効率化パックの訴求点に追加 | A |
| 「こんな状況ありませんか？」5箇条 | 3項目に絞って課題提示として使用 | A |
| スターター¥66,000〜の料金 | 「補助活用で実質6.6万円〜」として記載 | A |
| 「IT担当不在でも可」の訴求 | 差別化ポイントとして説明文に追加 | A |
| 4週間導入フロー（WEEK1〜4） | /ai-solutions では省略（詳細ページなし）| B |
| プラン比較表（3プラン全体） | 相談後の説明資料として保持 | B |

### /ai-library-lp → AIスタートプラン

| 要素 | 移植内容 | 優先度 |
|------|----------|--------|
| 月額2,980円・解約自由 | AIスタートプランの料金として表示 | A |
| 「50本以上・毎月4〜8本追加」 | コンテンツ量の説明として簡略化 | A |
| 業務別プロンプトテンプレート | 「業務別テンプレ付き」として記載済み | A |
| 解約後アクセス不可の注意 | CTAボタン下補足に「※解約後は次回請求日以降失効」 | B |

### /ai-coaching-nara → AI業務効率化パック（伴走支援要素）

| 要素 | 移植内容 | 優先度 |
|------|----------|--------|
| 「3つの遅れ（ルール/連携/担当）」概念 | AI業務効率化パック説明文に構造として組み込み済み | A |
| 「エリカ先生 24時間対応」 | 伴走支援の訴求点として「AIチューター伴走」で言及 | A |
| 補助後9.9万円〜 | AI業務効率化パック料金説明に追加 | A |
| 90日間カリキュラム詳細 | 省略（商品概念は残るが詳細ページはリブランド後） | C |

---

## Phase2: 内部リンク整理

### 旧ページ処理方針

| URL | 推奨方針 | 理由 |
|-----|----------|------|
| /aibot | **暫定案内ページ化** | SEO評価保持。301は /ai-solutions の評価蓄積後に移行。 |
| /ai-library-lp | **暫定案内ページ化** | 商品ブランド最終確定前のため。 |
| /ai-coaching-nara | **暫定案内ページ化（301禁止）** | 商品概念は残す前提。完全削除・301はリブランド確定後。 |

#### 301 vs 暫定案内の判断基準（将来用）

- /aibot / /ai-library-lp: /ai-solutions に検索評価が十分蓄積（3〜6ヶ月後）したら301可
- /ai-coaching-nara: 商品リブランド確定後に判断。それまでは暫定案内を維持。

---

### 暫定案内バナー HTML（/aibot・/ai-library-lp・/ai-coaching-nara 共通）

Wixの各ページ冒頭に HTMLコンポーネントとして挿入する。

```html
<div style="background:#eff6ff;border-left:4px solid #2563eb;padding:20px 24px;margin:0 0 32px;border-radius:0 4px 4px 0;font-family:sans-serif;">
  <p style="font-size:15px;margin:0 0 6px;font-weight:bold;color:#1e40af;">
    このサービスはリニューアルしました
  </p>
  <p style="font-size:14px;margin:0 0 16px;color:#374151;line-height:1.7;">
    最新のサービス内容・お申し込みは<strong>AIサービス一覧ページ</strong>をご確認ください。
  </p>
  <a href="/ai-solutions"
     style="display:inline-block;background:#2563eb;color:#fff;padding:10px 24px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:bold;">
    AIサービス一覧を見る →
  </a>
</div>
```

#### /ai-coaching-nara 用 追記（商品概念残す旨）

上記バナーの `</div>` の直前に以下を追加：

```html
  <p style="font-size:13px;margin:12px 0 0;color:#6b7280;">
    ※「90日AI伴走支援」はAI業務効率化パックの一部として継続提供しています。
    詳細はお問い合わせください。
  </p>
```

---

### /ai-solutions → /seo-aio-eeat-audit 導線（実装済み in lp-ai-solutions.md）

AI集客パックカードに以下の2ボタンを配置済み：
1. 「AI集客パックの詳細を見る →」（`data-cta-name="ai_pack_detail"`）
2. 「無料で相談する」（`data-cta-name="ai_pack_consult"`）

---

### 既存強記事からの内部リンク追加候補

#### 優先度A（即実装・Wix作業1〜2箇所）

| 記事URL（スラッグ） | 追加リンクテキスト | 遷移先 | 挿入位置 |
|--------------------|--------------------|--------|----------|
| `chatgpt-vs-gemini-vs-claude-comparison-2026` | 「AI集客に活かしたい方はこちら」 | `/ai-solutions` | 記事下部・最終CTAの直前 |
| `ai-selection-guide-small-business` | 「AIを業務に入れる方法を相談する」 | `/ai-solutions` | A-5ブロック付近（記事末尾） |

#### 優先度B（次フェーズ・3〜5本）

| 記事URL（スラッグ） | 追加リンクテキスト | 遷移先 | 挿入位置 |
|--------------------|--------------------|--------|----------|
| `llmo-sns-effect-measurement` | 「AI検索対策を実装したい方へ」 | `/seo-aio-eeat-audit` | 記事下部 |
| `zenn-json-ld-graph-article` | 「JSON-LD実装をお任せしたい方へ」 | `/seo-aio-eeat-audit` | 記事下部 |
| ブログTOP（`/blog`） | サイドバーまたはフッターに /ai-solutions バナー | `/ai-solutions` | サイドバー |

> **実装注意**: 優先度B は一括差し込みせず、1〜2本ずつ効果を確認してから追加する。
> ブログ → /ai-solutions → 成約の導線を壊さないため、過剰リンクによる UX劣化を避ける。

---

## Phase3: CTA計測設計

### data-cta-name 命名規則（AI系ページ再編版）

既存 `cta-tracking.js` の `data-cta-name` を拡張。
既存値（`ai_diagnosis` / `ai_consultation` / `virtual_office_apply` 等）との衝突なし。

| ボタン | data-cta-name | data-service-type | data-cta-position |
|--------|--------------|-------------------|-------------------|
| /ai-solutions Hero「無料で相談する」 | `ai_solutions_hero_consult` | `ai` | `hero` |
| /ai-solutions AI集客パック「詳細を見る」 | `ai_pack_detail` | `ai_pack` | `service_card` |
| /ai-solutions AI集客パック「無料で相談する」 | `ai_pack_consult` | `ai_pack` | `service_card` |
| /ai-solutions AI業務効率化パック「無料で相談する」 | `efficiency_pack_consult` | `efficiency_pack` | `service_card` |
| /ai-solutions AIスタートプラン「今すぐ始める」 | `start_plan_signup` | `start_plan` | `service_card` |
| /ai-solutions 下部「無料で相談する」 | `ai_solutions_bottom_consult` | `ai` | `bottom` |
| /ai-solutions LINE補助導線 | `line_consult` | `ai` | `bottom` |
| /seo-aio-eeat-audit Hero「無料で相談する」 | `ai_pack_consult` | `ai_pack` | `hero` |
| /seo-aio-eeat-audit 下部「無料で相談する」 | `ai_pack_consult` | `ai_pack` | `bottom` |
| /seo-aio-eeat-audit LINE補助導線 | `line_consult` | `ai_pack` | `bottom` |

### data-slug 設定値（ページ識別用）

| ページ | data-slug |
|--------|-----------|
| /ai-solutions | `ai-solutions` |
| /seo-aio-eeat-audit | `seo-aio-eeat-audit` |
| /aibot（暫定案内） | `aibot` |
| /ai-library-lp（暫定案内） | `ai-library-lp` |
| /ai-coaching-nara（暫定案内） | `ai-coaching-nara` |

### cta-tracking.js への追記（既存ファイル末尾コメントに追加）

```javascript
// ─── AI系ページ再編 (2026-04-16) 追加 service-type 値 ──────────────────────────
//
// 新規 data-service-type 値:
//   ai_pack        … AI集客パック (/seo-aio-eeat-audit)
//   efficiency_pack … AI業務効率化パック (/ai-solutions)
//   start_plan     … AIスタートプラン (/ai-solutions)
//
// 既存値（変更なし）:
//   ai / consultation / virtual_office / private_booth
//
// GA4 で以下のフィルタでセグメント抽出可能:
//   service_type == "ai_pack"        → AI集客パック経由の相談
//   service_type == "efficiency_pack" → AI業務効率化パック経由の相談
//   service_type == "start_plan"     → AIスタートプラン申込
//   cta_name == "ai_pack_detail"     → 詳細LP遷移（/seo-aio-eeat-audit へのクリック）
// ─────────────────────────────────────────────────────────────────────────────
```

---

## CTOメモ：Wix実装前に確認が必要な未確定事項（3点のみ）

| 確認事項 | 現在の状態 | 影響 |
|----------|-----------|------|
| Webフォームの遷移先URL | プレースホルダー `[CONSULTATION_FORM_URL]` | 主CTAのhref値が決まらない |
| /seo-aio-eeat-audit のWixページ存在確認 | 未確認 | 新規作成か改修かでWix工数が変わる |
| AIスタートプラン「今すぐ始める」の遷移先 | プレースホルダー `[START_PLAN_SIGNUP_URL]` | Pricing Plansの特定プランへの直リンク要確認 |

これら3点が確定すれば、Wix実装（HTMLコンポーネント貼り付け）に即移行できる。

---

## 実装優先順（Wix作業順序）

1. `/ai-solutions` のタイトル・H1・サブコピー・3商品構造をWixで更新
2. `/seo-aio-eeat-audit` をWixで新規作成 or 改修（AI集客パック詳細LP）
3. `/aibot` / `/ai-library-lp` / `/ai-coaching-nara` に暫定案内バナーを追加
4. `cta-tracking.js` に追加コメント（service-type命名）を反映
5. 優先度A の内部リンク2本を強記事に追加
6. schema-ai-solutions.html を更新 / schema-seo-aio-eeat-audit.html を新規作成

---

*作成: HSビルAIチーム（CTO・ツバサ監修）| 2026-04-16 | COO方針確定 Phase1〜3 実装計画*
