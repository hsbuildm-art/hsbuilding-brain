# LINEボット アーキテクチャ 追記 (2026-02-18 夜)

## Layer 1A 追加: 予約リンク即返しモード

### 概要
booking_link_helper.py を追加。ユーザーが施設+日付+時刻を含むメッセージを送ると
Wix a2a_booking_link API を1回呼ぶだけで日時プリセレクト済み予約URL+クーポン付きメッセージを即返し。

### ファイル
- ~/hs_a2a/booking_link_helper.py (新規)

### 処理フロー
ユーザー発話
  → Layer 0: faq_matcher（218パターン）※日時+施設が揃った発話はスキップ
  → Layer 1A: booking_link_helper.detect_booking_link_intent()
    → 施設+日付+時刻を抽出
    → call_booking_link_sync() で Wix API 呼び出し
    → line_message をそのまま返信
  → Layer 1B: prepare_layer1_booking（既存フォールバック）
  → Layer 2 → Layer 3 → Layer 4

### 削除した機能
- 名前・メール収集フロー（booking_state 系関数）
- execute_booking 関数
- 理由: Wix 予約フォーム上で全て入力するため不要

### 対応施設キーワード
- 個室/ブース/テレワーク → workbooth
- 会議室/ミーティング/打ち合わせ → meeting_room
- スタジオ/音楽/ピアノ → music_studio
- コワーキング/自習/フリーデスク → coworking

### 対応日付キーワード
- 今日/本日/明日/明後日/あさって
- MM/DD, MM月DD日, YYYY-MM-DD

### Wix API エンドポイント
- GET https://www.hsworking.com/_functions/a2a_booking_link
  - service_key: workbooth, meeting_room 等（service_wix_id 不要）
  - date: YYYY-MM-DD
  - start_time: HH:mm
