# Live Status 自動化

最終更新: 2026-02-18

## 完了済み（Phase 1）

### LINE リマインド自動通知
- スクリプト: iMac ~/hs_a2a/remind_status.py
- cron: 毎日 13:00 / 18:00 の2回
- 動作: 現在の Live Status を取得 → 管理者 LINE にプッシュ → 返信で更新
- ADMIN_LINE_USER_ID: .env に設定済み

### parse_status_command 拡張（2026-02-18）
- Wi-Fi速度更新コマンドを追加実装
- ヘルプメッセージを更新
- バックアップ: line_bot_server.py.bak.{timestamp}

### 管理者 LINE コマンド一覧（確定・動作確認済）
| コマンド | 動作 | Wixコレクション |
|---------|------|----------------|
| hs:3人 | 人数更新（混雑自動推定） | Ops_CoworkingLive |
| hs:5人 混雑 | 人数＋混雑手動指定 | Ops_CoworkingLive + Ops_FacilityStatus |
| hs:3人 静か | 人数＋騒音 | Ops_CoworkingLive + Ops_FacilityStatus |
| hs:混雑 / hs:ガラガラ / hs:閉店 | 混雑レベル単独 | Ops_FacilityStatus |
| hs:静か / hs:にぎやか | 騒音レベル単独 | Ops_FacilityStatus |
| hs:回線:500/300 | Wi-Fi速度（↓500/↑300） | Ops_NetworkStatus |
| hs: | ヘルプ表示 | — |

### Wix 側 allowed コレクション（確認済）
- Ops_CoworkingLive（人数）
- Ops_FacilityStatus（混雑・騒音）
- Ops_NetworkStatus（Wi-Fi速度）
- エンドポイント: https://www.hsworking.com/_functions/a2a_live_status_update

## 未完了（Phase 1.5 — Wix側拡張が必要）

### 貸切ブロック・イベント・お知らせコマンド
- ステータス: Wix側の a2a_live_status_update が未対応
- 必要作業:
  1. Wix CMS にコレクション存在確認（Ops_Blocks / Ops_Events / Ops_Notices 等）
  2. http-functions.js の allowed 配列に追加
  3. 各コレクションへの書込み処理を追加
  4. line_bot_server.py に parse_status_command 追加
- LINE側コマンド案（実装予定）:
  - hs:貸切:14:00-17:00 / hs:貸切:なし
  - hs:イベント:2/28 14:00 AIセミナー https://...
  - hs:お知らせ:本日15時清掃のため一時閉鎖

## 計画中（Phase 2 — 機材未購入）

### Raspberry Pi による完全自動化
- ステータス: 機材未購入 → 保留中
- 方式: Raspberry Pi Zero 2 W をコワーキングエリア（2階）に設置
- 背景: 事務所（1階）とコワーキング（2階）は完全別回線
- 必要機材: Raspberry Pi Zero 2 W（¥3,000）+ microSD（¥1,000）+ USB電源
- 代替案: USB Wi-Fiアダプタ（¥2,000）→ 電波距離リスクあり
- 推奨: Raspberry Pi（2階直置き、iMac非依存、完全放置可能）

## iMac サーバー情報
- IP / SSH接続先: .env ファイルおよび Tailscale 管理画面を参照
- uvicorn: port 8000
- ngrok固定ドメイン: nettie-mannerless-delilah.ngrok-free.dev
- JAN LLM: port 1337
- LaunchAgent: com.hsbuilding.linebot.plist / com.hsbuilding.jan.plist
- run_hsbot_ngrok.sh のヘルスチェックが早すぎて誤停止する既知問題あり
  → 手動起動時は uvicorn / ngrok / caffeinate を個別に起動すると安定

## 500エラー（未調査）
- LINE ボットの一部リクエストで 500 Internal Server Error が発生
- 次回調査予定
