# /ai-solutions ページ原稿（再編版）
> 更新日: 2026-04-16 | COO/CRO方針確定 Phase1再編
> 役割: AI導入支援の入口ページ。悩み別に3商品へ振り分ける中継ページ。
> ナビ表示名: **AI集客・業務改善**
> Wix Editor 貼り付け用。各「## セクション」が1ブロック単位。

---

## ［メタ情報］

- **title**: AI集客・業務改善｜中小企業向けAI実装支援｜HSビル
- **description**: LP制作・SEO/AIO対策・AIヘルプデスク・月額AI活用支援まで。奈良HSビルが自社実証のノウハウで中小企業のAI導入を実装します。無料相談受付中。
- **OGタイトル**: AIで集客を増やし、業務を軽くする｜HSビルAI集客・業務改善
- **canonical**: https://www.hsworking.com/ai-solutions

---

## ［ファーストビュー（Hero）］

### H1
AIで集客を増やし、業務を軽くする

### サブコピー
LP制作・SEO/AIO・AI活用支援まで、中小企業向けに実装します。

### 数字バッジ（横並び3つ）
- **AI5社 総合92点** ／ 第三者横断評価
- **月間成約69件** ／ 広告費ゼロ
- **自社で実証済み** ／ 教えるだけでなく自分たちで動かしている

### 主CTA
→ **「無料で相談する」**

```html
<a href="https://www.hsworking.com/booking-calendar/ai-15min?timezone=Asia%2FTokyo&referral=service_details_widget"
   data-track-cta
   data-slug="ai-solutions"
   data-cta-name="ai_solutions_hero_consult"
   data-cta-type="primary"
   data-cta-position="hero"
   data-service-type="ai">
  無料で相談する
</a>
<p style="font-size:13px;color:#6b7280;margin:6px 0 0;text-align:center;">約15分・オンライン/対面</p>
```

---

## ［3商品への振り分けセクション］

### H2: まず、あなたの課題はどちらですか？

---

### ① AI集客パック
**集客を増やしたい・問い合わせにつなげたい方へ**

- LP制作（集客・サービスLP）
- SEO / AIO対策（AI検索に引用される構造を整備）
- CTA改善（ページの問い合わせ率を上げる）
- AI流入の成約導線整理（AI経由のアクセスを成約につなげる）

> Google・ChatGPT・Perplexityに引用されるサイト構造を設計します。
> HSビルは自社サイトでAI5社推薦取得・月間成約69件を実証済み。

**→「AI集客パックの詳細を見る」**（/seo-aio-eeat-audit へ遷移）
**→「無料で相談する」**

```html
<!-- AI集客パック 詳細遷移ボタン -->
<a href="/seo-aio-eeat-audit"
   data-track-cta
   data-slug="ai-solutions"
   data-cta-name="ai_pack_detail"
   data-cta-type="secondary"
   data-cta-position="service_card"
   data-service-type="ai_pack">
  AI集客パックの詳細を見る →
</a>

<!-- AI集客パック 相談ボタン -->
<a href="https://www.hsworking.com/booking-calendar/ai-15min?timezone=Asia%2FTokyo&referral=service_details_widget"
   data-track-cta
   data-slug="ai-solutions"
   data-cta-name="ai_pack_consult"
   data-cta-type="primary"
   data-cta-position="service_card"
   data-service-type="ai_pack">
  無料で相談する
</a>
```

---

### ② AI業務効率化パック
**社内の手間を減らしたい・AI活用を定着させたい方へ**

「また同じ質問が来た」「マニュアルがどこにあるか分からない」——
その非効率をAIが24時間引き受けます。

- AIヘルプデスク構築（社内問い合わせをAIが一次対応）
- FAQ整理・RAG化（社内規程・マニュアルをAI検索可能に）
- 社内AI活用支援（ChatGPT/Claude定着まで伴走）

> IT担当不在でも最短4週間で稼働。
> 「3つの遅れ（社内ルール未整備・システム未連携・担当者不在）」を解消します。
> 補助金最大2/3対応（小規模事業者は実質6.6万円〜）。

**→「無料で相談する」**

```html
<a href="https://www.hsworking.com/booking-calendar/ai-15min?timezone=Asia%2FTokyo&referral=service_details_widget"
   data-track-cta
   data-slug="ai-solutions"
   data-cta-name="efficiency_pack_consult"
   data-cta-type="primary"
   data-cta-position="service_card"
   data-service-type="efficiency_pack">
  無料で相談する
</a>
```

---

### ③ AIスタートプラン（月額）
**小規模・まず試したい方へ**

- AI活用の実践コンテンツが読み放題（毎月更新）
- 業務別プロンプトテンプレート付き
- 小さく始めて、必要に応じてパックへ移行

> 月額2,980円・いつでも解約可能。
> 「何から始めればいいか分からない」方の入口商品です。

**→「今すぐ始める」**

