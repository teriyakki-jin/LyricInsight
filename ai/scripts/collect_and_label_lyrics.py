# -*- coding: utf-8 -*-
"""
K-POP 가사 수집 및 GPT 자동 레이블링 스크립트
"""

import json
import os
import time
from pathlib import Path
from openai import OpenAI

# 경로 설정
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR.parent / "data"
OUTPUT_PATH = DATA_DIR / "labeled" / "kpop_lyrics_labeled.jsonl"
LABELS_PATH = DATA_DIR / "processed_kpoem" / "labels.json"

# 44개 감정 레이블 로드
labels = json.loads(LABELS_PATH.read_text(encoding="utf-8"))
LABELS_STR = ", ".join(labels)

# 샘플 K-POP 가사 (라인 단위)
SAMPLE_LYRICS = [
    # 사랑/행복 계열
    {"text": "너를 사랑해 영원히 함께할 거야", "meta": {"title": "사랑 노래", "artist": "샘플"}},
    {"text": "네가 웃으면 나도 행복해져", "meta": {"title": "사랑 노래", "artist": "샘플"}},
    {"text": "손을 잡고 걸어가는 이 순간이 좋아", "meta": {"title": "사랑 노래", "artist": "샘플"}},
    {"text": "매일 보고 싶어 너만 생각나", "meta": {"title": "사랑 노래", "artist": "샘플"}},
    {"text": "우리 함께라면 뭐든 할 수 있어", "meta": {"title": "사랑 노래", "artist": "샘플"}},
    {"text": "네 옆에 있을 때 가장 행복해", "meta": {"title": "사랑 노래", "artist": "샘플"}},
    {"text": "사랑한다 말할게 오늘도 내일도", "meta": {"title": "사랑 노래", "artist": "샘플"}},
    {"text": "너와 함께한 모든 날이 선물이야", "meta": {"title": "사랑 노래", "artist": "샘플"}},

    # 이별/슬픔 계열
    {"text": "이젠 안녕 다시는 볼 수 없겠지", "meta": {"title": "이별 노래", "artist": "샘플"}},
    {"text": "눈물이 흘러 멈출 수가 없어", "meta": {"title": "이별 노래", "artist": "샘플"}},
    {"text": "니가 없는 하루는 너무 길어", "meta": {"title": "이별 노래", "artist": "샘플"}},
    {"text": "잊을 수 없어 네 모습이 자꾸 떠올라", "meta": {"title": "이별 노래", "artist": "샘플"}},
    {"text": "왜 떠났니 대답해줘 제발", "meta": {"title": "이별 노래", "artist": "샘플"}},
    {"text": "혼자 남겨진 밤이 무서워", "meta": {"title": "이별 노래", "artist": "샘플"}},
    {"text": "다시 돌아와줘 너 없이 못 살아", "meta": {"title": "이별 노래", "artist": "샘플"}},
    {"text": "추억만 남았어 텅 빈 내 방에", "meta": {"title": "이별 노래", "artist": "샘플"}},

    # 희망/응원 계열
    {"text": "넘어져도 다시 일어나 달려갈 거야", "meta": {"title": "응원 노래", "artist": "샘플"}},
    {"text": "포기하지 마 넌 할 수 있어", "meta": {"title": "응원 노래", "artist": "샘플"}},
    {"text": "꿈을 향해 날아올라 두려워 마", "meta": {"title": "응원 노래", "artist": "샘플"}},
    {"text": "내일은 더 좋은 날이 올 거야", "meta": {"title": "응원 노래", "artist": "샘플"}},
    {"text": "힘들어도 웃어봐 다 잘 될 거야", "meta": {"title": "응원 노래", "artist": "샘플"}},
    {"text": "너의 빛나는 미래를 믿어", "meta": {"title": "응원 노래", "artist": "샘플"}},
    {"text": "세상이 널 막아도 멈추지 마", "meta": {"title": "응원 노래", "artist": "샘플"}},
    {"text": "우리가 응원할게 파이팅", "meta": {"title": "응원 노래", "artist": "샘플"}},

    # 그리움/회상 계열
    {"text": "그때 그 시절이 그리워져", "meta": {"title": "추억 노래", "artist": "샘플"}},
    {"text": "다시 돌아갈 수 있다면 좋겠어", "meta": {"title": "추억 노래", "artist": "샘플"}},
    {"text": "오래된 사진 속 우리의 모습", "meta": {"title": "추억 노래", "artist": "샘플"}},
    {"text": "지나간 계절이 떠오르는 밤", "meta": {"title": "추억 노래", "artist": "샘플"}},

    # 외로움 계열
    {"text": "아무도 없는 방에 혼자 있어", "meta": {"title": "외로움 노래", "artist": "샘플"}},
    {"text": "친구도 없이 텅 빈 거리를 걸어", "meta": {"title": "외로움 노래", "artist": "샘플"}},
    {"text": "전화해도 받는 사람이 없네", "meta": {"title": "외로움 노래", "artist": "샘플"}},
    {"text": "혼자라는 게 이렇게 힘든 줄 몰랐어", "meta": {"title": "외로움 노래", "artist": "샘플"}},

    # 분노/좌절 계열
    {"text": "왜 나한테만 이래 너무 불공평해", "meta": {"title": "분노 노래", "artist": "샘플"}},
    {"text": "참을 수가 없어 폭발할 것 같아", "meta": {"title": "분노 노래", "artist": "샘플"}},
    {"text": "다 집어치워 지쳤어 이제", "meta": {"title": "좌절 노래", "artist": "샘플"}},
    {"text": "아무 의미 없어 다 헛된 짓이야", "meta": {"title": "좌절 노래", "artist": "샘플"}},

    # 설렘/기대 계열
    {"text": "내일 널 만나 두근두근 떨려", "meta": {"title": "설렘 노래", "artist": "샘플"}},
    {"text": "처음 눈이 마주친 그 순간", "meta": {"title": "설렘 노래", "artist": "샘플"}},
    {"text": "어떤 옷을 입을까 고민돼", "meta": {"title": "설렘 노래", "artist": "샘플"}},
    {"text": "네가 올까 봐 계속 문을 봐", "meta": {"title": "설렘 노래", "artist": "샘플"}},

    # 자신감/당당함 계열
    {"text": "난 최고야 누구도 날 막을 수 없어", "meta": {"title": "자신감 노래", "artist": "샘플"}},
    {"text": "내 길을 간다 뒤돌아보지 않아", "meta": {"title": "자신감 노래", "artist": "샘플"}},
    {"text": "세상이 뭐라 해도 난 나야", "meta": {"title": "자신감 노래", "artist": "샘플"}},
    {"text": "빛나는 건 나니까 비켜", "meta": {"title": "자신감 노래", "artist": "샘플"}},

    # 감사/고마움 계열
    {"text": "고마워 네가 있어서 정말 다행이야", "meta": {"title": "감사 노래", "artist": "샘플"}},
    {"text": "항상 내 곁에 있어줘서 감사해", "meta": {"title": "감사 노래", "artist": "샘플"}},
    {"text": "너 덕분에 여기까지 올 수 있었어", "meta": {"title": "감사 노래", "artist": "샘플"}},

    # 평화/편안함 계열
    {"text": "햇살 따스한 오후 느긋하게 쉬어", "meta": {"title": "평화 노래", "artist": "샘플"}},
    {"text": "아무 걱정 없이 하늘을 바라봐", "meta": {"title": "평화 노래", "artist": "샘플"}},
    {"text": "이대로 멈춰도 괜찮아 천천히 가자", "meta": {"title": "평화 노래", "artist": "샘플"}},
]


