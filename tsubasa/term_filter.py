# 古い用語→新しい用語の置換辞書
# JAN 4Bの出力に後処理でかける
# 随時追加可能

TERM_MAP = {
    "リツイート": "リポスト",
    "Twitter": "X",
    "twitter": "X",
    "ツイッター": "X",
    "Google+": "（※サービス終了）",
    "Internet Explorer": "（※サポート終了）",
    "IE11": "（※サポート終了）",
    "Flash": "（※サポート終了）",
    "Adobe Flash": "（※サポート終了）",
    "Facebook広告": "Meta広告",
    "Facebookページ": "Metaビジネスページ",
    "インスタグラム": "Instagram",
    "グーグル": "Google",
    "ヤフー": "Yahoo!",
    "SSL証明書": "TLS/SSL証明書",
    "ホームページ": "Webサイト",
    "アクセス数": "セッション数",
    "PV数": "ページビュー数",
    "SEO対策": "SEO",
}

def filter_terms(text: str) -> str:
    for old, new in TERM_MAP.items():
        text = text.replace(old, new)
    return text

if __name__ == "__main__":
    test = "TwitterでリツイートしてFacebook広告を使いホームページのアクセス数を増やす"
    print(f"Before: {test}")
    print(f"After:  {filter_terms(test)}")
