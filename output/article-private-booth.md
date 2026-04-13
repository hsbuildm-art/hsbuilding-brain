# 個室記事 修正ブロック
# スラッグ: nara-web-meeting-private-booth

> Wix作業者向け: 既存記事を開き、以下のブロックIDの指示どおりに挿入してください。
> 既存本文は基本的に保持し、指定箇所のみ追加します。

---

## P-1: 用途別訴求ブロック
**挿入位置**: タイトル直下・本文の最上部（リード文があれば直後）
**操作**: HTML要素を挿入

```html
<div style="border:1px solid #dde3f0;border-radius:10px;padding:24px 28px;margin:16px 0 28px;background:#fafcff;">
  <p style="font-weight:bold;font-size:17px;margin:0 0 16px;">この個室ブースはこんな用途で使われています</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
    <div style="background:#e8f0fe;border-radius:8px;padding:12px 16px;">
      <p style="font-weight:bold;margin:0 0 4px;font-size:14px;">💻 Web会議・オンライン商談</p>
      <p style="margin:0;font-size:13px;color:#444;">防音個室で背景・音声ともに安定。カメラ映りも清潔感ある空間です。</p>
    </div>
    <div style="background:#e8f0fe;border-radius:8px;padding:12px 16px;">
      <p style="font-weight:bold;margin:0 0 4px;font-size:14px;">🎯 オンライン面接（受ける側・行う側）</p>
      <p style="margin:0;font-size:13px;color:#444;">自宅で面接を受けにくい方、採用面接を実施したい企業様にも。</p>
    </div>
    <div style="background:#e8f0fe;border-radius:8px;padding:12px 16px;">
      <p style="font-weight:bold;margin:0 0 4px;font-size:14px;">📹 動画・音声の収録・録画</p>
      <p style="margin:0;font-size:13px;color:#444;">防音環境でのレコーディング・研修動画・Zoom録画に対応。</p>
    </div>
    <div style="background:#e8f0fe;border-radius:8px;padding:12px 16px;">
      <p style="font-weight:bold;margin:0 0 4px;font-size:14px;">🤝 1on1・メンタリング・コーチング</p>
      <p style="margin:0;font-size:13px;color:#444;">オンラインでの個人面談・キャリア相談・コーチングセッションに。</p>
    </div>
    <div style="background:#e8f0fe;border-radius:8px;padding:12px 16px;grid-column:1/-1;">
      <p style="font-weight:bold;margin:0 0 4px;font-size:14px;">🧠 集中作業・機密案件の処理</p>
      <p style="margin:0;font-size:13px;color:#444;">周囲に見られたくない作業、高集中が必要な案件を個室で完結。</p>
    </div>
  </div>
</div>
```

---

## P-2: 主CTA①「予約する」（hero）
**挿入位置**: P-1（用途別訴求）の直後
**操作**: HTML要素を挿入

```html
<div style="text-align:center;margin:0 0 32px;">
  <a href="[BOOKING_URL]"
     data-track-cta
     data-slug="nara-web-meeting-private-booth"
     data-cta-name="private_booth_reserve"
     data-cta-type="primary"
     data-cta-position="hero"
     data-service-type="private_booth"
     style="display:inline-block;padding:16px 40px;background:#e63946;color:#fff;border-radius:8px;text-decoration:none;font-size:17px;font-weight:bold;">
    個室ブースを予約する →
  </a>
  <p style="margin:8px 0 0;font-size:13px;color:#888;">950円/時間〜｜当日予約対応（詳細は下記FAQ参照）</p>
</div>
```

> ⚠️ **要確認**: `[BOOKING_URL]` を実際の予約ページURLに差し替えてください。

---

## P-3: 追加FAQ 4問
**挿入位置**: 既存FAQセクションの末尾に追加
**操作**: 既存FAQブロックの後に以下を追記

---

**追加FAQ①：有線LAN接続はできますか？**

現在、個室ブースのご利用は高速Wi-Fi（ソフトバンク光10G・最大1.0Gbps）となっています。有線LANの提供については、お問い合わせいただければ確認いたします。

---

**追加FAQ②：オンライン面接（受ける側）での利用は可能ですか？**

はい。防音個室での面接受験や採用面接の実施にご利用いただいています。静かな環境・カメラに映る清潔な背景・安定したWi-Fiが揃っています。面接用途での利用は他のご利用者様の邪魔にもなりませんので安心してご利用ください。

---

**追加FAQ③：当日予約はどこまで受け付けていますか？**