def label_with_gpt(client: OpenAI, text: str, labels_str: str) -> list:
    """GPT로 텍스트에 감정 레이블링"""

    prompt = f"""다음 가사 한 줄에 해당하는 감정들을 선택해주세요.

가사: "{text}"

선택 가능한 감정 (44개):
{labels_str}

규칙:
1. 해당하는 감정만 선택 (1~5개 권장)
2. JSON 배열로 반환: ["감정1", "감정2", ...]
3. 정확히 위 목록에 있는 감정명만 사용
4. 감정이 없으면 ["없음"] 반환

JSON 배열만 출력:"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=200
        )

        result = response.choices[0].message.content.strip()
        # JSON 파싱
        if result.startswith("["):
            emotions = json.loads(result)
            # 유효한 레이블만 필터링
            valid_emotions = [e for e in emotions if e in labels]
            return valid_emotions if valid_emotions else ["없음"]
    except Exception as e:
        print(f"Error labeling '{text}': {e}")

    return ["없음"]


def main():
    # OpenAI API 키 확인
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("OPENAI_API_KEY 환경변수를 설정해주세요.")
        print("예: set OPENAI_API_KEY=sk-...")
        return

    client = OpenAI(api_key=api_key)

    print(f"총 {len(SAMPLE_LYRICS)}개 가사 레이블링 시작...")
    print(f"출력 파일: {OUTPUT_PATH}")

    results = []

    for i, item in enumerate(SAMPLE_LYRICS):
        text = item["text"]
        meta = item["meta"]

        print(f"[{i+1}/{len(SAMPLE_LYRICS)}] {text[:30]}...")

        emotions = label_with_gpt(client, text, LABELS_STR)

        result = {
            "id": i + 1,
            "text": text,
            "meta": meta,
            "labels": {
                "emotions": [{"label": e, "score": 1.0} for e in emotions]
            }
        }
        results.append(result)

        # Rate limiting
        time.sleep(0.5)

    # 저장
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        for r in results:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    print(f"\n완료! {len(results)}개 가사 레이블링 저장됨: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
