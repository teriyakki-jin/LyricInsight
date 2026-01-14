package com.yegyu.lyricinsight.infra.ai.dto;

import lombok.Getter;

import java.util.List;

@Getter
@lombok.AllArgsConstructor
@lombok.NoArgsConstructor
public class EmotionResponse {

    private List<EmotionItem> emotions;
    private List<WordEmotionItem> word_emotions;
    private List<HighlightItem> highlights;

    @Getter
    public static class EmotionItem {
        private String label;
        private Double score;
    }

    @Getter
    public static class WordEmotionItem {
        private String word;
        private String emotion;
        private Double score;
        private String explanation;
    }

    @Getter
    public static class HighlightItem {
        private String line;
        private String meaning;
        private String why;
    }
}
