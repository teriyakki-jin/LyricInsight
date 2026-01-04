package com.yegyu.lyricinsight.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yegyu.lyricinsight.api.dto.AnalysisCreateRequest;
import com.yegyu.lyricinsight.api.dto.AnalysisResponse;
import com.yegyu.lyricinsight.api.dto.AnalysisSummaryItem;
import com.yegyu.lyricinsight.common.NotFoundException;
import com.yegyu.lyricinsight.domain.Analysis;
import com.yegyu.lyricinsight.infra.ai.EmotionAiClient;
import com.yegyu.lyricinsight.infra.ai.dto.EmotionRequest;
import com.yegyu.lyricinsight.infra.ai.dto.EmotionResponse;
import com.yegyu.lyricinsight.repo.AnalysisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AnalysisService {

    private final AnalysisRepository repo;
    private final OpenAiLyricAnalyzer analyzer;
    private final ObjectMapper om;
    private final EmotionAiClient emotionAiClient;

    @Transactional
    public AnalysisResponse create(AnalysisCreateRequest req) {
        //req.getLyrics();

        String style = (req.getStyle() == null || req.getStyle().isBlank())
                ? "basic"
                : req.getStyle();

        // 1) 감정 모델 호출 (FastAPI)
        EmotionResponse emo = emotionAiClient
                .analyze(req.getLyrics())
                .block();

        String emotionJson;
        try {
            emotionJson = om.writeValueAsString(
                    emo != null && emo.getEmotions() != null
                            ? emo.getEmotions()
                            : List.of()
            );
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize emotion result", e);
        }


        Analysis saved = repo.save(
                Analysis.builder()
                        .lyrics(req.getLyrics())
                        .style(style)
                        .resultJson("{}")
                        .emotionJson(emotionJson)
                        .build()
        );

        // 3) 응답
        return AnalysisResponse.builder()
                .id(saved.getId())
                .createdAt(saved.getCreatedAt())
                .emotions(emo != null ? emo.getEmotions() : List.of())
                .build();
    }


    @Transactional(readOnly = true)
    public AnalysisResponse get(Long id) {
        Analysis a = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Analysis not found: " + id));

        // 1️⃣ emotionJson → List<EmotionItem>
        List<EmotionResponse.EmotionItem> emotions;
        try {
            emotions = om.readValue(
                    a.getEmotionJson(),
                    new com.fasterxml.jackson.core.type.TypeReference<
                            List<EmotionResponse.EmotionItem>>() {}
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse emotionJson for analysis " + id, e);
        }

        return AnalysisResponse.builder()
                .id(a.getId())
                .createdAt(a.getCreatedAt())
                .emotions(emotions)
                .build();
    }

    @Transactional(readOnly = true)
    public List<AnalysisSummaryItem> recent(int limit) {
        int size = Math.max(1, Math.min(limit, 50));
        return repo.findRecent(PageRequest.of(0, size)).stream()
                .map(a -> AnalysisSummaryItem.builder()
                        .id(a.getId())
                        .style(a.getStyle())
                        .createdAt(a.getCreatedAt())
                        .lyricsPreview(preview(a.getLyrics()))
                        .build())
                .toList();
    }

    private String preview(String lyrics) {
        if (lyrics == null) return "";
        String trimmed = lyrics.strip();
        if (trimmed.length() <= 120) return trimmed;
        return trimmed.substring(0, 117) + "...";
    }

    public EmotionResponse emotionTest(String text) {
        return emotionAiClient.analyze(text).block();

    }
}
