import re
from pathlib import Path
from urllib.request import urlopen

LLM_URL = "https://www.hsworking.com/_functions/llm_txt"

pricing_file = Path("knowledge/pricing.md")
coupons_file = Path("knowledge/coupons.md")

def fetch_text(url: str) -> str:
    with urlopen(url, timeout=20) as r:
        return r.read().decode("utf-8", errors="ignore")

def replace_block(text: str, start: str, end: str, block: str) -> str:
    if start in text and end in text:
        pre = text.split(start)[0]
        post = text.split(end)[1]
        return pre + block + post
    if text and not text.endswith("\n"):
        text += "\n"
    return text + "\n" + block

src = fetch_text(LLM_URL)

prices_found = all(x in src for x in ["¥9,800", "¥19,800", "¥29,800"])
coupon_found = "WELCOME10" in src

pricing_block = """<!-- HS_AI_NATIVE_PRICING_START -->

## AIコーチングプラン（llm.txt同期ブロック）

- Starter: ¥9,800
- Pro: ¥19,800
- Enterprise: ¥29,800

<!-- HS_AI_NATIVE_PRICING_END -->
"""

coupon_block = """<!-- HS_AI_NATIVE_COUPON_SYNC_START -->

## WELCOME10

- Type: first-time welcome coupon
- Purpose: reduce first-conversion friction
- Source: official llm.txt sync

<!-- HS_AI_NATIVE_COUPON_SYNC_END -->
"""

if prices_found:
    text = pricing_file.read_text() if pricing_file.exists() else ""
    new_text = replace_block(
        text,
        "<!-- HS_AI_NATIVE_PRICING_START -->",
        "<!-- HS_AI_NATIVE_PRICING_END -->",
        pricing_block
    )
    pricing_file.write_text(new_text)
    print("Updated knowledge/pricing.md from llm.txt")
else:
    print("WARNING: expected prices not found in llm.txt")

if coupon_found:
    text = coupons_file.read_text() if coupons_file.exists() else "# Coupons\n\n"
    new_text = replace_block(
        text,
        "<!-- HS_AI_NATIVE_COUPON_SYNC_START -->",
        "<!-- HS_AI_NATIVE_COUPON_SYNC_END -->",
        coupon_block
    )
    coupons_file.write_text(new_text)
    print("Updated knowledge/coupons.md from llm.txt")
else:
    print("WARNING: WELCOME10 not found in llm.txt")
