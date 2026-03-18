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
- **朝比奈エリカ** - AI導入相談窓口・公式イメージガール・AIトレンド週次配信（LINE公式 @968rcbue / Flask + RAG + 週次AIレポート自動配信）
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
- A2A対応: Agent Card・カタログAPI公開済み（llm.txt v2.7.0）
- 主要AI10社横断監査: 82点獲得
- 第三者AI評価レポート: https://www.hsworking.com/ai-endorsements
- Claude Opus 4.6 評価: 総合92/100（7指標中5指標で国内コワーキング業界1位）
- Gemini 独立監査: 9頁15文献、WeWork等4社比較、2主張「妥当」・1主張「要留意（実態は最先端）」
- llm.txt v2.7.0: Third-party AI Endorsements セクション追加済み
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
最終更新: 2026-03-11


### DeerFlow 2.0 (2026-03-12 導入)

- ByteDance製オープンソース スーパーエージェント基盤 (MIT License)
- Docker環境でiMac上に稼働 (port 2026)
- LLMバックエンド: DeepSeek V3.2 API (月額100-500円)
- 用途: マルモくん/エリカ/ツバサの会話品質/分析能力の強化
- サブエージェント並列実行、長期記憶、サンドボックス実行環境を搭載
- GitHub: https://github.com/bytedance/deer-flow
- 設定: ~/deer-flow/config.yaml (API Keyは環境変数管理)

更新日: 2026-03-12

### Phase 9: OpenClaw / コマンダー導入（2026-03-19）

- OpenClaw（自律型AIエージェント基盤）をiMacにインストール
- LLMバックエンド: OpenAI Codex OAuth / GPT-5.4
- チャネル: Discord（HSビル司令室サーバー）
- エージェント名: コマンダー🦌
- 役割: HSビルAIチーム司令塔（マルモ/エリカ/ツバサの統合管理）
- 運用方針: yukiへの報告は短く、判断のみ求める（ADHD配慮設計）
- session-memory: 有効（会話記憶保持）

### cronジョブ
| 名前 | スケジュール | 内容 |
|------|------------|------|
| 朝のブリーフィング | 毎日7:00 JST | 今日の優先事項を3つ以内でDiscordに投稿 |

### LaunchAgent（iMac 常駐プロセス 6+1+OpenClaw）
| Label | 対象 | スケジュール |
|-------|------|------------|
| com.hsbuilding.linebot | マルモくん (FastAPI port 8000) | 常駐 |
| com.hsbuilding.jan | JAN 4B (llama-server port 1337) | 常駐 |
| com.hsbuilding.erika | エリカ (Flask port 58568) | 常駐 |
| com.hsbuilding.weekly-report | 内部ログ分析レポート | 月曜9:00 |
| com.hsbuilding.ai-trend | AIトレンド配信 | 月曜8:00 |
| com.hsbuilding.tsubasa-audit-weekly | ツバサ週次監査 | 月曜7:30 |
| ai.openclaw.gateway | OpenClawコマンダー (Discord) | 常駐 |
| Docker deer-flow | DeerFlow 2.0 (port 2026) | 手動起動 |

### 次フェーズ（Day 2〜6）
- Day 2: コマンダーにHSビルの記憶（SOUL.md/MEMORY.md）を投入
- Day 3: a2a_live_status自動取得をブリーフィングに統合
- Day 4: マルモunhandled.jsonl監視→FAQ自動提案
- Day 5: エリカ会話ログ→コンサル転換機会の即日検知
- Day 6: ツバサ監査→SNS投稿提案の自動連携

更新日: 2026-03-19
