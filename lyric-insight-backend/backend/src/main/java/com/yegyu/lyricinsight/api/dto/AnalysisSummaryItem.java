package com.yegyu.lyricinsight.api.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalysisSummaryItem {
    private Long id;
    private String style;
    private LocalDateTime createdAt;
    private String lyricsPreview;
}
