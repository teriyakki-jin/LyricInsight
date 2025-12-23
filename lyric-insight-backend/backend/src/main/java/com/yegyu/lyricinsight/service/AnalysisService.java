package com.yegyu.lyricinsight.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yegyu.lyricinsight.api.dto.AnalysisCreateRequest;
import com.yegyu.lyricinsight.api.dto.AnalysisResponse;
import com.yegyu.lyricinsight.api.dto.AnalysisSummaryItem;
import com.yegyu.lyricinsight.common.NotFoundException;
import com.yegyu.lyricinsight.domain.Analysis;
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
    private final DummyAnalysisGenerator dummy;
    private final ObjectMapper om = new ObjectMapper();

    @Transactional
    public AnalysisResponse create(AnalysisCreateRequest req) {
        var resultNode = dummy.generate(req.getLyrics(), req.getStyle());

        String resultJson;
        try {
            resultJson = om.writeValueAsString(resultNode);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize result JSON");
        }

        Analysis saved = repo.save(Analysis.builder()
                .lyrics(req.getLyrics())
                .style(req.getStyle())
                .resultJson(resultJson)
                .build());

        return AnalysisResponse.builder()
                .id(saved.getId())
                .createdAt(saved.getCreatedAt())
                .result(resultNode)
                .build();
    }

    @Transactional(readOnly = true)
    public AnalysisResponse get(Long id) {
        Analysis a = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Analysis not found: " + id));

        JsonNode node;
        try {
            node = om.readTree(a.getResultJson());
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Corrupted result JSON for id=" + id);
        }

        return AnalysisResponse.builder()
                .id(a.getId())
                .createdAt(a.getCreatedAt())
                .result(node)
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
                        .build())
                .toList();
    }
}
