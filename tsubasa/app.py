import os
import hmac
import hashlib
import base64
import threading
import uuid
import time
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, FileResponse
import httpx
from diagnosis import run_diagnosis
from chart import generate_radar_chart
from jan_client import generate_tsubasa_comment

load_dotenv()

CHANNEL_ID = os.getenv("TSUBASA_CHANNEL_ID")
CHANNEL_SECRET = os.getenv("TSUBASA_CHANNEL_SECRET")
CHANNEL_ACCESS_TOKEN = os.getenv("TSUBASA_CHANNEL_ACCESS_TOKEN")
CHART_DIR = os.path.join(os.path.dirname(__file__), "charts")
BASE_URL = "https://nettie-mannerless-delilah.ngrok-free.dev/tsubasa"

app = FastAPI(title="Tsubasa SEO/AIO Diagnosis Bot")

# 二重実行防止: user_id -> timestamp
active_diagnoses = {}
DIAGNOSIS_COOLDOWN = 60  # 秒

def verify_signature(body: bytes, signature: str) -> bool:
    hash_ = hmac.new(
        CHANNEL_SECRET.encode("utf-8"),
        body,
        hashlib.sha256
    ).digest()
    return hmac.compare_digest(base64.b64encode(hash_).decode("utf-8"), signature)

def push_messages(user_id: str, messages: list):
    url = "https://api.line.me/v2/bot/message/push"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {CHANNEL_ACCESS_TOKEN}"
    }
    payload = {
        "to": user_id,
        "messages": messages
    }
    import requests
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=10)
        return resp.status_code
    except Exception:
        return 500

def format_diagnosis_report(result: dict, tsubasa_comment: str) -> str:
    if "error" in result:
        return f"診断エラー: {result['error']}"

    score = result["total_score"]
    rank = result["rank"]
    url = result["url"]
    rank_emoji = {"A": "🔵", "B": "🟢", "C": "🟡", "D": "🟠", "E": "🔴"}.get(rank, "⚪")

    lines = [
        f"━━━━━━━━━━━━━━━",
        f"🔍 SEO/AIO診断レポート",
        f"━━━━━━━━━━━━━━━",
        f"",
        f"URL: {url}",
        f"総合スコア: {score}/100点",
        f"ランク: {rank_emoji} {rank}ランク",
        f"",
        f"━━ 診断結果 ━━",
    ]

    label_map = {
        "title": "🔎 検索の第一印象",
        "description": "📄 検索の説明力",
        "ogp": "📣 SNS拡散力",
        "jsonld": "🧠 AI理解度",
        "llm_txt": "🤖 AI案内力",
        "robots": "🚪 クローラー受入体制",
        "sitemap": "🗂 全ページの発見率",
        "heading": "📑 情報の整理度",
        "viewport": "📱 スマホ対応",
        "https": "🔒 通信の安全性",
        "freshness": "📅 サイト鮮度",
    }

    for key, label in label_map.items():
        s = result["scores"].get(key, 0)
        d = result["details"].get(key, "")
        mark = "✅" if s > 0 else "❌"
        lines.append(f"{mark} {label}")
        lines.append(f"   {d}")

    if tsubasa_comment:
        lines.append("")
        lines.append("━━ ツバサの総評 ━━")
        lines.append(tsubasa_comment)

    lines.append("")
    lines.append("━━━━━━━━━━━━━━━")
    lines.append("💡 改善で集客を最大化しませんか？")
    lines.append("")
    lines.append("▶ SEO/AIOパッケージ")
    lines.append("  Plan A: 298,000円〜")
    lines.append("  Plan B: 698,000円〜")
    lines.append("")
    lines.append("詳細はこちら👇")
    lines.append("https://hsworking.com/ai-solution")
    lines.append("━━━━━━━━━━━━━━━")

    return "\n".join(lines)

