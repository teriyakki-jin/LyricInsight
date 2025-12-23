package com.yegyu.lyricinsight.common;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiError {
    private String message;
    private LocalDateTime timestamp;
}
