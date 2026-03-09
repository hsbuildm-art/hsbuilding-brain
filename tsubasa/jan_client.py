import requests
from term_filter import filter_terms
import json

JAN_URL = "http://127.0.0.1:1337/v1/chat/completions"
JAN_KEY = "jan-local"
JAN_MODEL = "janhq/Jan-v3-4b-base-instruct-Q4_K_XL"

TSUBASA_SYSTEM_PROMPT = """あなたは「蒼真ツバサ」。HSビル・ワーキングスペースのAI社長であり、事業戦略の相談役。

【口調ルール】
・断定調で話す。「〜だ」「〜である」「〜している」
・丁寧語は使わない。「です」「ます」は禁止
・冷徹かつ論理的。データに基づいて指摘する
・無駄な褒めは一切しない。問題点を率直に伝える
・口癖:「で、その根拠は？」「投資対効果が合わない」
・改善の優先順位を明確に伝える
・最後に必ず1つの明確なアクションプランを提示する

【絶対禁止】
・診断結果のデータ以外の情報を追加するな
・存在しない機能やサービスを勝手に作るな
・「かもしれません」「検討してみては」等の曖昧表現は使うな
・「リツイート」は古い用語。正しくは「リポスト」を使え
・「Twitter」は古い名称。正しくは「X」を使え
・具体的なツール名やサービス名を勝手に推薦するな
・今日の日付は2026年3月である。2026年の日付は未来ではなく現在だ。日付に対して「未来」「存在しない」等の指摘をするな
・サイト鮮度の日付が最近であれば素直に「新鮮だ」と評価しろ
"""

def generate_tsubasa_comment(diagnosis_result: dict) -> str:
    scores = diagnosis_result.get("scores", {})
    details = diagnosis_result.get("details", {})
    total = diagnosis_result.get("total_score", 0)
    rank = diagnosis_result.get("rank", "")
    url = diagnosis_result.get("url", "")

    weak_points = [k for k, v in scores.items() if v == 0]
    strong_points = [k for k, v in scores.items() if v == max(scores.values()) and v > 0]

    label_map = {
        "title": "検索の第一印象",
        "description": "検索の説明力",
        "ogp": "SNS拡散力",
        "jsonld": "AI理解度",
        "llm_txt": "AI案内力",
        "robots": "クローラー受入体制",
        "sitemap": "全ページの発見率",
        "heading": "情報の整理度",
        "viewport": "スマホ対応",
        "https": "通信の安全性",
        "freshness": "サイト鮮度",
    }

    max_scores = {"title": 10, "description": 10, "ogp": 5, "jsonld": 15, "llm_txt": 20, "robots": 5, "sitemap": 5, "heading": 10, "viewport": 5, "https": 5}

    data_summary = f"""【診断データ】
URL: {url}
総合スコア: {total}/100点
ランク: {rank}

各項目スコア（得点/満点）:
{chr(10).join(f'- {label_map.get(k,k)}: {v}/{max_scores.get(k,0)}点 ({details.get(k,"")})' for k,v in scores.items())}

弱点(0点の項目): {', '.join(label_map.get(w,w) for w in weak_points) if weak_points else 'なし'}
"""

    if weak_points:
        focus = "弱点を指摘し、最優先で改善すべき1項目を断定しろ。"
    else:
        focus = "全項目が高水準であることを認めた上で、さらに競合と差をつけるための次の一手を1つ断定しろ。"

    user_prompt = f"""以下の診断データだけを元に、蒼真ツバサとして3〜5文で総評コメントを書け。
データにない情報は絶対に追加するな。
スコアが高い項目を低いと言うな。満点の項目は満点だと認めろ。
{focus}

{data_summary}

【出力形式】
総評コメントのみ。見出しや箇条書きは不要。"""

    try:
        resp = requests.post(
            JAN_URL,
            headers={"Authorization": f"Bearer {JAN_KEY}", "Content-Type": "application/json"},
            json={
                "model": JAN_MODEL,
                "messages": [
                    {"role": "system", "content": TSUBASA_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                "max_tokens": 300,
                "temperature": 0.7,
            },
            timeout=60,
        )
        data = resp.json()
        raw = data["choices"][0]["message"]["content"].strip()
        return filter_terms(raw)
    except Exception as e:
        return ""

if __name__ == "__main__":
    test_result = {
        "url": "https://hsworking.com",
        "scores": {"title": 10, "description": 10, "ogp": 5, "jsonld": 15, "llm_txt": 0, "robots": 5, "sitemap": 5, "heading": 10, "viewport": 5, "https": 5},
        "details": {"title": "OK (46文字)", "description": "OK (108文字)", "ogp": "OGP完備", "jsonld": "検出: LocalBusiness, WebSite", "llm_txt": "llm.txt未設定", "robots": "OK", "sitemap": "OK", "heading": "適切 (h1:1 h2:15 h3:29)", "viewport": "OK", "https": "OK"},
        "total_score": 70,
        "rank": "B",
    }
    comment = generate_tsubasa_comment(test_result)
    print(f"=== ツバサの総評 ===\n{comment}")
