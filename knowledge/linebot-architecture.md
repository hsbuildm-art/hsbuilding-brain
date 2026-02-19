# LINEボット アーキテクチャ仕様書

最終更新: 2026-02-18

## 全体構成

LINEユーザー → LINE Platform → Cloudflareトンネル → iMac port 8000 → FastAPI

処理レイヤー:
- Layer 0: faq_matcher.py + faq_patterns.json（218パターン）即答【コスト$0】
- Layer 1: 予約フロー（Wix A2A API空き確認→仮予約→決済URL）
- Layer 2: hs_reply_state.py + offers.csv（プラン候補提示）
- Layer 3: フォールバック「スタッフに引き継ぎ」→ 将来JAN接続予定

## 処理優先順位（callback関数内）

1. 管理者コマンド（hs:3人 等）→ Wix Live Status更新
2. Layer 0: パターンマッチ（予約意図・番号入力は除外）
3. 予約フロー状態チェック（名前/メール入力待ち）
4. 予約意図検出 → Wix A2A API
5. Layer 2: hs_reply_state.py
6. Layer 3: フォールバック

## iMac ファイル構成 (~/hs_a2a/)

- line_bot_server.py: メイン制御（FastAPI/LINE Webhook）
- faq_matcher.py: パターンマッチエンジン（Layer 0）
- faq_patterns.json: 218パターンの質問・回答データ
- hs_reply_state.py: 予約ステートマシン（Layer 2）
- offers.csv: 全プラン情報（施設×時間×価格×予約URL）
- .env: LINE API / Wix API キー
- run_hsbot.sh: 起動スクリプト（uvicorn + cloudflared + caffeinate）
- agent_card.json: A2Aエージェントカード
- a2a_facts.json: 施設基本情報
- llm.txt: AI向け施設情報

## iMac スペック

- CPU: Intel i5-8500 6コア 3.0GHz
- RAM: 32GB
- GPU: Radeon Pro 570X 4GB（LLM推論不可、CPU推論のみ）
- ストレージ: 798GB空き
- macOS: Sequoia 15.7.3
- Python: 3.9（.venv）

## パターンマッチ カテゴリ（218パターン）

- 料金: 30件（各施設×各時間）
- 設備: 25件（Wi-Fi・電源・モニター・防音等）
- アクセス: 15件（場所・駅・駐車場）
- 営業時間: 10件（営業時間・定休日・ルール）
- バーチャルオフィス: 6件（法人登記・住所利用）
- AI事業: 15件（AIコーチング・ヘルプデスク）
- 決済: 13件（PayPay・クレカ・領収書）
- 初めての方: 16件（見学・比較・外国人対応）
- 月額プラン: 12件（サブスク・パック）
- 挨拶その他: 24件（挨拶・SNS・提携等）

## Wix A2A API

- カタログ: https://www.hsworking.com/_functions/a2a_catalog
- 空き確認: https://www.hsworking.com/_functions/a2a_availability
- 仮予約: https://www.hsworking.com/_functions/a2a_book
- Live Status: https://www.hsworking.com/_functions/a2a_live_status_update

## 起動コマンド

cd ~/hs_a2a
.venv/bin/python -m uvicorn line_bot_server:app --host 0.0.0.0 --port 8000 &
cloudflared tunnel --url http://localhost:8000 &

## コスト

- Layer 0-2: 完全無料
- Layer 3（将来JAN）: 電気代のみ
- 将来Claude API移行時: 従量課金

## 更新履歴（2026-02-18）

### Phase A完了
- faq_patterns.json: 218パターン
- faq_matcher.py: スコアリング型パターンマッチエンジン
- line_bot_server.pyに Layer 0 として統合済み

### Phase B完了
- ngrok固定ドメイン: nettie-mannerless-delilah.ngrok-free.dev
- LINE Webhook URL: https://nettie-mannerless-delilah.ngrok-free.dev/callback
- run_hsbot_ngrok.sh: uvicorn + ngrok + caffeinate 一括起動
- LaunchAgent登録済み: com.hsbuilding.linebot.plist（iMac再起動時自動起動）
- Cloudflareトンネルは廃止 → ngrokに完全移行

