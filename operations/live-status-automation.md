# Live Status 自動化計画

最終更新: 2026-02-18

## 現状（Phase 1：手動 LINE リマインド）
- iMac の cron ジョブから1日2回（13:00 / 18:00）LINE Push で管理者に通知
- 管理者（yuki）が LINE で返信 → Live Status 更新
- スクリプト: ~/hs_a2a/remind_status.py
- cron 登録済み

## 計画中（Phase 2：Wi-Fi デバイス数による完全自動化）
- **ステータス: 機材未購入 → 保留中**
- 方式: Raspberry Pi Zero 2 W をコワーキングエリア（2階）に設置
- 目的: コワーキング Wi-Fi の接続デバイス数を自動カウント → Live Status 自動更新
- 背景: 事務所（1階）= ソフトバンクAir、コワーキング（2階）= NTT光10ギガで完全別回線
- 必要機材:
  - Raspberry Pi Zero 2 W（約¥3,000）
  - microSD カード（約¥1,000）
  - USB電源（手持ち流用可）
- 代替案: USB Wi-Fi アダプタを iMac に追加（約¥2,000）→ 電波距離が不安定リスクあり
- 設計詳細: 15分ごとに ARP スキャン → デバイス数 ÷ 1.8 ≒ 人数推定 → Wix API に POST
- 参考スクリプト: ~/hs_a2a/auto_occupancy.py（Phase 2 移行時に作成）

## 管理者 LINE コマンド一覧

### 確認済みコマンド
| コマンド | 意味 | 更新フィールド |
|---------|------|---------------|
| hs:3人  | 利用者3人 | coworking.live.occupancy → 3 |
| hs:0人  | 利用者なし | coworking.live.occupancy → 0 |
| hs:14人 | 満席 | coworking.live.occupancy → 14 |

### 未確認コマンド（要 line_bot_server.py ソース確認）
| コマンド候補 | 意味 | 更新フィールド |
|-------------|------|---------------|
| hs:混雑 / hs:静か | 混雑レベル | facility.crowd_level |
| hs:騒音:にぎやか | 騒音レベル | facility.noise_level |
| hs:回線:500/300 | ネット速度 | network.down_mbps / up_mbps |
| hs:貸切:14:00-17:00 | 貸切ブロック | coworking.blocks[] |
| hs:イベント:... | イベント登録 | community_events[] |

### 確認方法
ssh miyakeyuki@100.123.135.48
grep -B5 -A30 "管理者\|admin\|hs:" ~/hs_a2a/line_bot_server.py

## TODO
- [ ] line_bot_server.py の管理者コマンド部分を確認し、上記表を正確に更新
- [ ] Raspberry Pi 購入（Amazon or 秋月電子）
- [ ] Raspberry Pi セットアップ + Tailscale + auto_occupancy.py 設置
- [ ] check_stale.py 導入（stale 検知 → 自動催促）
