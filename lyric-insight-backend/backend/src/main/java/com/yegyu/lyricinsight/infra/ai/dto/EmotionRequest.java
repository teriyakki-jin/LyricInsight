package com.yegyu.lyricinsight.infra.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmotionRequest {

    private String text;
    private Double threshold;

    @JsonProperty("top_k")
    private Integer topK;

    
}
