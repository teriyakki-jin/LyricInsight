import json
import re
from pathlib import Path
from bs4 import BeautifulSoup

RAW_HTML_DIR = Path("../data/raw/_debug_html")
RAW_JSONL = Path("../data/raw/raw_wikisource.jsonl")
CLEAN_JSONL = Path("../data/raw/clean_wikisource.jsonl")

PD_PATTERNS = [
    r"이 저작물은 저자가 사망한 지 70년이 지났으므로",
    r"Public domain",
    r"퍼블릭 도메인",
    r"PD-1996",
]

NAV_PATTERNS = [
    r"^←.*→$",
    r"^자매 프로젝트.*$",
    r"^분류:.*$",
    r"위키백과.*에서 인용",
]

def looks_like_noise(line: str) -> bool:
    line = line.strip()
    if not line:
        return True
    if len(line) < 2:
        return True
    for p in PD_PATTERNS:
        if re.search(p, line):
            return True
    for p in NAV_PATTERNS:
        if re.search(p, line):
            return True
    # 너무 숫자/기호 위주인 줄 제거
    if re.fullmatch(r"[\d\s·\-\—_]+", line):
        return True
    return False

def extract_poem_text_from_html(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    content = soup.select_one("#mw-content-text .mw-parser-output")
    if not content:
        return ""

    # poem 블록이 있으면 그거 우선
    poem_blocks = content.select("div.poem, poem, div.mw-poem")
    lines = []

    if poem_blocks:
        for blk in poem_blocks:
            # <br> 기반 줄바꿈을 텍스트로 가져오기
            text = blk.get_text("\n", strip=True)
            for ln in text.splitlines():
                ln = ln.strip()
                if not looks_like_noise(ln):
                    lines.append(ln)
    else:
        # poem 블록 없으면 p 중에서 의미 있는 것만(길이/패턴 기준)
        for p in content.find_all("p", recursive=False):
            text = p.get_text(" ", strip=True)
            if not looks_like_noise(text) and len(text) >= 20:
                lines.append(text)

    # 연속 공백 정리
    cleaned = []
    for ln in lines:
        ln = re.sub(r"\s+", " ", ln).strip()
        if not looks_like_noise(ln):
            cleaned.append(ln)

    # 너무 짧으면 실패 처리
    out = "\n".join(cleaned).strip()
    return out

def main():
    # raw jsonl에 있는 source url로 html 파일명 찾기
    items = [json.loads(line) for line in RAW_JSONL.read_text(encoding="utf-8").splitlines() if line.strip()]
    cleaned_items = []

    for it in items:
        #source = it["source"]
        #safe_name = source.replace("https://", "").replace("/", "_").replace(":", "_")
        html_path = Path(it.get("html_path", ""))
        if not html_path.exists():
            print("HTML not found:", html_path)
            continue

        html = html_path.read_text(encoding="utf-8")
        poem_text = extract_poem_text_from_html(html)

        if len(poem_text) < 50:
            print("❌ cleaned too short:", it["title"], "len=", len(poem_text))
            continue

        cleaned_items.append({
            "title": it["title"],
            "text": poem_text,
            "source": it["source"]
        })
        print("✅ cleaned:", it["title"], "len=", len(poem_text))

    CLEAN_JSONL.parent.mkdir(parents=True, exist_ok=True)
    with CLEAN_JSONL.open("w", encoding="utf-8") as f:
        for it in cleaned_items:
            f.write(json.dumps(it, ensure_ascii=False) + "\n")

    print("\n총 정제 개수:", len(cleaned_items))
    print("저장:", CLEAN_JSONL)

if __name__ == "__main__":
    main()
