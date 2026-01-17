package com.yegyu.lyricinsight.infra.gemini;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yegyu.lyricinsight.infra.gemini.dto.GeminiRequest;
import com.yegyu.lyricinsight.infra.gemini.dto.GeminiResponse;
import com.yegyu.lyricinsight.infra.gemini.dto.InterpretationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiClient {

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    @Value("${app.gemini.base-url}")
    private String baseUrl;

    @Value("${app.gemini.model}")
    private String model;

    public InterpretationResponse interpretLyrics(String lyrics, String apiKey) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalArgumentException("Gemini API 키가 필요합니다.");
        }

        String prompt = buildPrompt(lyrics);
        GeminiRequest request = GeminiRequest.of(prompt);

        try {
            WebClient webClient = webClientBuilder
                    .baseUrl(baseUrl)
                    .build();

            String endpoint = String.format("/models/%s:generateContent?key=%s", model, apiKey);

            GeminiResponse response = webClient.post()
                    .uri(endpoint)
                    .bodyValue(request)
                    .retrieve()
                    .onStatus(
                            status -> status.is4xxClientError() || status.is5xxServerError(),
                            clientResponse -> clientResponse.bodyToMono(String.class)
                                    .flatMap(errorBody -> {
                                        log.error("Gemini API error: {}", errorBody);
                                        return Mono.error(new RuntimeException("Gemini API 호출 실패: " + errorBody));
                                    }))
                    .bodyToMono(GeminiResponse.class)
                    .block();

            if (response == null) {
                throw new RuntimeException("Gemini API 응답이 없습니다.");
            }

            return parseInterpretation(response.getText());

        } catch (Exception e) {
            log.error("Failed to call Gemini API", e);
            throw new RuntimeException("가사 해석에 실패했습니다: " + e.getMessage(), e);
        }
    }

    private String buildPrompt(String lyrics) {
        return String.format("""
                다음 가사를 깊이 있게 분석하고 해석해주세요:

                %s

                다음 항목들을 포함하여 분석해주세요:
                1. interpretation: 전체적인 의미와 메시지 (2-3문장)
                2. themes: 주요 테마 (3-5개의 키워드)
                3. metaphors: 비유적 표현과 메타포 (2-3개)
                4. culturalContext: 문화적/시대적 맥락 (1-2문장)
                5. mood: 전체적인 분위기와 감정 (1문장)

                반드시 다음 JSON 형식으로만 답변해주세요 (다른 설명 없이):
                {
                  "interpretation": "...",
                  "themes": ["테마1", "테마2", "테마3"],
                  "metaphors": ["메타포1", "메타포2"],
                  "culturalContext": "...",
                  "mood": "..."
                }
                """, lyrics);
    }

    @SuppressWarnings("unchecked")
    private InterpretationResponse parseInterpretation(String text) {
        try {
            // JSON 부분만 추출 (```json 마크다운 제거)
            String jsonText = text.trim();
            if (jsonText.startsWith("```json")) {
                jsonText = jsonText.substring(7);
            }
            if (jsonText.startsWith("```")) {
                jsonText = jsonText.substring(3);
            }
            if (jsonText.endsWith("```")) {
                jsonText = jsonText.substring(0, jsonText.length() - 3);
            }
            jsonText = jsonText.trim();

            Map<String, Object> map = objectMapper.readValue(jsonText, Map.class);

            return InterpretationResponse.builder()
                    .interpretation((String) map.getOrDefault("interpretation", "해석 정보가 없습니다."))
                    .themes((List<String>) map.getOrDefault("themes", new ArrayList<>()))
                    .metaphors((List<String>) map.getOrDefault("metaphors", new ArrayList<>()))
                    .culturalContext((String) map.getOrDefault("culturalContext", ""))
                    .mood((String) map.getOrDefault("mood", ""))
                    .build();

        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", text, e);
            // 파싱 실패 시 원문을 interpretation에 넣어서 반환
            return InterpretationResponse.builder()
                    .interpretation(text)
                    .themes(new ArrayList<>())
                    .metaphors(new ArrayList<>())
                    .culturalContext("")
                    .mood("")
                    .build();
        }
    }
}
