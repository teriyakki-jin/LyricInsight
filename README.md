# 🎵 LyricInsight

LyricInsight는 노래 가사를 깊이 있게 분석하여 감정, 테마, 그리고 숨겨진 의미를 찾아주는 웹 애플리케이션입니다.

![LyricInsight Preview](https://github.com/user-attachments/assets/preview-placeholder) <!-- 실제 이미지가 있다면 교체 가능 -->

## ✨ 주요 기능

- **심층 가사 분석**: 자체 감정 분석 모델과 OpenAI GPT를 결합하여 가사의 의미를 다각도로 해석합니다.
- **가사 크롤링**: 벅스(Bugs) 뮤직 URL 하나로 가사를 즉시 불러옵니다.
- **감정 통계**: 최근 분석한 가사들의 감정 트렌드를 시각화하여 보여줍니다.
- **분석 히스토리**: 과거 분석 내역을 저장하고 관리(조회/삭제)할 수 있습니다.
- **모던한 UI/UX**: 글래스모피즘(Glassmorphism) 디자인, 쉬머(Shimmer) 로딩 효과, 그리고 완벽한 모바일 최적화를 제공합니다.
- **결과 공유**: 분석 결과를 링크로 간편하게 공유할 수 있습니다.

## 🛠 기술 스택

### Frontend
- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS, Radix UI
- **Icons**: Lucide React
- **State/Navigation**: React Router DOM

### Backend
- **Framework**: Spring Boot 3.3.6 (Java 17)
- **Database**: H2 (Runtime Only), Spring Data JPA
- **Web**: Spring Web, WebFlux (External API Client)
- **Scraping**: Jsoup (1.17.2)
- **Documentation**: Springdoc OpenAPI (Swagger)

### AI & Services
- **Deep Analysis**: OpenAI GPT-4o-mini
- **Sentiment Analysis**: Local Python-based Emotion Model (FastAPI)

## 🚀 시작하기

### 1. 전제 조건
- Node.js (v18+)
- Java 17
- OpenAI API Key (필요 시)

### 2. Backend 설정
```bash
cd lyric-insight-backend/backend
# application.yml에서 OpenAI API 키 및 관련 설정 확인
./gradlew bootRun
```

### 3. Frontend 설정
```bash
cd "Lyrics Analysis Webpage"
npm install
npm run dev
```

## 📝 라이선스
이 프로젝트는 개인 학습 및 포트폴리오 목적으로 제작되었습니다.