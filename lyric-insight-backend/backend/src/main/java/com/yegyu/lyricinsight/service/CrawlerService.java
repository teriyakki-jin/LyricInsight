package com.yegyu.lyricinsight.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class CrawlerService {

    private static final String SEARCH_URL = "https://music.bugs.co.kr/search/track?q=";

    public String searchLyrics(String artist, String title) {
        try {
            String query = artist + " " + title;
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String searchUrl = SEARCH_URL + encodedQuery;

            log.info("Searching lyrics for query: {}", query);

            Document searchDoc = Jsoup.connect(searchUrl)
                    .userAgent("Mozilla/5.0")
                    .get();

            // Generic Fallback: Search for any link that looks like a track detail link
            // Bugs track URLs are typically: https://music.bugs.co.kr/track/12345...
            String trackId = null;
            for (Element link : searchDoc.select("a[href*='/track/']")) {
                String href = link.attr("href");
                // Ensure it's a track link and appears to have an ID
                if (href.matches(".*\\/track\\/\\d+.*")) {
                    // Extract ID
                    // href might be "https://music.bugs.co.kr/track/30568338?wl_ref=list_tr_08_ab"
                    // or just "/track/30568338"
                    try {
                        String[] parts = href.split("/track/");
                        if (parts.length > 1) {
                            String idPart = parts[1].split("\\?")[0];
                            if (idPart.matches("\\d+")) {
                                trackId = idPart;
                                log.info("Found track ID from link: {}", href);
                                break; // Found the first matching track
                            }
                        }
                    } catch (Exception e) {
                        log.warn("Failed to parse track ID from href: {}", href);
                    }
                }
            }

            if (trackId == null || trackId.isEmpty()) {
                log.warn("No track found for query: {} (Html length: {})", query, searchDoc.html().length());
                // For debugging: log part of html if needed, or just warn.
                return null;
            }

            String detailUrl = "https://music.bugs.co.kr/track/" + trackId;
            log.info("Found track ID: {}, fetching detail: {}", trackId, detailUrl);

            Document detailDoc = Jsoup.connect(detailUrl)
                    .userAgent("Mozilla/5.0")
                    .get();

            Element lyricsContainer = detailDoc.selectFirst(".lyricsContainer xmp");
            // Sometimes it's in <div class="lyricsContainer"><p>...</p></div> or <xmp>
            if (lyricsContainer == null) {
                lyricsContainer = detailDoc.selectFirst(".lyricsContainer");
            }

            if (lyricsContainer == null) {
                log.warn("No lyrics found in page: {}", detailUrl);
                return null;
            }

            String lyrics = lyricsContainer.wholeText();
            if (lyrics == null || lyrics.isBlank()) {
                lyrics = lyricsContainer.html().replace("<br>", "\n").replaceAll("<[^>]*>", "");
            }

            return lyrics.trim();

        } catch (IOException e) {
            log.error("Failed to crawl lyrics", e);
            return null;
        }
    }
}
