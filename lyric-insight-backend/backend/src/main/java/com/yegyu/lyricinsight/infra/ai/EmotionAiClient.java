package com.yegyu.lyricinsight.infra.ai;

import com.yegyu.lyricinsight.infra.ai.dto.EmotionRequest;
import com.yegyu.lyricinsight.infra.ai.dto.EmotionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class EmotionAiClient {

    private final WebClient aiWebClient;

    public Mono<EmotionResponse> analyze(String text) {
        EmotionRequest req = EmotionRequest.builder()
                .text(text)
                .threshold(0.25)
                .topK(3)
                .build();



        return aiWebClient.post()
                .uri("/emotion")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .retrieve()
                .bodyToMono(EmotionResponse.class);
    }
}
