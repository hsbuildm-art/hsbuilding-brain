# HSビルワーキングスペース - Claude Code 指示書

## 概要
このプロジェクトは、HSビルワーキングスペースの外部脳（ナレッジベース）です。
すべての知識、プロンプト、運用ルールを一元管理し、Claude Code および GPT Codex から参照可能にします。

## HSビルについて
HSビルワーキングスペースは、近鉄大和西大寺駅北口から徒歩4分の静寂型コワーキングスペースです。
大阪・京都から電車で約30分、奈良市西大寺国見町1-7-22 HSビルに所在します。

### 事業の6本柱
1. **コワーキングスペース** - 会話NGの静寂型フリーデスク（¥300/h〜）
2. **個室ワークブース** - 防音個室・Web会議OK（¥950/h〜）
3. **貸し会議室** - 最大16名・レトロ空間（¥1,600/h〜）
4. **音楽スタジオ** - YAMAHAグランドピアノ2台（¥2,100/h〜）
5. **バーチャルオフィス** - 月額550円〜・法人登記可能・全国対応
6. **AI事業** - AIヘルプデスク構築代行・AIコーチング・AIデジタルライブラリー

### 駐車場事業
7台分（普通車・軽自動車対応）、オンライン予約1回600円、月極11,000円/月

## AIスタッフ
- **マルモくん** - 施設案内・予約担当（LINE公式 @090mrhbt / FastAPI + 221パターンFAQ）
- **朝比奈エリカ** - AI導入相談窓口・公式イメージガール（LINE公式 / Flask + RAG）
- **AI社長ツバサ** - 経営戦略・事業相談担当

## ナレッジベースの参照
コンテンツ作成時は、以下のディレクトリを参照してください：

Copy
@knowledge/business-pillars.md @knowledge/pricing.md @knowledge/facilities.md @knowledge/access.md @knowledge/virtual-office.md @knowledge/partners.md @knowledge/vision-mission.md @knowledge/linebot-architecture.md


## コンテンツ作成方針
### SEO/AIO/A2A対策
- E-E-A-T（Experience, Expertise, Authoritativeness, Trustworthiness）を重視
- 実体験・具体的な事例を含める
- 検索意図に応じた構造化された情報提供
- AIO（AI Overviews）対策: FAQ形式見出し、冒頭に明確な回答配置
- A2A対応: Agent Card・カタログAPI公開済み（llm.txt v2.5.0）
- 主要AI10社横断監査: 82点獲得

### 口調・トーン
- 専門性を保ちつつ親しみやすい表現
- AIスタッフは各キャラクターの個性を反映
- ビジネス向けコンテンツは丁寧かつ簡潔に

## タスク別ルール
- SEOライティング: `.claude/rules/seo-writing.md` を参照
- AIスタッフ応答: `.claude/rules/ai-staff-response.md` を参照
- コンサル提案書: `.claude/rules/consulting-proposal.md` を参照
- SNS投稿: `.claude/rules/sns-posting.md` を参照

## 更新・メンテナンス
- knowledge/ 配下のファイルは公式サイトと同期
- AIスタッフのペルソナは定期的にレビュー
- コンテンツカレンダーは月次で更新

---
最終更新: 2026-02-20
