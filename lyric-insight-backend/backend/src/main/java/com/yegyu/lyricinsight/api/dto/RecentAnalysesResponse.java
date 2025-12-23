package com.yegyu.lyricinsight.api.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecentAnalysesResponse {
    private List<AnalysisSummaryItem> items;
}
