import json
import re
from pathlib import Path
from collections import Counter

IN_PATH = Path("../data/raw/clean_wikisource.jsonl")
OUT_PATH = Path("../data/labeled/labeled_poems.auto.jsonl")
OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

# 감정 키워드 사전(필요하면 계속 확장하면 됨)
EMOTION_LEXICON = {
    "슬픔": ["눈물", "슬프", "서러", "비통", "한", "아프", "그늘", "울", "통곡", "상처"],
    "그리움": ["그리", "보고", "기다", "추억", "기억", "그대", "님", "그립", "생각"],
    "사랑": ["사랑", "연정", "정", "품", "안", "입맞", "가슴", "애", "연인"],
    "희망": ["희망", "새", "빛", "봄", "내일", "다시", "피어", "살", "기대", "꿈"],
    "체념": ["체념", "그만", "놓", "잊", "끝", "떠나", "사라", "무심", "허무"],
    "외로움": ["외롭", "홀로", "혼자", "쓸쓸", "적막", "고독", "빈", "텅", "밤"],
    "평온": ["고요", "평온", "잔잔", "포근", "따뜻", "한가", "편안"],
    "기쁨": ["기쁘", "웃", "환희", "즐겁", "반갑", "설레", "행복"],
    "분노": ["분노", "미워", "원망", "저주", "화", "분개", "억울"],
}

# 테마 키워드 사전
THEME_LEXICON = {
    "이별": ["이별", "떠나", "가실", "헤어", "작별", "끝", "보내"],
    "사랑": ["사랑", "연정", "연인", "그대", "님", "정", "입맞"],
    "상실": ["잃", "사라", "없", "죽", "장례", "무덤", "그리운 이"],
    "성장": ["성장", "배우", "깨닫", "어른", "길러", "변하", "자라"],
    "자연": ["바람", "비", "눈", "꽃", "봄", "여름", "가을", "겨울", "하늘", "바다", "산", "강", "달", "별"],
    "고독": ["고독", "외롭", "홀로", "혼자", "적막", "쓸쓸", "빈"],
    "시간": ["시간", "세월", "날", "밤", "오늘", "내일", "어제", "순간", "오래"],
    "삶": ["삶", "살", "인생", "사람", "마음", "숨", "길"],
    "죽음": ["죽", "무덤", "장례", "사후", "영혼", "저승"],
    "기억": ["기억", "추억", "생각", "잊", "그리", "회상"],
    "희망": ["희망", "꿈", "내일", "빛", "새", "봄", "다시"],
    "저항": ["저항", "투쟁", "자유", "억압", "나라", "조국", "독립"],
}

def normalize(text: str) -> str:
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    return text

def score_by_lexicon(text: str, lexicon: dict[str, list[str]]) -> Counter:
    t = text
    c = Counter()
    for label, kws in lexicon.items():
        score = 0
        for kw in kws:
            # 부분일치로 카운트
            score += t.count(kw)
        if score > 0:
            c[label] = score
    return c

def pick_top(counter: Counter, k: int):
    if not counter:
        return []
    return [x for x, _ in counter.most_common(k)]

def main():
    out_lines = []
    with IN_PATH.open("r", encoding="utf-8") as f:
        for idx, line in enumerate(f, 1):
            it = json.loads(line)
            text = normalize(it.get("text", ""))
            title = it.get("title", "")

            emo_scores = score_by_lexicon(text, EMOTION_LEXICON)
            theme_scores = score_by_lexicon(text, THEME_LEXICON)

            emotions = pick_top(emo_scores, 2)
            themes = pick_top(theme_scores, 3)

            # 아무것도 안 나오면 최소 fallback (자연/기억 같은 범용 테마)
            if not themes:
                themes = ["기억"] if ("기억" in text or "추억" in text) else ["자연"]

            # score는 규칙 기반이니 1.0 대신 0.6~0.9 범위로
            emotion_objs = []
            for e in emotions:
                raw = emo_scores[e]
                score = min(0.95, 0.55 + 0.1 * raw)  # 대충 스케일링
                emotion_objs.append({"label": e, "score": round(score, 2)})

            out_item = {
                "id": idx,
                "title": title,
                "text": text,
                "labels": {
                    "summary": [],
                    "emotions": emotion_objs,
                    "themes": themes,
                    "highlights": []
                }
            }
            out_lines.append(json.dumps(out_item, ensure_ascii=False))

    OUT_PATH.write_text("\n".join(out_lines), encoding="utf-8")
    print("saved:", OUT_PATH)
    print("count:", len(out_lines))

if __name__ == "__main__":
    main()
