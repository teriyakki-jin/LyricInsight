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

## API
- POST `/api/v1/analysis`
- GET  `/api/v1/analysis/recent?limit=10`
- GET  `/api/v1/analysis/{id}`
