import os
import json
import time
import requests
from bs4 import BeautifulSoup
from pathlib import Path
import re

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
}
BASE = "https://ko.wikisource.org"

RAW_OUT = Path("../data/raw/raw_wikisource.jsonl")
DEBUG_HTML_DIR = Path("../data/raw/_debug_html")
DEBUG_HTML_DIR.mkdir(parents=True, exist_ok=True)

def fetch(url, session):
    r = session.get(url, headers=HEADERS, timeout=20, allow_redirects=True)
    return r

def safe_name_from_url(url: str) -> str:
    return url.replace("https://", "").replace("/", "_").replace(":", "_")

def extract_title(soup):
    t = soup.select_one("h1#firstHeading")
    return t.get_text(strip=True) if t else None

def extract_text_loose(soup):
    content = soup.select_one("#mw-content-text .mw-parser-output")
    if not content:
        return ""

    # 불필요 요소 제거
    for sel in ["div#toc", "table", "div.navbox", "div.metadata",
                "span.mw-editsection", "sup.reference", "ol.references"]:
        for x in content.select(sel):
            x.decompose()

    # poem 블록 우선
    poem_blocks = content.select("div.poem, div.mw-poem, poem")
    lines = []

    if poem_blocks:
        for blk in poem_blocks:
            txt = blk.get_text("\n", strip=True)
            lines.extend([x.strip() for x in txt.splitlines() if x.strip()])
    else:
        # 없으면 p/div 중 텍스트가 있는 것
        for tag in content.find_all(["p", "div"], recursive=False):
            txt = tag.get_text(" ", strip=True)
            if txt:
                lines.append(txt)

    # 노이즈 제거(기본)
    def noisy(s):
        if not s or len(s) < 3:
            return True
        if s.startswith("분류:") or s.startswith("자매 프로젝트"):
            return True
        if "퍼블릭 도메인" in s or "Public domain" in s:
            return True
        if "이 저작물은 저자가 사망한 지 70년" in s:
            return True
        if re.fullmatch(r"[\d\s·\-\—_]+", s):
            return True
        return False

    cleaned = []
    for ln in lines:
        ln = re.sub(r"\s+", " ", ln).strip()
        if not noisy(ln):
            cleaned.append(ln)

    return "\n".join(cleaned).strip()

def get_category_members(category_url, session, limit=300):
    """
    카테고리 페이지에서 작품 링크를 수집.
    다음 페이지가 있으면 계속 따라감.
    """
    urls = []
    next_url = category_url

    while next_url and len(urls) < limit:
        r = fetch(next_url, session)
        if r.status_code != 200:
            print("category fetch fail:", next_url, r.status_code)
            break

        soup = BeautifulSoup(r.text, "html.parser")

        # 분류 페이지의 문서 목록
        for a in soup.select("#mw-pages a"):
            href = a.get("href", "")
            if not href.startswith("/wiki/"):
                continue
            # 분류 페이지/특수 페이지 제외
            if href.startswith("/wiki/분류:") or href.startswith("/wiki/특수:"):
                continue
            urls.append(BASE + href)

        # 다음 페이지 링크
        nxt = soup.select_one("#mw-pages a[href*='pagefrom']")
        next_url = BASE + nxt["href"] if nxt else None

        time.sleep(0.8)

    # 중복 제거
    urls = list(dict.fromkeys(urls))
    return urls[:limit]

def main():
    session = requests.Session()

    # ✅ 시작 카테고리(시 관련) - 필요하면 여기만 바꿔도 됨
    category_url = BASE + "/wiki/분류:시"

    targets = get_category_members(category_url, session, limit=300)
    print("targets:", len(targets))

    # 기존 저장된 source 중복 방지
    existing = set()
    if RAW_OUT.exists():
        with RAW_OUT.open("r", encoding="utf-8") as f:
            for line in f:
                try:
                    existing.add(json.loads(line)["source"])
                except:
                    pass

    with RAW_OUT.open("a", encoding="utf-8") as out:
        for idx, url in enumerate(targets, 1):
            if url in existing:
                continue

            try:
                r = fetch(url, session)
                if r.status_code != 200:
                    continue

                # HTML 저장(디버그)
                final_url = r.url
                html_path = DEBUG_HTML_DIR / (safe_name_from_url(final_url) + ".html")
                html_path.write_text(r.text, encoding="utf-8")

                soup = BeautifulSoup(r.text, "html.parser")
                title = extract_title(soup)
                if not title:
                    continue

                text = extract_text_loose(soup)

                # ✅ 너무 짧은 건 제외(네가 말한 상황 방지)
                if len(text) < 120:
                    continue

                item = {
                    "title": title,
                    "text": text,
                    "source": final_url,
                    "html_path": str(html_path)
                }
                out.write(json.dumps(item, ensure_ascii=False) + "\n")

                print(f"[{idx}/{len(targets)}] ✅ {title} (len={len(text)})")
                time.sleep(1.0)

            except Exception as e:
                print("fail:", url, e)
                time.sleep(1.0)

    print("done:", RAW_OUT)

if __name__ == "__main__":
    main()