### Phase C（次回予定）
- JAN復活 → ローカルLLMで外部脳参照
- パターンにヒットしない質問への自然言語応答

## 全Phase完了（2026-02-18）
### 最終構成
- Layer 0: faq_matcher.py（218パターン）→ 即答 $0 ✅
- Layer 1: 予約フロー（Wix A2A API）→ 即答 $0 ✅
- Layer 2: hs_reply_state.py（offers.csv）→ 即答 $0 ✅
- Layer 3: jan_client.py（JAN 4Bモデル CPU推論）→ 7〜22秒 電気代のみ ✅
- Layer 4: フォールバック「スタッフに引き継ぎ」 ✅
### インフラ
- ngrok固定URL: https://nettie-mannerless-delilah.ngrok-free.dev
- LINE Webhook: https://nettie-mannerless-delilah.ngrok-free.dev/callback
- LaunchAgent: com.hsbuilding.linebot.plist（iMac再起動で自動復帰）
- run_hsbot_ngrok.sh: uvicorn + ngrok + caffeinate 一括管理
### 月額コスト: ¥0（電気代除く）
### 今後の拡張候補
- パターン追加（218→500）で Layer 3 呼び出し頻度をさらに削減
- JAN起動の自動化（LaunchAgentまたはrun_hsbot_ngrok.shに組込）
- 資金確保後 Claude API 移行（Layer 3 置換）
- VPS/クラウド移行（iMac依存脱却）

## 最終確認完了（2026-02-18）
### リモートアクセス
- Tailscale導入: iMac(100.123.135.48) / MacBook Air(100.87.13.36)
- SSH接続: ssh miyakeyuki@100.123.135.48
- アカウント: hsbuild.m@gmail.com
### 動作確認済み機能
- HS予約コマンド（コワーキング/会議室/個室ブース）✅
- パターンマッチ応答（218パターン）✅
- JAN LLM フォールバック応答 ✅
- ngrok固定URL + 自動起動 ✅
- Tailscale SSH リモート管理 ✅
### 今後の拡張ロードマップ
1. パターン追加（218→500）
2. JAN自動起動のLaunchAgent化
3. Claude API移行（資金確保後）
4. VPS/クラウド移行（iMac依存脱却）

## JAN自動起動完了（2026-02-18）
### LaunchAgents一覧（iMac再起動で全て自動復帰確認済み）
- com.hsbuilding.linebot.plist → uvicorn + ngrok + caffeinate
- com.hsbuilding.jan.plist → llama-server（ポート1337、4Bモデル）
### iMac起動後の自動プロセス
1. llama-server（JAN LLM）→ ポート1337
2. uvicorn（LINEボット）→ ポート8000
3. ngrok（固定ドメイン）→ nettie-mannerless-delilah.ngrok-free.dev
4. caffeinate（スリープ防止）
### リモート管理
- Tailscale SSH: ssh miyakeyuki@100.123.135.48
- ログ確認: tail -f ~/hs_a2a/logs/uvicorn.log
- JAN確認: curl -s http://127.0.0.1:1337/v1/models -H "Authorization: Bearer jan-local"

## GAS統合ステータス通知 移行完了（2026-02-19）

### 変更概要
- iMac cron（remind_status.py 1日2回 13:00/18:00）→ **廃止**
- GAS（Google Apps Script 1日1回 11:00）→ **稼働開始**
- 月間LINE Push通数: 60通 → **30通に半減**

### 廃止した仕組み
- iMac crontab 2行をコメントアウト済み
#0 13 * * * cd ~/hs_a2a && .venv/bin/python remind_status.py >> logs/remind.log 2>&1 #0 18 * * * cd ~/hs_a2a && .venv/bin/python remind_status.py >> logs/remind.log 2>&1

