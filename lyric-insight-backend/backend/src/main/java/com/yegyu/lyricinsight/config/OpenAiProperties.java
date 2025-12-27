package com.yegyu.lyricinsight.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "app.openai")
public record OpenAiProperties(
        String apiKey,
        @DefaultValue("gpt-4o-mini") String model
) {
}
