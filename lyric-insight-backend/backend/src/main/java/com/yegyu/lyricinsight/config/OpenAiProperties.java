package com.yegyu.lyricinsight.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.openai")
public record OpenAiProperties(
                String apiKey,
                String model,
                boolean enabled) {
}
