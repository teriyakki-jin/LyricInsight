package com.yegyu.lyricinsight.api.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class EmotionStatItem {
    private String label;
    private int count;
    private double avgScore;
}
