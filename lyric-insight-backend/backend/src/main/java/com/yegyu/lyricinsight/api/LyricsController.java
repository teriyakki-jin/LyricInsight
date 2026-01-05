package com.yegyu.lyricinsight.api;

import com.yegyu.lyricinsight.service.CrawlerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/lyrics")
@RequiredArgsConstructor
public class LyricsController {

    private final CrawlerService crawlerService;

    @GetMapping("/search")
    public ResponseEntity<?> search(@RequestParam String artist, @RequestParam String title) {
        String lyrics = crawlerService.searchLyrics(artist, title);

        if (lyrics == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(Map.of("lyrics", lyrics));
    }
}
