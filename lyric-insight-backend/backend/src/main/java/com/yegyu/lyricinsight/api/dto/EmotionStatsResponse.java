package com.yegyu.lyricinsight.api.dto;

import lombok.*;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class EmotionStatsResponse {
    private int range;
    private List<EmotionStatItem> items;
}
