package com.yegyu.lyricinsight.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalysisResponse {
    private Long id;
    private LocalDateTime createdAt;
    private JsonNode result;
}
