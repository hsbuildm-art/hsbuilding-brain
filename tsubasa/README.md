# 蒼真ツバサ - SEO/AIO診断Bot

URLを送ると自動でSEO/AIO診断レポートを返すLINE Bot。
11項目100点満点のルールベース診断 + レーダーチャート画像 + JAN 4Bによるツバサ口調総評。

## アーキテクチャ
LINE > ngrok > マルモ(8000) /tsubasa/webhook > ツバサ(8001)

## ファイル構成
- app.py - FastAPI本体
- diagnosis.py - 診断エンジン（11項目ルールベース）
- chart.py - レーダーチャート画像生成
- jan_client.py - JAN 4Bツバサ口調コメント生成
- term_filter.py - 古い用語の自動置換フィルター
- start.sh - LaunchAgent用起動スクリプト

## 診断項目（100点満点）
title(10) description(10) OGP(5) JSON-LD(15) llm.txt(20) robots.txt(5) sitemap(5) heading(10) viewport(5) HTTPS(5) freshness(10)

## 起動
launchctl load ~/Library/LaunchAgents/com.hsbuilding.tsubasa.plist
