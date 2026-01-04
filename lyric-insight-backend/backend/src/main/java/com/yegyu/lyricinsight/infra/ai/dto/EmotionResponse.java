package com.yegyu.lyricinsight.infra.ai.dto;

import lombok.Getter;

import java.util.List;

@Getter
public class EmotionResponse {

    private List<EmotionItem> emotions;

    @Getter
    public static class EmotionItem {
        private String label;
        private Double score;
    }
}
