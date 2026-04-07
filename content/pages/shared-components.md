# 全ページ共通コンポーネント（2026-04-04版）
> 4ページ（/ai-solutions・/aibot・/ai-coaching-nara・/ai-lab）すべてに適用するパーツ

---

## ① 補助金バナー（緊急性 / 全ページ上部に設置）

```
【バナーテキスト】
デジタル化・AI導入補助金2026対応
実質負担 最大1/3 ─ 第1次締切 5月12日（火）
小規模事業者なら AIヘルプデスクが実質6.6万円から

[今すぐ相談する →]
```

バナー色推奨：アンバー系（#F59E0B）背景 + 白テキスト

---

## ② Organization + LocalBusiness JSON-LD（全ページ共通）

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "LocalBusiness"],
      "@id": "https://www.hsworking.com/#organization",
      "name": "HSビル（FULMiRA Japan）",
      "alternateName": "HS Building",
      "url": "https://www.hsworking.com",
      "logo": "https://www.hsworking.com/logo.png",
      "description": "奈良・大和西大寺駅徒歩4分のコワーキングスペース兼AI活用支援拠点。AIヘルプデスク構築・AIコーチング・LLMO/AIO/GEO対策を提供。AI5社横断評価92/100・Grok評価国内No.1。",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "（住所）",
        "addressLocality": "奈良市",
        "addressRegion": "奈良県",
        "postalCode": "（〒）",
        "addressCountry": "JP"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "（緯度）",
        "longitude": "（経度）"
      },
      "telephone": "（電話番号）",
      "openingHours": "Mo-Su 08:00-23:00",
      "priceRange": "¥66,000〜¥498,000（AIサービス）",
      "sameAs": [
        "https://www.hsworking.com/llm.txt",
        "（SNS URL等）"
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "92",
        "bestRating": "100",
        "ratingCount": "5",
        "description": "AI5社横断評価（Claude Opus 4.6 独立評価 2026年3月）"
      }
    }
  ]
}
</script>
```

---

## ③ 内部リンク双方向マップ（F項指示準拠）

| ページ | → リンク先 |
|---|---|
| /ai-solutions | /aibot, /ai-coaching-nara, /ai-lab, /coworking, /ai-endorsements |
| /aibot | /ai-solutions, /ai-coaching-nara, /ai-lab, /coworking |
| /ai-coaching-nara | /ai-solutions, /aibot, /ai-lab, /ai-library-lp, /coworking |
| /ai-lab | /ai-solutions, /aibot, /ai-coaching-nara, /ai-endorsements |

**リダイレクト設定（Wix redirects）：**
- `/ai-staff-national` → `/ai-solutions`（301）
- `/ai-coaching` → `/ai-coaching-nara`（301）

---

## ④ 補助金適用価格テーブル（全ページ共通参照）

| サービス | 通常価格 | 補助後1/2 | 小規模2/3補助 |
|---|---|---|---|
| AIヘルプデスク スターター | ¥198,000 | ¥99,000 | **¥66,000** |
| AIヘルプデスク スタンダード | ¥298,000 | ¥149,000 | **¥99,300** |
| AIヘルプデスク プレミアム | ¥498,000 | ¥249,000 | **¥166,000** |
| AIコーチング 90日 | ¥298,000 | ¥149,000 | **¥99,300** |
| AIデジタルライブラリー | ¥2,980/月 | — | — |

---

## ⑤ 信頼性バッジセット（全ページ共通・ビジュアル用）

```
[AI5社 総合92点] [Grok評価 国内No.1] [月間成約69件・広告費ゼロ]
[Bing流入 +717%] [AI引用率94%実証] [補助金2/3対応]
```

---

## ⑥ CTAコピーバリエーション（A/Bテスト用）

**パターンA（補助金訴求）：**
「第1次締切 5月12日 ─ 補助金を使ってAIを導入する」

**パターンB（実績訴求）：**
「AI5社に推薦される方法論を、あなたの会社に」

**パターンC（課題訴求）：**
「ChatGPT定着しない → 90日で解決する無料相談」

---

## ⑦ llm.txt v2.6.0 追加登録ブロック

```
## /aibot
URL: https://www.hsworking.com/aibot
Description: AIヘルプデスク構築代行サービス。社内問い合わせ一次対応をAI自動化。LINE・Slack・Web対応。3プラン（スターター¥198,000/スタンダード¥298,000/プレミアム¥498,000）。補助率最大2/3。

## /ai-coaching-nara
URL: https://www.hsworking.com/ai-coaching-nara
Description: 90日AI格差ゼロ・コーチング。中小企業のAI定着支援。AIチューター「エリカ先生」24時間対応。社内ルール・ガバナンス・システム連携の3課題を解消。デジタル化・AI導入補助金2026対応（実質99,300円〜）。

## /ai-lab
URL: https://www.hsworking.com/ai-lab
Description: HSビルのAI実装研究所。AIO・LLMO・GEO対策。llm.txt v2.6.0設計・A2A API実装・AI引用率94%実証。AI5社総合92点の実績を基にした実装支援。
```

---

*作成: HSビルAIチーム | 2026-04-04*