当日予約の受付については、空き状況や申込締切時間がございます。詳細は予約ページまたはLINEにてご確認ください。なお、予約状況によっては当日のご利用が難しい場合もありますので、余裕をもってのご予約をお勧めします。

---

**追加FAQ④：防音性はどの程度ですか？Web会議中の声は外に漏れますか？**

個室ワークブースは防音仕様となっており、通常の会話・Web会議の音声が外に漏れにくい設計です。ただし、録音スタジオ級の完全防音ではありません。通常のオンライン会議・面接・1on1には十分な防音性があります。大声での発声や楽器演奏には音楽スタジオのご利用をご検討ください。

---

## P-4: 「こういう方に向いています」まとめブロック
**挿入位置**: FAQ直後・予約CTAの前
**操作**: テキストブロックまたはHTML要素として挿入

```html
<div style="background:#fff8f0;border-radius:10px;padding:24px 28px;margin:28px 0;">
  <p style="font-weight:bold;font-size:17px;margin:0 0 14px;">こういう方に向いています</p>
  <ul style="margin:0;padding-left:20px;line-height:1.9;font-size:15px;color:#333;">
    <li>自宅でのWeb会議が難しい環境にある方（家族・ペット・騒音）</li>
    <li>オンライン面接を受ける・行うための静かな個室が必要な方</li>
    <li>カフェより安定したWi-Fiと防音環境が必要な方</li>
    <li>動画収録・音声録音に使えるスペースを探している方</li>
    <li>コワーキングスペースで個室が必要になった方（同ビル内で移動可）</li>
    <li>1時間だけ・半日だけなど、短時間から利用したい方</li>
  </ul>
  <p style="margin:14px 0 0;font-size:13px;color:#888;">
    ※ 最大3名まで利用可｜設備：高速Wi-Fi・エルゴチェア・防音仕様<br>
    ※ バーチャルオフィスについてはこちら：
    <a href="/post/virtual-office-ai-550yen" style="color:#1a73e8;">月額550円〜のバーチャルオフィス</a>
  </p>
</div>
```

---

## P-5: 主CTA②「予約する」（faq_after）
**挿入位置**: P-4（まとめブロック）の直後
**操作**: HTML要素を挿入

```html
<div style="text-align:center;margin:16px 0;">
  <a href="[BOOKING_URL]"
     data-track-cta
     data-slug="nara-web-meeting-private-booth"
     data-cta-name="private_booth_reserve"
     data-cta-type="primary"
     data-cta-position="faq_after"
     data-service-type="private_booth"
     style="display:inline-block;padding:16px 40px;background:#e63946;color:#fff;border-radius:8px;text-decoration:none;font-size:17px;font-weight:bold;">
    個室ブースを予約する →
  </a>
  <p style="margin:8px 0 0;font-size:13px;color:#888;">950円/時間〜｜近鉄大和西大寺駅 北口 徒歩4分</p>
</div>
```

---

## P-6: サブCTA「LINEで相談する」（bottom）
**挿入位置**: P-5の直後・記事の末尾
**操作**: HTML要素を挿入

```html
<div style="text-align:center;margin:8px 0 40px;">
  <p style="font-size:14px;color:#555;margin:0 0 10px;">予約前に確認したいことがある方</p>
  <a href="https://lin.ee/[LINE_SHORTCODE]"
     data-track-cta
     data-slug="nara-web-meeting-private-booth"
     data-cta-name="line_consult"
     data-cta-type="secondary"
     data-cta-position="bottom"
     data-service-type="private_booth"
     style="display:inline-block;padding:12px 32px;background:#06c755;color:#fff;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold;">
    LINEで相談する
  </a>
  <p style="margin:8px 0 0;font-size:12px;color:#999;">LINE公式アカウント @968rcbue</p>
</div>
```

> ⚠️ **要確認**: `https://lin.ee/[LINE_SHORTCODE]` を実際のLINE友だち追加URLに差し替えてください。

---

## 内部リンク設定まとめ（この記事から）

| リンク先 | アンカーテキスト | 設置箇所 |
|---------|----------------|---------|
| `[BOOKING_URL]` | 個室ブースを予約する | P-2（hero）・P-5（faq_after） |
| `https://lin.ee/[LINE_SHORTCODE]` | LINEで相談する | P-6（bottom） |
| `/post/virtual-office-ai-550yen` | 月額550円〜のバーチャルオフィス | P-4（まとめブロック内） |
