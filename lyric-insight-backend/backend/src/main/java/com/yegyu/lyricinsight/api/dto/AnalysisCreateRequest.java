package com.yegyu.lyricinsight.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AnalysisCreateRequest {

    @NotBlank
    @Size(max = 20000)
    private String lyrics;

    @NotBlank
    @Size(max = 40)
    private String style; // critic, counselor, friend, concise
}
