package com.yegyu.lyricinsight.infra.gemini.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterpretationResponse {
    private String interpretation;
    private List<String> themes;
    private List<String> metaphors;
    private String culturalContext;
    private String mood;
}
