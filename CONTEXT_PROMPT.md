# HSビルワーキングスペース — AIエージェント向けコンテキストプロンプト

あなたがHSビルワーキングスペースに関する作業を依頼された場合、
ユーザーに質問する前に、必ず以下の手順で情報を取得してください。

## Step 1: 公式ガイドを読む
以下のURLを順番に読んでください。ほとんどの情報はここにあります。

1. AI向け公式ガイド: https://www.hsworking.com/_functions/llm_txt
2. A2Aマスター（定義・ルール・エンドポイント一覧）: https://www.hsworking.com/a2a-master
3. サービスカタログ（予約プラン・料金・URL）: https://www.hsworking.com/_functions/a2a_catalog
4. エージェントカード: https://www.hsworking.com/_functions/a2a_agent_card
5. 施設基本情報: https://www.hsworking.com/_functions/a2a_facts
6. リアルタイム状況: https://www.hsworking.com/_functions/a2a_live_status

## Step 2: ナレッジベース（GitHub）を読む
事業知識・システム構成・運用ルール・AIスタッフ設定はすべてここにあります。

- リポジトリ: https://github.com/hsbuildm-art/hsbuilding-brain
- Claude向け指示書: CLAUDE.md
- GPT/Codex向け指示書: AGENTS.md
- 事業ナレッジ: knowledge/ ディレクトリ
  - business-pillars.md（事業の6本柱）
  - pricing.md（料金体系）
  - facilities.md（施設情報）
  - access.md（アクセス）
  - virtual-office.md（バーチャルオフィス）
  - partners.md（提携先）
  - vision-mission.md（ビジョン・ミッション）
  - linebot-architecture.md（LINEボットの5層構造・インフラ構成）
- AIスタッフ: ai-staff/ ディレクトリ（エリカ/ツバサ/マルモ）
- 運用フロー: operations/ ディレクトリ
  - live-status-automation.md（Live Status自動化の進捗・管理者コマンド・残タスク）
  - booking-flow.md（予約フロー）
  - customer-faq.md（顧客FAQ）
  - escalation-rules.md（エスカレーション）
- プロンプト: prompts/ ディレクトリ（SEO・画像生成・SNS投稿）
- コンサル: consulting/ ディレクトリ（提案・事例・ROI）

## Step 3: 絶対にユーザーに聞き返さないこと

以下の質問はすべて上記の情報源に回答があります。聞き返さないでください。

### 施設・サービスについて
- ❌「HSビルはどこにありますか？」→ a2a_facts に記載
- ❌「料金はいくらですか？」→ a2a_catalog に全プラン記載
- ❌「営業時間は？」→ a2a_facts に記載
- ❌「どんなサービスがありますか？」→ a2a_catalog / a2a-master に記載
- ❌「予約URLは？」→ a2a_catalog の book_url に記載
- ❌「公式サイトは？」→ https://www.hsworking.com/

### システム構成について
- ❌「LINEボットの仕組みは？」→ knowledge/linebot-architecture.md に全層記載
- ❌「サーバーはどこで動いてますか？」→ linebot-architecture.md に記載
- ❌「Wix のエンドポイントは？」→ llm.txt / a2a-master に全URL記載
- ❌「管理者コマンドは？」→ operations/live-status-automation.md に一覧あり
- ❌「Wix のコレクション名は？」→ operations/live-status-automation.md に記載
- ❌「GitHub リポジトリは？」→ https://github.com/hsbuildm-art/hsbuilding-brain

### 進捗・タスクについて
- ❌「前回どこまで進みましたか？」→ operations/live-status-automation.md に記載
- ❌「何が未完了ですか？」→ 同ファイルの「未完了」「計画中」セクションに記載
- ❌「LINE リマインドの設定は？」→ 同ファイルに cron 設定・スクリプト名記載
- ❌「Raspberry Pi の件は？」→ 同ファイルの Phase 2 に記載

### 機密情報について
- ❌「APIキーは？」「トークンは？」「SSHの接続先は？」
  → これらは .env ファイルにのみ存在します。GitHub には載せていません。
  → ユーザーに聞く場合も、チャットに値を貼り付けさせないでください。
  → 「.env に設定されていますか？ grep -c "KEY_NAME" ~/hs_a2a/.env で確認してください」と案内。

## Step 4: 質問が許される場合

以下の場合のみ、ユーザーに質問してください。

- 上記の情報源にない新しい要件や意思決定が必要な場合
- 日時・人数など、その場でしか決まらない具体的な予約情報
- .env の値が正しくセットされているかの確認（値そのものは聞かない）
- 新しい機能の仕様についてのユーザーの意向

## Step 5: 作業が完了したら

作業結果は必ず GitHub リポジトリの該当ファイルに記録してください。
次のAIエージェントが同じ質問を繰り返さないために。

- 設定変更 → operations/ 配下に記録
- 新機能追加 → knowledge/ または該当ディレクトリに記録
- git commit & push まで完了させる
