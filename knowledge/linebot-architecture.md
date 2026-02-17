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
