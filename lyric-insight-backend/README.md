# Lyric Insight Backend (Spring Boot)

## Requirements
- JDK 17+
- (Optional) Gradle 8+ (wrapper included)

## Run
```bash
# Windows (PowerShell)
cd backend
./gradlew bootRun
```

Server: http://localhost:8080  
Swagger UI (if enabled): http://localhost:8080/swagger-ui.html  
H2 Console: http://localhost:8080/h2-console

H2 JDBC URL (file mode): `jdbc:h2:file:./data/lyricdb`  
User: `sa` / Password: *(empty)*

### Proxy/trusted network notes
If Gradle wrapper downloads are blocked by a proxy, configure proxy variables before running commands (example):
```bash
set HTTP_PROXY=http://proxy:port
set HTTPS_PROXY=http://proxy:port
# or export on macOS/Linux
```
You can also point `GRADLE_OPTS` to your proxy:
```bash
set GRADLE_OPTS="-Dhttp.proxyHost=proxy -Dhttp.proxyPort=port -Dhttps.proxyHost=proxy -Dhttps.proxyPort=port"
```
If you have a locally cached Gradle distribution, set `GRADLE_USER_HOME` to the cache directory so the wrapper can reuse it without external downloads.

## API
- POST `/api/v1/analysis`
- GET  `/api/v1/analysis/recent?limit=10`
- GET  `/api/v1/analysis/{id}`

### OpenAI 설정
- `.env` 또는 환경 변수에 `OPENAI_API_KEY`를 설정하세요.
- 기본 모델은 `gpt-4o-mini`이며 `app.openai.model`(프로퍼티 또는 `application.yml`) 값으로 변경할 수 있습니다.