def run_diagnosis_async(user_id: str, target_url: str):
    try:
        result = run_diagnosis(target_url)

        tsubasa_comment = ""
        if "error" not in result:
            tsubasa_comment = generate_tsubasa_comment(result)

        messages = []

        if "error" not in result:
            chart_id = str(uuid.uuid4())[:8]
            chart_path = os.path.join(CHART_DIR, f"{chart_id}.png")
            generate_radar_chart(
                result["scores"], result["url"],
                result["total_score"], result["rank"],
                chart_path
            )
            chart_url = f"{BASE_URL}/charts/{chart_id}.png"
            messages.append({
                "type": "image",
                "originalContentUrl": chart_url,
                "previewImageUrl": chart_url,
            })

        report = format_diagnosis_report(result, tsubasa_comment)
        messages.append({"type": "text", "text": report})

        push_messages(user_id, messages)
    except Exception as e:
        push_messages(user_id, [{"type": "text", "text": f"診断中にエラーが発生しました。しばらくしてから再度お試しください。"}])
    finally:
        active_diagnoses.pop(user_id, None)

def is_valid_url(text: str) -> bool:
    if not (text.startswith("http://") or text.startswith("https://")):
        return False
    if " " in text or len(text) > 2000:
        return False
    if "." not in text:
        return False
    return True

async def reply_message(reply_token: str, text: str):
    url = "https://api.line.me/v2/bot/message/reply"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {CHANNEL_ACCESS_TOKEN}"
    }
    payload = {
        "replyToken": reply_token,
        "messages": [{"type": "text", "text": text}]
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload, headers=headers)
        return resp.status_code

@app.post("/webhook")
async def webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("x-line-signature", "")
    if not verify_signature(body, signature):
        raise HTTPException(status_code=403, detail="Invalid signature")

    data = await request.json()
    events = data.get("events", [])

    for event in events:
        if event["type"] == "follow":
            reply_token = event["replyToken"]
        if event["type"] == "follow":
            reply_token = event["replyToken"]
            greeting = "蒼真ツバサだ。友だち追加ありがとう。" + chr(10) + chr(10) + "あなたのWebサイト、AIに正しく認識されているか？" + chr(10) + "検索エンジンだけでなく、ChatGPTやGeminiにも見つけてもらえる設計になっているか？" + chr(10) + chr(10) + "URLを送れ。30秒で答えを出す。" + chr(10) + chr(10) + "例: https://example.com"
            await reply_message(reply_token, greeting)
            continue


        if event["type"] == "message" and event["message"]["type"] == "text":
            user_text = event["message"]["text"].strip()
            reply_token = event["replyToken"]
            user_id = event["source"]["userId"]

            if is_valid_url(user_text):
                # 二重実行防止
                now = time.time()
                last_run = active_diagnoses.get(user_id, 0)
                if now - last_run < DIAGNOSIS_COOLDOWN:
                    remaining = int(DIAGNOSIS_COOLDOWN - (now - last_run))
                    await reply_message(reply_token, f"前回の診断がまだ処理中です。あと{remaining}秒ほどお待ちください。")
                    continue

                active_diagnoses[user_id] = now
                await reply_message(reply_token, "診断中です...🔍\n\n蒼真ツバサがSEO/AIO分析を開始しました。\n30秒〜1分ほどお待ちください。")
                thread = threading.Thread(target=run_diagnosis_async, args=(user_id, user_text))
                thread.daemon = True
                thread.start()
            else:
                await reply_message(reply_token, "蒼真ツバサだ。\n\nSEO/AIO診断を行う。\n診断したいサイトのURLを送ってくれ。\n\n例: https://example.com")

    return JSONResponse(content={"status": "ok"})

@app.get("/charts/{filename}")
async def serve_chart(filename: str):
    path = os.path.join(CHART_DIR, filename)
    if os.path.exists(path):
        return FileResponse(path, media_type="image/png")
    raise HTTPException(status_code=404, detail="Chart not found")

@app.get("/health")
async def health():
    return {"status": "alive", "bot": "tsubasa", "active_diagnoses": len(active_diagnoses)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