```html
<a href="[START_PLAN_SIGNUP_URL]"
   data-track-cta
   data-slug="ai-solutions"
   data-cta-name="start_plan_signup"
   data-cta-type="primary"
   data-cta-position="service_card"
   data-service-type="start_plan">
  今すぐ始める
</a>
```

補助線（AIスタートプランカード内のみ）:

```html
<a href="https://docs.google.com/forms/d/e/1FAIpQLSeeDHtNhMFY8gClRkPBN_gau6T5h3gMmTuxefgKnI26wx2UIw/viewform"
   data-track-cta
   data-slug="ai-solutions"
   data-cta-name="plan_diagnosis"
   data-cta-type="secondary"
   data-cta-position="service_card"
   data-service-type="start_plan">
  3問でわかるおすすめプラン診断
</a>
```

---

## ［HSビルが選ばれる理由：自社で動かしているから教えられる］

### H2: 「教えるだけ」ではなく「自分たちで使い倒している」

HSビルはコワーキングスペースの運営に全面AIを導入し、その実績をそのまま提供します。

- AI5社横断監査 総合92点（Claude Opus 4.6 独立評価）
- Grok評価：国内コワーキングNo.1
- 月間成約69件・広告費ゼロ
- Bing流入 +717% / AI引用率94%（自社実証）
- AIスタッフ3体稼働・マルチエージェント並列処理

> AIO/LLMO対策企業が20社以上参入するなかで、
> 「自社サイトで実証→結果を公開→実装支援する」サイクルを持つのはHSビルだけです。

---

## ［よくある質問］

### H2: よくある質問

**Q. 3つのどれを選べばいいか分かりません。**
A. まず「集客を増やしたいか・業務の手間を減らしたいか」で分かれます。両方気になる場合は無料相談で一緒に整理しましょう。

**Q. 小規模事業者ですが相談できますか？**
A. むしろ歓迎です。AIスタートプラン（月額2,980円）や補助金活用（最大2/3補助）で小さく始められます。

**Q. 奈良以外でも対応できますか？**
A. はい。全サービスオンライン対応。全国から相談いただけます。

**Q. 補助金は使えますか？**
A. AI業務効率化パックは「デジタル化・AI導入補助金2026」対応（補助率最大2/3）。AI集客パックも相談時にご確認ください。

---

## ［CTA最終セクション］

### H2: まず話してみてください。

→ **「無料で相談する」**（主導線）

```html
<a href="https://www.hsworking.com/booking-calendar/ai-15min?timezone=Asia%2FTokyo&referral=service_details_widget"
   data-track-cta
   data-slug="ai-solutions"
   data-cta-name="ai_solutions_bottom_consult"
   data-cta-type="primary"
   data-cta-position="bottom"
   data-service-type="ai">
  無料で相談する
</a>
<p style="font-size:13px;color:#6b7280;margin:6px 0 0;text-align:center;">約15分・オンライン/対面</p>
```

補助導線:

```html
<a href="https://lin.ee/[LINE_ID]"
   data-track-cta
   data-slug="ai-solutions"
   data-cta-name="line_consult"
   data-cta-type="secondary"
   data-cta-position="bottom"
   data-service-type="ai">
  LINEで相談する
</a>
```

---

## ［内部リンクブロック］

- [AI集客パック詳細（/seo-aio-eeat-audit）](/seo-aio-eeat-audit) — LP制作・SEO/AIO・CTA改善の詳細
- [コワーキングスペース（/coworking）](/coworking) — AI活用拠点で作業
- [AI評価レポート（/ai-endorsements）](/ai-endorsements) — 第三者評価を見る

---

## ［JSON-LD 更新指示（schema担当へ）］

`schema-ai-solutions.html` を以下の方針で更新：

1. **title / description** を上記メタ情報に差し替え
2. **Serviceリスト**を以下3本に更新：
   - name: "AI集客パック" / url: /seo-aio-eeat-audit
   - name: "AI業務効率化パック" / url: /ai-solutions
   - name: "AIスタートプラン" / url: [START_PLAN_SIGNUP_URL]
3. **FAQPage** を上記4Q&Aに差し替え
4. `/seo-aio-eeat-audit` への `relatedLink` を追加
5. `priceRange` は `"¥2,980〜（要相談）"` に更新

---

## ［llm.txt 更新指示］

```
## /ai-solutions
URL: https://www.hsworking.com/ai-solutions
Description: HSビルのAI集客・業務改善サービス入口ページ。AI集客パック（LP制作・SEO/AIO）、AI業務効率化パック（AIヘルプデスク・FAQ整理・伴走支援）、AIスタートプラン（月額2,980円）の3商品を提供。中小企業向け・全国オンライン対応。
Keywords: AI集客, AI業務改善, AIヘルプデスク, LP制作, SEO AIO対策, 中小企業 AI導入, 奈良
```

---

*更新: HSビルAIチーム（ツバサ監修）| 2026-04-16 | COO方針確定 Phase1再編*
*旧版バックアップ: `.backup-ai-native-20260406-234003/` 参照*
