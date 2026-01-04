import json
import re
from pathlib import Path

IN_PATH = Path("../data/labeled/labeled_poems.auto.jsonl")
OUT_DIR = Path("../data/processed")
OUT_DIR.mkdir(parents=True, exist_ok=True)

def split_lines(text: str):
    # 시는 줄 단위가 중요해서 문장 분리보다 줄 분리를 기본으로
    lines = [ln.strip() for ln in text.splitlines()]
    lines = [ln for ln in lines if ln]
    return lines

def load_jsonl(path: Path):
    raw = path.read_text(encoding="utf-8").strip()

    # 1) JSONL이면(한 줄씩 JSON) 그대로 파싱 시도
    items = []
    ok = True
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        # 멀티라인 JSON의 중간 줄("  "id": 1," 같은) 걸러내기 위해
        if not (line.startswith("{") and line.endswith("}")):
            ok = False
            break
        try:
            items.append(json.loads(line))
        except Exception:
            ok = False
            break

    if ok and items:
        return items

    # 2) JSON 배열([ {...}, {...} ]) 형태면 그걸로 파싱
    try:
        obj = json.loads(raw)
        if isinstance(obj, list):
            return obj
        if isinstance(obj, dict):
            return [obj]
    except Exception:
        pass

    # 3) 마지막 fallback: "}{“ 구분으로 덩어리 쪼개기 (대충이라도 복구)
    chunks = re.split(r"}\s*{", raw)
    recovered = []
    for i, ch in enumerate(chunks):
        ch = ch.strip()
        if not ch:
            continue
        if not ch.startswith("{"):
            ch = "{" + ch
        if not ch.endswith("}"):
            ch = ch + "}"
        recovered.append(json.loads(ch))
    return recovered


def main():
    items = load_jsonl(IN_PATH)

    emotion_rows = []
    theme_rows = []
    highlight_rows = []

    for it in items:
        text = it["text"]
        labels = it["labels"]

        emotions = [e["label"] for e in labels.get("emotions", [])]
        themes = labels.get("themes", [])
        highlights = labels.get("highlights", [])

        # A) 감정 분류
        emotion_rows.append({
            "id": it.get("id"),
            "text": text,
            "labels": emotions
        })

        # B) 테마 분류
        theme_rows.append({
            "id": it.get("id"),
            "text": text,
            "labels": themes
        })

        # C) 하이라이트 추출
        # highlight line을 정답으로 두고, 후보는 text의 줄들
        lines = split_lines(text)
        gt_lines = [h["line"].strip() for h in highlights if h.get("line")]

        # 정답 라인이 텍스트에 없을 수도 있으니 최대한 매칭
        for gt in gt_lines:
            matched = None
            for ln in lines:
                if gt in ln or ln in gt:
                    matched = ln
                    break
            if not matched:
                matched = gt  # 못 찾으면 그대로 넣어두고 나중에 필터/수정

            highlight_rows.append({
                "id": it.get("id"),
                "text": text,
                "candidates": lines[:200],  # 너무 길면 컷
                "answer": matched
            })

    (OUT_DIR / "emotion.jsonl").write_text(
        "\n".join(json.dumps(x, ensure_ascii=False) for x in emotion_rows),
        encoding="utf-8"
    )
    (OUT_DIR / "theme.jsonl").write_text(
        "\n".join(json.dumps(x, ensure_ascii=False) for x in theme_rows),
        encoding="utf-8"
    )
    (OUT_DIR / "highlight.jsonl").write_text(
        "\n".join(json.dumps(x, ensure_ascii=False) for x in highlight_rows),
        encoding="utf-8"
    )

    print("saved:", OUT_DIR / "emotion.jsonl")
    print("saved:", OUT_DIR / "theme.jsonl")
    print("saved:", OUT_DIR / "highlight.jsonl")
    print("count:", len(items))

if __name__ == "__main__":
    main()
