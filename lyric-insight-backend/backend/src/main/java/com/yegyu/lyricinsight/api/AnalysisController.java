package com.yegyu.lyricinsight.api;

import jakarta.validation.Valid;
import com.yegyu.lyricinsight.api.dto.*;
import com.yegyu.lyricinsight.service.AnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/analysis")
public class AnalysisController {

    private final AnalysisService service;

    @PostMapping
    public AnalysisResponse create(@Valid @RequestBody AnalysisCreateRequest req) {
        return service.create(req);
    }

    @GetMapping("/recent")
    public RecentAnalysesResponse recent(@RequestParam(defaultValue = "10") int limit) {
        return RecentAnalysesResponse.builder()
                .items(service.recent(limit))
                .build();
    }

    @GetMapping("/<built-in function id>")
    public AnalysisResponse get(@PathVariable Long id) {
        return service.get(id);
    }
}
