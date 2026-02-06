# LyricInsight

노래 가사를 깊이 있게 분석하여 감정, 테마, 숨겨진 의미를 찾아주는 웹 애플리케이션입니다.

## 주요 기능

- **심층 가사 분석**: 자체 학습한 감정 분석 모델(klue/roberta-base)과 15,000개 이상의 단어를 포함한 KPoEM 감정 사전을 결합하여 가사를 다각도로 해석
- **44개 감정 레이블**: 기쁨, 슬픔, 분노부터 비장함, 서러움, 아껴주는 등 세분화된 감정 분류
- **단어별 정밀 분석**: 가사 속 핵심 감정 단어를 추출하고, 각 단어가 곡의 분위기에 미치는 영향을 설명
- **핵심 가사 추출**: 감정이 가장 집약된 구절을 자동으로 선정하고 분석
- **가사 검색**: 가수명과 곡 제목으로 벅스(Bugs) 뮤직에서 가사 자동 크롤링
- **분석 히스토리**: 과거 분석 내역 저장 및 관리
- **감정 통계**: 최근 분석한 가사들의 감정 트렌드 시각화

## 기술 스택

### Frontend
| 기술 | 버전 |
|------|------|
| React | 18 |
| Vite | 6.3.5 |
| Tailwind CSS | - |
| Radix UI | - |
| React Router DOM | - |
| Recharts | - |

### Backend
| 기술 | 버전 |
|------|------|
| Spring Boot | 3.3.6 |
| Java | 17 |
| H2 Database | - |
| Spring Data JPA | - |
| Jsoup | 1.17.2 |
| Springdoc OpenAPI | 2.6.0 |

### AI Server
| 기술 | 버전 |
|------|------|
| Python | 3.10+ |
| FastAPI | - |
| Transformers | 4.57+ |
| PyTorch | - |

### AI Model (emotion_v2)
| 항목 | 내용 |
|------|------|
| Base Model | klue/roberta-base |
| Task | Multi-label Classification |
| Labels | 44개 감정 |
| Training Data | KPoEM Dataset (5,604 train / 1,401 val) |
| Best F1-micro | 52.2% |
| Best F1-macro | 29.5% |

## 프로젝트 구조

```
LyricInsight/
├── ai/                              # AI 서버
│   ├── api/
│   │   └── server_emotion_kpoem.py  # FastAPI 서버
│   ├── models/
│   │   └── emotion_v2/              # 학습된 모델
│   ├── data/
│   │   └── emotion_lexicon.json     # 감정 사전 (15,741 단어)
│   └── train/
│       └── train_emotion_v2.py      # 모델 학습 스크립트
├── lyric-insight-backend/           # Spring Boot 백엔드
│   └── backend/
│       └── src/main/
│           ├── java/com/yegyu/lyricinsight/
│           │   ├── api/             # REST Controllers
│           │   ├── service/         # Business Logic
│           │   ├── domain/          # Entities
│           │   └── infra/           # External API Clients
│           └── resources/
│               └── application.yml  # 설정 파일
└── Lyrics Analysis Webpage/         # React 프론트엔드
    └── src/
        ├── components/              # React 컴포넌트
        └── lib/                     # API 유틸리티
```

## 시작하기

### 사전 요구사항
- Node.js v18+
- Java 17
- Python 3.10+
- (선택) OpenAI API Key

### 1. AI 서버 실행

```bash
cd ai/api

# 의존성 설치 (최초 1회)
pip install fastapi uvicorn transformers torch

# 서버 실행
uvicorn server_emotion_kpoem:app --host 0.0.0.0 --port 8001
```

### 2. Backend 실행

```bash
cd lyric-insight-backend/backend

# 서버 실행
./gradlew bootRun
```

### 3. Frontend 실행

```bash
cd "Lyrics Analysis Webpage"

# 의존성 설치 (최초 1회)
npm install

# 개발 서버 실행
npm run dev
```

### 4. 접속

| 서비스 | URL |
|--------|-----|
| 프론트엔드 | http://localhost:3000 |
| 백엔드 API | http://localhost:8082 |
| AI 서버 | http://localhost:8001 |
| Swagger UI | http://localhost:8082/swagger-ui.html |
| H2 Console | http://localhost:8082/h2-console |

## API 엔드포인트

### 분석 API
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | /api/v1/analysis | 가사 분석 요청 |
| GET | /api/v1/analysis/{id} | 분석 결과 조회 |
| GET | /api/v1/analysis/recent | 최근 분석 목록 |
| DELETE | /api/v1/analysis/{id} | 분석 결과 삭제 |
| GET | /api/v1/analysis/stats | 감정 통계 |

### 가사 API
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/v1/lyrics/search | 가사 검색 (artist, title) |

### AI 서버 API
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | /emotion | 감정 분석 |
| GET | /health | 서버 상태 확인 |

## 감정 레이블 (44개)

```
감동/감탄, 경악, 고마움, 공포/무서움, 귀찮음, 기대감, 기쁨, 깨달음,
놀람, 당황/난처, 부끄러움, 부담/안_내킴, 불쌍함/연민, 불안/걱정,
불평/불만, 비장함, 뿌듯함, 서러움, 슬픔, 신기함/관심, 아껴주는,
안심/신뢰, 안타까움/실망, 어이없음, 없음, 역겨움/징그러움,
우쭐댐/무시함, 의심/불신, 재미없음, 절망, 존경, 죄책감, 즐거움/신남,
증오/혐오, 지긋지긋, 짜증, 패배/자기혐오, 편안/쾌적, 한심함, 행복,
화남/분노, 환영/호의, 흐뭇함(귀여움/예쁨), 힘듦/지침
```

## 설정

### application.yml (Backend)

```yaml
server:
  port: 8082

app:
  ai:
    base-url: http://127.0.0.1:8001  # AI 서버 주소
  openai:
    api-key: your-api-key            # (선택) OpenAI API 키
    enabled: false                   # OpenAI 사용 여부
```

## 라이선스

이 프로젝트는 개인 학습 및 포트폴리오 목적으로 제작되었습니다.
