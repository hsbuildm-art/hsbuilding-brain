# LINEボット アーキテクチャ仕様書

最終更新: 2026-02-20

## 全体構成

LINEユーザー → LINE Platform → ngrok固定URL → iMac
  /callback        → マルモ (FastAPI, port 8000)
  /erika/callback  → マルモがプロキシ → エリカ (Flask, port 58568)

ngrok固定ドメイン: nettie-mannerless-delilah.ngrok-free.dev

## マルモくん（施設案内・予約）

### ディレクトリ
~/hs_a2a/

### 処理レイヤー
- Layer 0: faq_matcher.py + faq_patterns.json（221パターン）即答 コスト$0
- Layer 1: 予約フロー（Wix A2A API空き確認 → 仮予約 → 決済URL）
  - Layer 1A: booking_link_helper.py（a2a_booking_link エンドポイント）
  - チケット型（コワーキング）: API呼び出し不要、直接購入URL返却
  - 予約型（個室ブース・会議室・音楽スタジオ）: Wix API経由
- Layer 2: hs_reply_state.py + offers.csv（プラン候補提示）
- Layer 3: jan_client.py（JAN 4Bモデル CPU推論）7-22秒 電気代のみ
- Layer 4: フォールバック「スタッフに引き継ぎ」

### 主要ファイル
- line_bot_server.py: メイン制御（FastAPI/LINE Webhook + エリカプロキシ）
- faq_matcher.py: パターンマッチエンジン（Layer 0）
- faq_patterns.json: 221パターンの質問・回答データ（v2026-02-20）
- booking_link_helper.py: 予約リンク生成（チケット型/予約型分岐対応）
- hs_reply_state.py: 予約ステートマシン（Layer 2）
- offers.csv: 全プラン情報
- .env: LINE API / Wix API キー

### パターンマッチ カテゴリ（221パターン）
- 料金: 30件
- 設備: 25件
- アクセス: 15件
- 営業時間: 10件
- バーチャルオフィス: 6件
- AI事業: 15件
- 決済: 13件
- 初めての方: 16件
- 月額プラン: 12件
- 施設案内（複合パターン）: 3件（2026-02-20追加）
- 挨拶その他: 24件

### 2026-02-20 修正履歴
- チケット型分岐: コワーキング共有席を空き確認なしで直接チケットURL返却
- OFFER_WIX_MAP: Catalog JSONと全11件ID同期完了
- キーワード追加: 共有席/フリーデスク/オープン席/作業/ドロップイン/面接/セミナー/研修/集中/読書
- 複合パターン3件追加: コワーキング×Web会議/Zoom/通話（NG案内+個室誘導）
- 飛び込み回答3件統一: チケット制・予約不要を明記
- answer_payment()更新: 施設タイプ別の決済方法を正確に記載
- DURATION_ROUNDUP: 中間時間の繰り上げロジック（2h→3hチケット等）
- unhandled.jsonl: 未対応メッセージの自動ログ記録機能追加
- デッドコード修正: prepare_layer1_booking後のエラーハンドリング正常化

### LINE公式アカウント
- ID: @090mrhbt
- URL: https://page.line.me/090mrhbt
- Webhook: https://nettie-mannerless-delilah.ngrok-free.dev/callback

## 朝比奈エリカ（AI相談窓口）2026-02-20追記

### ディレクトリ
~/erika-line-bot/

### アーキテクチャ
- フレームワーク: Flask
- ポート: 58568
- LLM: JAN 4B（マルモと同じインスタンス localhost:1337）
- ナレッジ: RAG（ChromaDB + HuggingFace Embeddings）
- Embeddings: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2

### 処理フロー
1. LINE Webhook受信（/erika/callback → マルモがプロキシ → port 58568）
2. 即レス「エリカが確認しています...少々お待ちくださいね」（reply）
3. 裏スレッドでRAG検索 → JAN LLM推論 → push送信

### ナレッジファイル（~/erika-line-bot/knowledge/）
- hsbuilding.txt: 施設基本情報
- pricing.txt: 料金プラン
- ai_support.txt: AI導入支援3サービス
- erika_faq.txt: よくある質問と回答例
- contact.txt: お問い合わせ導線

### LINE公式アカウント
- Webhook: https://nettie-mannerless-delilah.ngrok-free.dev/erika/callback
- GitHub: https://github.com/hsbuildm-art/erika-line-bot

### ログ
- 日別ログ: ~/erika-line-bot/chat_logs/YYYY-MM-DD.jsonl
- 質問蓄積: ~/erika-line-bot/chat_logs/all_questions.txt

## 共通インフラ

### iMac スペック
- CPU: Intel i5-8500 6コア 3.0GHz / RAM: 32GB / macOS: Sequoia 15.7.3

### LaunchAgents（iMac再起動で全て自動復帰）
- com.hsbuilding.linebot.plist → uvicorn + ngrok + caffeinate（マルモ）
- com.hsbuilding.jan.plist → llama-server（JAN LLM ポート1337）
- com.hsbuilding.erika.plist → Flask app.py（エリカ ポート58568）

### リモートアクセス
- Tailscale: ssh miyakeyuki@100.123.135.48

### GAS統合（morningStatus）
- トリガー: 毎日11:00
- 通知内容: 室内状況 + 本日の予約 + 入金リマインド
- スプレッドシートID: 1WU77-jS_RcYtpZsUqILejcidlvFCrc5KkSKh61_AQR4

### 月額コスト
¥0（電気代除く）
