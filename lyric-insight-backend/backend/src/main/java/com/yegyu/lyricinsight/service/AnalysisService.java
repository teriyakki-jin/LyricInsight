package com.yegyu.lyricinsight.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yegyu.lyricinsight.api.dto.*;
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

import java.util.Comparator;
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
        // req.getLyrics();

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
                            : List.of());
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize emotion result", e);
        }

        // 2) 3줄 요약 생성 (Rule-based)
        List<String> summaryLines = generate3LineSummary(emo != null ? emo.getEmotions() : List.of());
        com.fasterxml.jackson.databind.node.ObjectNode resultObj = om.createObjectNode();
        com.fasterxml.jackson.databind.node.ArrayNode summaryArr = resultObj.putArray("summary");
        summaryLines.forEach(summaryArr::add);

        Analysis saved = repo.save(
                Analysis.builder()
                        .lyrics(req.getLyrics())
                        .style(style)
                        .resultJson(resultObj.toString())
                        .emotionJson(emotionJson)
                        .build());

        // 3) 응답
        return AnalysisResponse.builder()
                .id(saved.getId())
                .createdAt(saved.getCreatedAt())
                .emotions(emo != null ? emo.getEmotions() : List.of())
                .result(resultObj)
                .build();
    }

    @Transactional(readOnly = true)
    public AnalysisResponse get(Long id) {
        Analysis a = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Analysis not found: " + id));

        // 1️⃣ emotionJson → List<EmotionItem>
        List<EmotionResponse.EmotionItem> emotions;
        JsonNode resultNode = null;
        try {
            emotions = om.readValue(
                    a.getEmotionJson(),
                    new com.fasterxml.jackson.core.type.TypeReference<List<EmotionResponse.EmotionItem>>() {
                    });
            resultNode = om.readTree(a.getResultJson());
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse analysis data for " + id, e);
        }

        return AnalysisResponse.builder()
                .id(a.getId())
                .createdAt(a.getCreatedAt())
                .emotions(emotions)
                .result(resultNode)
                .build();
    }

    @Transactional(readOnly = true)
    public List<AnalysisSummaryItem> recent(int limit) {

        int size = Math.max(1, Math.min(limit, 50));
        return repo.findRecent(PageRequest.of(0, size)).stream()
                .map(a -> {

                    EmotionResponse.EmotionItem top = extractTopEmotion(a.getEmotionJson());

                    return AnalysisSummaryItem.builder()
                            .id(a.getId())
                            .style(a.getStyle())
                            .createdAt(a.getCreatedAt())
                            .lyricsPreview(preview(a.getLyrics()))
                            .topEmotionLabel(top != null ? top.getLabel() : null)
                            .topEmotionScore(top != null ? top.getScore() : null)
                            .build();
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public EmotionStatsResponse emotionStats(int limit) {
        int size = Math.max(1, Math.min(limit, 200)); // 통계는 좀 더 넉넉히
        var analyses = repo.findRecent(PageRequest.of(0, size));

        // label -> [count, scoreSum]
        java.util.Map<String, double[]> acc = new java.util.HashMap<>();

        for (var a : analyses) {
            var top = extractTopEmotion(a.getEmotionJson());
            if (top == null)
                continue;

            acc.computeIfAbsent(top.getLabel(), k -> new double[] { 0, 0 });
            acc.get(top.getLabel())[0] += 1; // count
            acc.get(top.getLabel())[1] += top.getScore(); // sum
        }

        var items = acc.entrySet().stream()
                .map(e -> {
                    int count = (int) e.getValue()[0];
                    double sum = e.getValue()[1];
                    return EmotionStatItem.builder()
                            .label(e.getKey())
                            .count(count)
                            .avgScore(count == 0 ? 0.0 : sum / count)
                            .build();
                })
                .sorted((a, b) -> Integer.compare(b.getCount(), a.getCount()))
                .toList();

        return EmotionStatsResponse.builder()
                .range(size)
                .items(items)
                .build();
    }

    private String preview(String lyrics) {
        if (lyrics == null)
            return "";
        String trimmed = lyrics.strip();
        if (trimmed.length() <= 120)
            return trimmed;
        return trimmed.substring(0, 117) + "...";
    }

    public EmotionResponse emotionTest(String text) {
        return emotionAiClient.analyze(text).block();

    }

    private EmotionResponse.EmotionItem extractTopEmotion(String emotionJson) {
        try {
            List<EmotionResponse.EmotionItem> list = om.readValue(
                    emotionJson == null ? "[]" : emotionJson,
                    new com.fasterxml.jackson.core.type.TypeReference<List<EmotionResponse.EmotionItem>>() {
                    });

            // 점수 높은 순으로 정렬 후 1개
            return list.stream()
                    .max(Comparator.comparingDouble(EmotionResponse.EmotionItem::getScore))
                    .orElse(null);

        } catch (Exception e) {
            return null;
        }
    }

    private String generateSummary(List<EmotionResponse.EmotionItem> emotions) {
        if (emotions == null || emotions.isEmpty())
            return "감정을 해석할 수 없습니다.";

        EmotionResponse.EmotionItem top = emotions.stream()
                .max(Comparator.comparingDouble(EmotionResponse.EmotionItem::getScore))
                .orElse(null);

        if (top == null)
            return "감정을 해석할 수 없습니다.";

        return switch (top.getLabel()) {
            case "불안/걱정" -> "이 가사는 불확실한 상황 속에서 느끼는 불안과 흔들리는 마음을 담고 있다.";
            case "슬픔" -> "이 가사는 상실과 이별에서 오는 깊은 슬픔을 표현하고 있다.";
            case "사랑" -> "상대에 대한 진한 애정과 감정의 몰입이 느껴진다.";
            default -> "복합적인 감정이 섬세하게 드러난 가사이다.";
        };
    }

    private List<String> generate3LineSummary(List<EmotionResponse.EmotionItem> emotions) {
        if (emotions == null || emotions.size() < 1) {
            return List.of(
                    "감정이 충분히 감지되지 않았습니다.",
                    "가사의 내용이 너무 짧거나 모호할 수 있습니다.",
                    "더 긴 가사를 입력해보세요.");
        }

        // Sort by score desc
        List<EmotionResponse.EmotionItem> sorted = emotions.stream()
                .sorted(Comparator.comparingDouble(EmotionResponse.EmotionItem::getScore).reversed())
                .toList();

        EmotionResponse.EmotionItem top1 = sorted.get(0);
        EmotionResponse.EmotionItem top2 = sorted.size() > 1 ? sorted.get(1) : null;
        EmotionResponse.EmotionItem top3 = sorted.size() > 2 ? sorted.get(2) : null;

        String line1 = String.format("가장 핵심적인 감정은 '%s'이며, 곡의 전반적인 분위기를 이끌고 있습니다.", top1.getLabel());

        String line2 = "뚜렷한 감정이 하나만 나타납니다.";
        if (top2 != null) {
            line2 = String.format("그 이면에는 '%s'의 정서가 자리 잡고 있어 감정의 깊이를 더합니다.", top2.getLabel());
        }

        String line3 = "단일 감정선으로 이루어진 직관적인 노래입니다.";
        if (top2 != null) {
            line3 = String.format("'%s'와 '%s'의 조화가 인상적이며, 청자에게 복합적인 여운을 남깁니다.", top1.getLabel(), top2.getLabel());
        }
        if (top3 != null && top3.getScore() > 0.1) {
            line3 = String.format("또한 '%s'의 느낌도 은은하게 배어 있어, 다채로운 감정선을 보여줍니다.", top3.getLabel());
        }

        return List.of(line1, line2, line3);
    }
}
