# LINEボット アーキテクチャ仕様書

最終更新: 2026-02-24

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

---

## Phase 1: 週次学習レポート自動化（2026-02-20 実装）

### 概要
マルモとエリカ両方のログを統合分析し、週次でLINE通知するシステム。月額¥0。

### アーキテクチャ
[毎週月曜 9:00] LaunchAgent (com.hsbuilding.weekly-report) → weekly_report.py → マルモ未対応ログ読込 (~/hs_a2a/logs/unhandled.jsonl) → エリカ会話ログ読込 (~/erika-line-bot/chat_logs/*.jsonl) → JAN 4B (localhost:1337) でカテゴリ分類・要約生成 → JSONレポート保存 (~/hs_a2a/logs/reports/weekly_YYYY-MM-DD.json) → LINE通知文保存 (~/hs_a2a/logs/reports/line_msg_YYYY-MM-DD.txt) → send_report.sh → LINE push API で管理者のみに配信（マルモ公式 @090mrhbt 経由）


### ファイル構成
| ファイル | パス | 役割 |
|---|---|---|
| weekly_report.py | ~/hs_a2a/weekly_report.py | ログ集計・JAN分析・レポート生成 |
| send_report.sh | ~/hs_a2a/send_report.sh | LINE push送信（管理者のみ） |
| LaunchAgent | ~/Library/LaunchAgents/com.hsbuilding.weekly-report.plist | 毎週月曜9:00自動実行 |
| レポート出力先 | ~/hs_a2a/logs/reports/ | weekly_*.json + line_msg_*.txt |

### JAN 4B 分析内容
- エリカ: 質問カテゴリ別件数、関心事トップ3、回答品質改善提案
- マルモ: 未対応質問カテゴリ別件数、パターン追加候補（上位3件）、推奨回答案

### 初回レポート結果（2026-02-20）
- マルモ未対応: 0件（221パターンで全カバー）
- エリカ会話: 9件（ユニークユーザー2人）
- エリカ質問分布: AI導入相談4件、料金系3件、施設案内1件、その他2件

### 今後のロードマップ
- Level 2: JAN 4Bで未対応質問からfaq_patterns.json追加候補を自動生成→スプレッドシート承認→反映
- Level 3: 新パターンと既存knowledgeの矛盾検出→LINE通知→修正提案

### LaunchAgent 一覧（iMac 全4件）
| Label | 対象 | スケジュール |
|---|---|---|
| com.hsbuilding.linebot | マルモ (FastAPI port 8000) | 常時起動 |
| com.hsbuilding.jan | JAN 4B (llama-server port 1337) | 常時起動 |
| com.hsbuilding.erika | エリカ (Flask port 58568) | 常時起動 |
| com.hsbuilding.weekly-report | 週次レポート | 毎週月曜 9:00 |

---

## Phase 1: 週次学習レポート自動化（2026-02-20 実装）

### 概要
マルモとエリカ両方のログを統合分析し、週次でLINE通知するシステム。月額¥0。

### アーキテクチャ
[毎週月曜 9:00] LaunchAgent (com.hsbuilding.weekly-report) → weekly_report.py → マルモ未対応ログ読込 (~/hs_a2a/logs/unhandled.jsonl) → エリカ会話ログ読込 (~/erika-line-bot/chat_logs/*.jsonl) → JAN 4B (localhost:1337) でカテゴリ分類・要約生成 → JSONレポート保存 (~/hs_a2a/logs/reports/weekly_YYYY-MM-DD.json) → LINE通知文保存 (~/hs_a2a/logs/reports/line_msg_YYYY-MM-DD.txt) → send_report.sh → LINE push API で管理者のみに配信（マルモ公式 @090mrhbt 経由）


### ファイル構成
| ファイル | パス | 役割 |
|---|---|---|
| weekly_report.py | ~/hs_a2a/weekly_report.py | ログ集計・JAN分析・レポート生成 |
| send_report.sh | ~/hs_a2a/send_report.sh | LINE push送信（管理者のみ） |
| LaunchAgent | ~/Library/LaunchAgents/com.hsbuilding.weekly-report.plist | 毎週月曜9:00自動実行 |
| レポート出力先 | ~/hs_a2a/logs/reports/ | weekly_*.json + line_msg_*.txt |

### JAN 4B 分析内容
- エリカ: 質問カテゴリ別件数、関心事トップ3、回答品質改善提案
- マルモ: 未対応質問カテゴリ別件数、パターン追加候補（上位3件）、推奨回答案

### 初回レポート結果（2026-02-20）
- マルモ未対応: 0件（221パターンで全カバー）
- エリカ会話: 9件（ユニークユーザー2人）
- エリカ質問分布: AI導入相談4件、料金系3件、施設案内1件、その他2件

### 今後のロードマップ
- Level 2: JAN 4Bで未対応質問からfaq_patterns.json追加候補を自動生成→スプレッドシート承認→反映
- Level 3: 新パターンと既存knowledgeの矛盾検出→LINE通知→修正提案

### LaunchAgent 一覧（iMac 全4件）
| Label | 対象 | スケジュール |
|---|---|---|
| com.hsbuilding.linebot | マルモ (FastAPI port 8000) | 常時起動 |
| com.hsbuilding.jan | JAN 4B (llama-server port 1337) | 常時起動 |
| com.hsbuilding.erika | エリカ (Flask port 58568) | 常時起動 |
| com.hsbuilding.weekly-report | 週次レポート | 毎週月曜 9:00 |

---

## 2026-02-28 修正・機能追加（Phase 1完了）

### booking_link_helper.py 修正（UTC/JST不整合バグ修正）
- 修正1: JST→UTC変換（API送信時）日付境界対応済み
- 修正2: UTC→JST変換（nearest_availableフィルタ・重複除去）
- 修正3: LINEメッセージ内時刻のJST表示
- 修正4: 予約フォームURL内 bookings_startDate のJST変換

### line_bot_server.py 追加（人間対応モード）
- human_mode_users.json による状態永続化
- 管理コマンド: hs:手動 / hs:自動 / hs:手動一覧 / hs:友だち一覧 / hs:最近
- 管理者へのPush転送 + 顧客への待機メッセージ自動返信

### テスト結果
- 「個室ブース 3/25 18:00」照会 → 正しく空きあり返答
- 人間対応モード切替・復帰 → 正常動作確認済み
## LINE公式アカウント一覧（2026-02-24 更新）

| # | アカウント名 | ID | 役割 | Messaging API |
|---|---|---|---|---|
| 1 | ハッピースクールビル | @090mrhbt | マルモくん：施設案内・予約 | 有効 |
| 2 | エリカのAI相談 | @968rcbue | 朝比奈エリカ：AI相談・AIトレンド配信 | 有効 |
| 3 | AI経営企画室 | （未公開） | ツバサ：経営戦略 | 未確認 |

---

## Phase 2: エリカのウィークリーAIレポート自動配信（2026-02-24 実装）

### 概要
エリカのAI相談（@968rcbue）から毎週月曜8:00にAIトレンドニュースを全友だちにbroadcast配信。
Google News RSS → JAN 4B要約 → LINE broadcast。月額¥0。

### アーキテクチャ
[毎週月曜 8:00] LaunchAgent (com.hsbuilding.ai-trend)
  → start_trend.sh（環境変数読み込み）
    → ai_trend_broadcast.py
      ├─ Google News RSS (feedparser) → AI関連ニュース10件取得
      ├─ JAN 4B (localhost:1337) → エリカ口調で3選に要約（500文字以内）
      ├─ LINE Messaging API broadcast → @968rcbue から全友だちへ送信
      └─ ログ保存 → ~/erika-line-bot/logs/ai_trend/

### 配信アカウント
- 送信元: エリカのAI相談（@968rcbue）
- 送信方法: LINE Messaging API broadcast（全友だち一斉配信）
- トークン: ~/erika-line-bot/start.sh 内の LINE_CHANNEL_ACCESS_TOKEN を start_trend.sh で継承

### ファイル構成
| ファイル | パス | 役割 |
|---|---|---|
| ai_trend_broadcast.py | ~/erika-line-bot/ai_trend_broadcast.py | メイン（RSS取得→JAN要約→broadcast） |
| start_trend.sh | ~/erika-line-bot/start_trend.sh | 環境変数読み込み＋Python実行 |
| LaunchAgent | ~/Library/LaunchAgents/com.hsbuilding.ai-trend.plist | 毎週月曜8:00自動実行 |
| ログ出力 | ~/erika-line-bot/logs/ai_trend/ | weekly_trend_YYYY-MM-DD.json + stdout/stderr.log |

### ニュースソース
- Google News RSS: https://news.google.com/rss/search?q=生成AI+OR+ChatGPT+OR+Gemini+OR+Claude+OR+人工知能&hl=ja&gl=JP&ceid=JP:ja
- 取得件数: 直近10件 → JAN 4Bで3選に絞り込み

### メッセージ構成（2吹き出し）
1. エリカ口調のAIトレンドレポート（500文字以内、ニュース3選）
2. HSビルCTA（空き確認案内、クーポン、AIデジタルライブラリー案内）

### LLM設定
- モデル: janhq/Jan-v3-4b-base-instruct-Q4_K_XL（既存JAN 4Bと同一）
- エンドポイント: http://127.0.0.1:1337/v1/chat/completions
- temperature: 0.7 / max_tokens: 800

### 初回配信結果（2026-02-24）
- vol.1 配信成功（status=200）
- ニュース取得: 10件 → 3選に要約（379文字）
- トピック: Claude Code Security、Gemini音楽生成、Gemini 3.1 Pro SVGアニメ

### 運用コマンド
- 手動配信: bash ~/erika-line-bot/start_trend.sh
- ログ確認: cat ~/erika-line-bot/logs/ai_trend/stdout.log
- エラー確認: cat ~/erika-line-bot/logs/ai_trend/stderr.log

### LaunchAgent 一覧（iMac 全5件 + 1件）
| Label | 対象 | スケジュール |
|---|---|---|
| com.hsbuilding.linebot | マルモ (FastAPI port 8000) @090mrhbt | 常時起動 |
| com.hsbuilding.jan | JAN 4B (llama-server port 1337) | 常時起動 |
| com.hsbuilding.erika | エリカ (Flask port 58568) @968rcbue | 常時起動 |
| com.hsbuilding.weekly-report | 内部ログ分析レポート → yuki宛 | 毎週月曜 9:00 |
| com.hsbuilding.ai-trend | AIトレンド配信 → 全友だち @968rcbue | 毎週月曜 8:00 |
| jp.hsbuilding.bot | （別途） | 待機中 |

### 月額コスト
¥0（Google News RSS無料、JAN 4B既存、LINE broadcast無料枠内）

### 今後のロードマップ
- Level 2: エリカ会話ログの質問傾向を翌週レポートに反映
- Level 3: Google News以外にZenn/Qiita/note RSSを追加して情報源拡充
- Level 4: 過去レポートをRAG knowledgeに蓄積し文脈継続型配信

---

## 2026-03-08 緊急修正：週次レポート broadcast → push

### 問題
send_report.sh が LINE broadcast API を使用していたため、
マルモ(@090mrhbt)の友だち全員に内部レポートが配信されていた。
三宅雅子氏のアカウントで誤配信を確認。数名のブロックも発生。

### 修正内容
- send_report.sh: broadcast → push API に変更
- 送信先: 管理者（U02674d4cb973f9ffe5c81e544c80e1e5）のみ
- エンドポイント: https://api.line.me/v2/bot/message/push
- ペイロードに "to" フィールドを追加

### 影響範囲
- Phase 1（週次内部レポート）のみ修正
- Phase 2（エリカのAIトレンド配信）は broadcast のまま（仕様通り・変更なし）

### テスト結果
- HTTP 200 確認済み（2026-03-08 手動テスト）
- 管理者LINEのみに配信されることを確認

### Git認証設定（2026-03-08）
- iMacのgit認証: `git config --global credential.helper osxkeychain` 設定済み
- PAT（Personal Access Token）: GitHub Settings > Personal access tokens (classic) > 「iMac — repo」（有効期限なし・repo scope）
- 以降 git push 時に認証入力は不要
- トークン再発行が必要な場合: https://github.com/settings/tokens → 「iMac — repo」→ Regenerate token

### PAT有効期限リマインド（2026-03-08 記録）
- 現在のPAT「iMac — repo」有効期限: **2026-04-07**
- 期限切れ後は git push が失敗する
- 再発行手順: https://github.com/settings/tokens → 「iMac — repo」→ Regenerate token → ghp_... をコピー
- ターミナルで更新:
echo "https://hsbuildm-art:ghp_新しいトークン@github.com" > ~/.git-credentials

- 次回更新期限: 2026-04-07 までに再発行すること


---

## Phase 4: DeerFlow 2.0 Super Agent Harness (2026-03-12)

ByteDance製オープンソース(MIT License)のスーパーエージェント基盤をiMac上にDocker環境で導入。
サブエージェントの並列実行、長期記憶、サンドボックス実行環境を備え、AIスタッフ3名の能力を強化する。

- GitHub: https://github.com/bytedance/deer-flow
- 公式サイト: https://deerflow.tech/
- ライセンス: MIT(商用利用可/無料)

### LLMバックエンド

- DeepSeek V3.2 API (OpenAI互換)
- 入力: USD 0.28 / 1Mトークン, 出力: USD 0.42 / 1Mトークン
- HSビルの想定利用量で月額 100-500円
- ローカルLLM (JAN 4B) はフォールバック用として併存

### Docker構成 (port 2026)

- deer-flow-nginx: リバースプロキシ (port 2026)
- deer-flow-frontend: Web UI (port 3000 内部)
- deer-flow-gateway: API Gateway (port 8001 内部)
- deer-flow-langgraph: エージェント実行基盤 (port 2024 内部)

### AIスタッフ統合計画

- マルモくん: FAQ即答+JAN 4B → 複合ニーズの最適提案+パーソナライズ(長期記憶)
- エリカ: RAG応答+定型配信 → リアルタイムリサーチ付き本格AIコンサル
- ツバサ: 11項目スコアリング → 改善コード自動生成+競合比較+アクションプラン

### バーチャルオフィス会員向け拡張

DeerFlowのIMチャネル統合(Slack/Telegram)を活用し、VO会員専用チャンネルでAI経営参謀機能を提供予定。

### 運用コマンド

- cd ~/deer-flow && make docker-start (起動)
- cd ~/deer-flow && make docker-stop (停止)

### LaunchAgent (iMac 常駐プロセス 5+1+DeerFlow)

- com.hsbuilding.linebot: マルモくん (FastAPI port 8000) 常駐
- com.hsbuilding.jan: JAN 4B (llama-server port 1337) 常駐
- com.hsbuilding.erika: エリカ (Flask port 58568) 常駐
- com.hsbuilding.weekly-report: 週次レポート 月曜9:00
- com.hsbuilding.ai-trend: AIトレンド配信 月曜8:00
- Docker deer-flow: DeerFlow 2.0 (port 2026) 手動起動

### 次フェーズ (Phase 5予定)

- ツバサ diagnosis.py → DeerFlowサブエージェント接続
- エリカ 週次配信のDeerFlow researchスキル統合
- マルモくん DeerFlow Embedded Python Client統合
- VO会員向け Slackチャネル提供

更新日: 2026-03-12
