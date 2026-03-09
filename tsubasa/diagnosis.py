import re
from datetime import datetime, timedelta
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import json
import re
from datetime import datetime, timedelta

def run_diagnosis(url: str) -> dict:
    result = {
        "url": url,
        "scores": {},
        "details": {},
        "total_score": 0,
        "max_score": 100,
        "rank": "",
    }

    try:
        headers = {"User-Agent": "Mozilla/5.0 (compatible; TsubasaBot/1.0)"}
        resp = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
        resp.raise_for_status()
        html = resp.text
        soup = BeautifulSoup(html, "html.parser")
        parsed = urlparse(url)
        base_url = f"{parsed.scheme}://{parsed.netloc}"
    except Exception as e:
        result["error"] = f"サイトにアクセスできませんでした: {str(e)}"
        return result

    total = 0

    # 1. title
    title_tag = soup.find("title")
    title_text = title_tag.get_text(strip=True) if title_tag else ""
    title_len = len(title_text)
    if title_text and 10 <= title_len <= 60:
        result["scores"]["title"] = 10
        result["details"]["title"] = f"OK ({title_len}文字): {title_text[:50]}"
    elif title_text:
        result["scores"]["title"] = 5
        result["details"]["title"] = f"文字数が最適でない ({title_len}文字): {title_text[:50]}"
    else:
        result["scores"]["title"] = 0
        result["details"]["title"] = "titleタグが未設定"
    total += result["scores"]["title"]

    # 2. description
    desc_tag = soup.find("meta", attrs={"name": "description"})
    desc_text = desc_tag.get("content", "").strip() if desc_tag else ""
    desc_len = len(desc_text)
    if desc_text and 50 <= desc_len <= 160:
        result["scores"]["description"] = 10
        result["details"]["description"] = f"OK ({desc_len}文字)"
    elif desc_text:
        result["scores"]["description"] = 5
        result["details"]["description"] = f"文字数が最適でない ({desc_len}文字)"
    else:
        result["scores"]["description"] = 0
        result["details"]["description"] = "meta descriptionが未設定"
    total += result["scores"]["description"]

    # 3. OGP
    og_title = soup.find("meta", property="og:title")
    og_desc = soup.find("meta", property="og:description")
    og_image = soup.find("meta", property="og:image")
    og_url = soup.find("meta", property="og:url")
    og_count = sum(1 for x in [og_title, og_desc, og_image, og_url] if x)
    if og_count == 4:
        result["scores"]["ogp"] = 5
        result["details"]["ogp"] = "OGP完備 (title/desc/image/url)"
    elif og_count > 0:
        result["scores"]["ogp"] = 2
        result["details"]["ogp"] = f"OGP一部設定 ({og_count}/4項目)"
    else:
        result["scores"]["ogp"] = 0
        result["details"]["ogp"] = "OGP未設定"
    total += result["scores"]["ogp"]

    # 4. JSON-LD
    jsonld_tags = soup.find_all("script", type="application/ld+json")
    if jsonld_tags:
        types_found = []
        for tag in jsonld_tags:
            try:
                data = json.loads(tag.string)
                if isinstance(data, dict):
                    types_found.append(data.get("@type", "unknown"))
                elif isinstance(data, list):
                    types_found.extend(d.get("@type", "unknown") for d in data if isinstance(d, dict))
            except:
                pass
        result["scores"]["jsonld"] = 15
        result["details"]["jsonld"] = f"検出: {', '.join(types_found[:5])}"
    else:
        result["scores"]["jsonld"] = 0
        result["details"]["jsonld"] = "構造化データ(JSON-LD)なし"
    total += result["scores"]["jsonld"]

    # 5. llm.txt (複数パス探索)
    llm_paths = [
        "/.well-known/llm.txt",
        "/llm.txt",
        "/llms.txt",
        "/.well-known/llms.txt",
        "/_functions/llm_txt",
        "/_functions/llms_txt",
    ]
    llm_found = False
    llm_detail = ""
    for lp in llm_paths:
        try:
            llm_resp = requests.get(f"{base_url}{lp}", headers=headers, timeout=5)
            if llm_resp.status_code == 200 and len(llm_resp.text.strip()) > 10:
                ct = llm_resp.headers.get("content-type", "")
                if "html" not in ct.lower() or "# " in llm_resp.text[:100]:
                    llm_found = True
                    llm_detail = f"検出: {lp} ({len(llm_resp.text)}バイト)"
                    break
        except:
            continue
    if llm_found:
        result["scores"]["llm_txt"] = 20
        result["details"]["llm_txt"] = llm_detail
    else:
        result["scores"]["llm_txt"] = 0
        result["details"]["llm_txt"] = "llm.txt未設定"
    total += result["scores"]["llm_txt"]

    # 6. robots.txt
    try:
        robots_resp = requests.get(f"{base_url}/robots.txt", headers=headers, timeout=5)
        if robots_resp.status_code == 200 and "user-agent" in robots_resp.text.lower():
            result["scores"]["robots"] = 5
            result["details"]["robots"] = "OK"
        else:
            result["scores"]["robots"] = 0
            result["details"]["robots"] = "robots.txt未設定または不正"
    except:
        result["scores"]["robots"] = 0
        result["details"]["robots"] = "robots.txtアクセス不可"
    total += result["scores"]["robots"]

    # 7. sitemap
    sitemap_found = False
    try:
        # robots.txtからsitemap確認
        if robots_resp.status_code == 200 and "sitemap:" in robots_resp.text.lower():
            sitemap_found = True
        else:
            sm_resp = requests.get(f"{base_url}/sitemap.xml", headers=headers, timeout=5)
            if sm_resp.status_code == 200 and "urlset" in sm_resp.text.lower():
                sitemap_found = True
    except:
        pass
    result["scores"]["sitemap"] = 5 if sitemap_found else 0
    result["details"]["sitemap"] = "OK" if sitemap_found else "sitemap未検出"
    total += result["scores"]["sitemap"]

    # 8. h構造
    h1s = soup.find_all("h1")
    h2s = soup.find_all("h2")
    h3s = soup.find_all("h3")
    h1_count = len(h1s)
    if h1_count == 1 and len(h2s) >= 1:
        result["scores"]["heading"] = 10
        result["details"]["heading"] = f"適切 (h1:{h1_count} h2:{len(h2s)} h3:{len(h3s)})"
    elif h1_count == 1:
        result["scores"]["heading"] = 7
        result["details"]["heading"] = f"h1は1つだがh2不足 (h1:{h1_count} h2:{len(h2s)} h3:{len(h3s)})"
    elif h1_count == 0:
        result["scores"]["heading"] = 0
        result["details"]["heading"] = "h1タグなし"
    else:
        result["scores"]["heading"] = 3
        result["details"]["heading"] = f"h1が複数 ({h1_count}個)"
    total += result["scores"]["heading"]

    # 9. viewport
    viewport = soup.find("meta", attrs={"name": "viewport"})
    if viewport:
        result["scores"]["viewport"] = 5
        result["details"]["viewport"] = "OK"
    else:
        result["scores"]["viewport"] = 0
        result["details"]["viewport"] = "viewport未設定 (モバイル非対応の可能性)"
    total += result["scores"]["viewport"]

    # 10. HTTPS
    if parsed.scheme == "https":
        result["scores"]["https"] = 5
        result["details"]["https"] = "OK"
    else:
        result["scores"]["https"] = 0
        result["details"]["https"] = "HTTPSでない"
    total += result["scores"]["https"]

    # 11. サイト鮮度
    freshness_score = 0
    freshness_detail = "更新日を検出できず"
    latest_date = None

    # meta last-modified
    last_mod = resp.headers.get("last-modified", "")
    if last_mod:
        try:
            from email.utils import parsedate_to_datetime
            latest_date = parsedate_to_datetime(last_mod)
            freshness_detail = f"Last-Modified: {latest_date.strftime('%Y-%m-%d')}"
        except:
            pass

    # article:modified_time / article:published_time
    for meta_name in ["article:modified_time", "article:published_time", "og:updated_time"]:
        tag = soup.find("meta", property=meta_name)
        if tag and tag.get("content"):
            try:
                d = datetime.fromisoformat(tag["content"].replace("Z", "+00:00"))
                if latest_date is None or d > latest_date:
                    latest_date = d
                    freshness_detail = f"{meta_name}: {d.strftime('%Y-%m-%d')}"
            except:
                pass

    # JSON-LD dateModified
    for jt in jsonld_tags:
        try:
            jd = json.loads(jt.string)
            if isinstance(jd, dict):
                for dk in ["dateModified", "datePublished"]:
                    if dk in jd:
                        d = datetime.fromisoformat(str(jd[dk]).replace("Z", "+00:00"))
                        if latest_date is None or d > latest_date:
                            latest_date = d
                            freshness_detail = f"JSON-LD {dk}: {d.strftime('%Y-%m-%d')}"
        except:
            pass

    # sitemap lastmod
    try:
        sm_url = f"{base_url}/sitemap.xml"
        sm_resp = requests.get(sm_url, headers=headers, timeout=5)
        if sm_resp.status_code == 200:
            import re as re2
            lastmods = re2.findall(r"<lastmod>([^<]+)</lastmod>", sm_resp.text)
            for lm in lastmods:
                try:
                    d = datetime.fromisoformat(lm.replace("Z", "+00:00"))
                    if latest_date is None or d > latest_date:
                        latest_date = d
                        freshness_detail = f"sitemap lastmod: {d.strftime('%Y-%m-%d')}"
                except:
                    pass
    except:
        pass

    # copyright年チェック
    footer_text = ""
    for ft in soup.find_all(["footer", "div"], class_=lambda x: x and "footer" in str(x).lower()):
        footer_text += ft.get_text()
    if not footer_text:
        footer_text = soup.get_text()[-500:]
    import re as re3
    cr_years = re3.findall(r"(?:©|copyright)\s*(20\d{2})", footer_text.lower())
    if cr_years:
        try:
            cy = max(int(y) for y in cr_years)
            d = datetime(cy, 12, 31)
            if latest_date is None or d > latest_date:
                latest_date = d
                freshness_detail = f"Copyright: {cy}"
        except:
            pass

    now = datetime.now()
    if latest_date:
        if latest_date.tzinfo:
            latest_date = latest_date.replace(tzinfo=None)
        age_days = (now - latest_date).days
        if age_days <= 180:
            freshness_score = 10
            freshness_detail += f" (約{age_days}日前・新鮮)"
        elif age_days <= 365:
            freshness_score = 5
            freshness_detail += f" (約{age_days}日前・やや古い)"
        else:
            freshness_score = 0
            freshness_detail += f" (約{age_days}日前・古い)"

    result["scores"]["freshness"] = freshness_score
    result["details"]["freshness"] = freshness_detail
    total += freshness_score

    result["total_score"] = total

    # ランク判定（100点満点）
    if total >= 90:
        result["rank"] = "A"
    elif total >= 70:
        result["rank"] = "B"
    elif total >= 50:
        result["rank"] = "C"
    elif total >= 30:
        result["rank"] = "D"
    else:
        result["rank"] = "E"

    return result

if __name__ == "__main__":
    import sys
    url = sys.argv[1] if len(sys.argv) > 1 else "https://hsworking.com"
    r = run_diagnosis(url)
    print(json.dumps(r, ensure_ascii=False, indent=2))