- remind_status.py 自体は ~/hs_a2a/ に残存（ロールバック可能）

### 新しい仕組み（GAS）
- GASプロジェクト名: HS会員管理
- スプレッドシート: HS_会員管理
- ID: 1WU77-jS_RcYtpZsUqILejcidlvFCrc5KkSKh61_AQR4
- シート「入金管理」: 会員名/プラン/月額/支払方法/次回支払日/入金済み/メール
- GASトリガー: morningStatus() → 毎日11:00（時間ベース）
- 通知内容:
1. 室内状況（a2a_live_status から取得）
2. 入金リマインド（スプレッドシートから取得）
- LINE認証: .env と同じ LINE_CHANNEL_ACCESS_TOKEN / ADMIN_LINE_USER_ID を使用

### 役割分担（確定）
| 担当 | 役割 | Push通数 |
|------|------|----------|
| GAS | 毎朝11:00 定型ステータス通知（室内データ＋入金リマインド） | 月30通 |
| iMac | ユーザーからの会話応答（予約・FAQ・LLM）※Reply | 月0通 |
| iMac | 管理者コマンド応答（hs:○人 等）※Reply | 月0通 |

### iMacの現在の役割（2026-02-19時点）
- 定期プッシュ通知: **担当しない**（GASに移管済み）
- LINEボット会話応答: 担当（Layer 0〜4）
- JAN LLMフォールバック: 担当（Layer 3）
- iMac停止時の影響: 会話応答のみ停止、朝の通知はGASが独立して送信

### コスト変更
- GAS: ¥0（Google無料枠内）
- LINE Push: 月30通（無料枠200通の15%消費）
- 残り枠: 170通（会員向け通知に利用可能）

### 今後の拡張予定
- 本日の予約情報を朝の通知に追加（Wix todayBookings HTTP Function追加後）
- 会員向け郵便物通知（Push枠から消費、運用フロー確定後）
- 請求書自動生成・メール送付（GAS + Google Docs テンプレート）

## Googleカレンダー予約通知 追加完了（2026-02-19）

### 変更概要
- GAS morningStatus() にGoogleカレンダー連携を追加
- 毎朝11:00の統合通知に「本日の予約一覧」を含める機能を実装・稼働確認済み

### 技術詳細
- カレンダー: hsbuild.m@gmail.com のデフォルトカレンダー（サブカレンダー同期済み）
- 取得方法: CalendarApp.getDefaultCalendar().getEvents() で当日0:00〜23:59のイベントを取得
- Wix Bookings API は不使用（全予約がGoogleカレンダーに集約される運用のため）
- 予約ソース: Wix Bookings / スペースマーケット / インスタベース 等 → 全てGoogleカレンダーに転記する運用

### 朝の統合通知メッセージ構成（確定版）
1. 【🏢 室内状況】← Wix a2a_live_status
2. 【📅 本日の予約】← Googleカレンダー ★NEW
3. 【💰 入金リマインド】← スプレッドシート「入金管理」

### GASプロジェクト構成（確定版）
- プロジェクト名: HS会員管理
- スプレッドシートID: 1WU77-jS_RcYtpZsUqILejcidlvFCrc5KkSKh61_AQR4
- 関数一覧:
  - morningStatus(): メイン（毎朝11:00トリガー）
  - getLiveStatus(): Wix a2a_live_status 取得
  - getTodayBookings(): Googleカレンダー当日予約取得
  - getPaymentAlerts(): スプレッドシート入金チェック
  - sendToLINE(): LINE Messaging API Push送信
- トリガー: morningStatus → 毎日11:00（時間ベース）
- LINE認証: iMac .env と同じ LINE_CHANNEL_ACCESS_TOKEN / ADMIN_LINE_USER_ID

### 月間コスト変更なし
- GAS + Googleカレンダー: ¥0
- LINE Push: 月30通（変更なし）
