# LyricInsight

노래 가사를 깊이 있게 분석해 감정, 테마, 핵심 구절을 도출하는 웹 애플리케이션입니다.

## 1. 문제 정의
가사 해석은 주관적이고 시간이 많이 드는 작업입니다. LyricInsight는 가사를 정량적으로 분석해 감정 흐름과 핵심 의미를 빠르게 파악할 수 있도록 돕습니다.

## 2. 접근 방법
- 감정 분석 모델(`klue/roberta-base`)과 KPoEM 감정 사전을 결합해 정확도와 해석 가능성을 동시에 확보
- 44개 감정 레이블 기반 멀티라벨 분류로 세분화된 감정 표현 지원
- React(프론트엔드) + Spring Boot(백엔드) + FastAPI(AI 서버)로 역할 분리

## 3. 주요 기능
- 심층 가사 분석
- 44개 감정 레이블 분류
- 단어별 감정 기여도 분석
- 핵심 가사 구절 자동 추출
- 가수명/곡명 기반 가사 검색
- 분석 히스토리 및 감정 통계 시각화

## 4. 기술 스택
- Frontend: React, Vite, Tailwind CSS, Radix UI, Recharts
- Backend: Spring Boot, Java 17, H2, Spring Data JPA
- AI Server: FastAPI, Transformers, PyTorch
- Model: KPoEM 기반 emotion_v2 (F1-micro 52.2%, F1-macro 29.5%)

## 5. 프로젝트 구조
```text
LyricInsight/
├── ai/
├── lyric-insight-backend/
├── Lyrics Analysis Webpage/
├── LyricInsight_Training.ipynb
└── README.md
```

## 6. 실행 방법
```bash
# 1) AI server
cd ai/api
pip install fastapi uvicorn transformers torch
uvicorn server_emotion_kpoem:app --host 0.0.0.0 --port 8001

# 2) Backend
cd lyric-insight-backend/backend
./gradlew bootRun

# 3) Frontend
cd "Lyrics Analysis Webpage"
npm install
npm run dev
```

## 7. 결과 및 확장 방향
- 가사 해석 과정을 자동화해 사용자 탐색 시간을 줄임
- 감정 분류 신뢰도 개선(데이터 증강/클래스 불균형 보정) 및 다국어 확장 가능
