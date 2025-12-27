package com.yegyu.lyricinsight.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.yegyu.lyricinsight.config.OpenAiProperties;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
public class OpenAiLyricAnalyzer {

    private static final Logger log = LoggerFactory.getLogger(OpenAiLyricAnalyzer.class);
    private static final String CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

    private final RestTemplate restTemplate;
    private final OpenAiProperties properties;
    private final ObjectMapper om;

    public JsonNode analyze(String lyrics, String style) {
        ensureApiKey();

        ObjectNode requestBody = buildRequest(lyrics, style);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(properties.apiKey());

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    CHAT_COMPLETIONS_URL,
                    new HttpEntity<>(om.writeValueAsString(requestBody), headers),
                    String.class
            );

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new IllegalStateException("OpenAI API 호출 실패: status=" + response.getStatusCode());
            }

            String content = extractContent(response.getBody());
            return om.readTree(content);
        } catch (RestClientException | JsonProcessingException e) {
            log.error("OpenAI 분석 호출 중 오류", e);
            throw new RuntimeException("OpenAI 분석 중 오류가 발생했습니다.", e);
        }
    }

    private void ensureApiKey() {
        if (properties.apiKey() == null || properties.apiKey().isBlank()) {
            throw new IllegalStateException("OpenAI API 키가 설정되지 않았습니다. app.openai.api-key 값을 설정하세요.");
        }
    }

    private ObjectNode buildRequest(String lyrics, String style) {
        ObjectNode root = om.createObjectNode();
        root.put("model", properties.model());
        root.put("temperature", 0.7);

        ObjectNode responseFormat = root.putObject("response_format");
        responseFormat.put("type", "json_object");

        ArrayNode messages = root.putArray("messages");
        messages.addObject()
                .put("role", "system")
                .put("content", buildSystemPrompt());
        messages.addObject()
                .put("role", "user")
                .put("content", buildUserPrompt(lyrics, style));
        return root;
    }

    private String buildSystemPrompt() {
        return """
                너는 한국어로 가사를 분석하는 전문 AI야. 반드시 JSON 객체만 반환해.
                JSON 스키마:
                {
                  "summary": [string, string, string], // 3줄 요약, 각 항목은 간결한 문장
                  "emotions": [ { "label": string, "score": number } ], // score는 0~1 사이 소수
                  "themes": [string, ...], // 핵심 테마 단어 목록
                  "highlights": [
                    { "line": string, "meaning": string, "why": string },
                    ...
                  ]
                }
                """;
    }

    private String buildUserPrompt(String lyrics, String style) {
        return """
                분석 스타일: %s
                다음 가사를 분석해:
                ---
                %s
                ---
                """.formatted(style, lyrics);
    }

    private String extractContent(String responseBody) throws JsonProcessingException {
        JsonNode root = om.readTree(responseBody);
        JsonNode contentNode = root.path("choices").path(0).path("message").path("content");
        if (contentNode.isMissingNode() || contentNode.isNull()) {
            throw new IllegalStateException("OpenAI 응답에서 content를 찾을 수 없습니다.");
        }
        return contentNode.asText();
    }
}
