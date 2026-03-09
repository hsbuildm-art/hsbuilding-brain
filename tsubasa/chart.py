import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import numpy as np
import os

def get_jp_font():
    candidates = [
        "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc",
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        "/System/Library/Fonts/ヒラギノ丸ゴ ProN W4.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
    ]
    for f in candidates:
        if os.path.exists(f):
            return fm.FontProperties(fname=f)
    return fm.FontProperties()

def generate_radar_chart(scores: dict, url: str, total_score: int, rank: str, output_path: str) -> str:
    fp = get_jp_font()

    labels_map = {
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

    max_scores = {
        "title": 10, "description": 10, "ogp": 5, "jsonld": 15,
        "llm_txt": 20, "robots": 5, "sitemap": 5, "heading": 10,
        "viewport": 5, "https": 5,
        "freshness": 10,
    }

    keys = list(labels_map.keys())
    labels = [labels_map[k] for k in keys]
    values = [scores.get(k, 0) / max_scores[k] * 100 for k in keys]

    N = len(labels)
    angles = np.linspace(0, 2 * np.pi, N, endpoint=False).tolist()
    values_plot = values + [values[0]]
    angles += [angles[0]]

    fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=True))

    fig.patch.set_facecolor("#0a0a1a")
    ax.set_facecolor("#0a0a1a")

    ax.set_ylim(0, 100)
    ax.set_yticks([20, 40, 60, 80, 100])
    ax.set_yticklabels(["20", "40", "60", "80", "100"], fontproperties=fp, size=8, color="#555555")
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(labels, fontproperties=fp, size=11, color="#cccccc")
    ax.spines["polar"].set_color("#333333")
    ax.grid(color="#333333", linewidth=0.5)
    ax.tick_params(axis="x", pad=15)

    rank_colors = {"A": "#00bfff", "B": "#00e676", "C": "#ffeb3b", "D": "#ff9800", "E": "#ff1744"}
    color = rank_colors.get(rank, "#00e676")

    ax.plot(angles, values_plot, "o-", linewidth=2.5, color=color, markersize=6)
    ax.fill(angles, values_plot, alpha=0.15, color=color)

    short_url = url.replace("https://", "").replace("http://", "").rstrip("/")
    ax.set_title(
        f"SEO/AIO診断: {short_url}\nスコア: {total_score}/100  ランク: {rank}",
        fontproperties=fp, size=14, color="#ffffff", pad=30, weight="bold"
    )

    fig.text(0.5, 0.02, "Powered by 蒼真ツバサ｜HSビル・ワーキングスペース", ha="center", fontproperties=fp, size=9, color="#666666")

    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()
    return output_path

if __name__ == "__main__":
    test_scores = {
        "title": 10, "description": 10, "ogp": 5, "jsonld": 15,
        "llm_txt": 0, "robots": 5, "sitemap": 5, "heading": 10,
        "viewport": 5, "https": 5,
    }
    out = generate_radar_chart(test_scores, "https://hsworking.com", 70, "B", "/tmp/tsubasa_test2.png")
    print(f"chart: {out} ({os.path.getsize(out)} bytes)")
