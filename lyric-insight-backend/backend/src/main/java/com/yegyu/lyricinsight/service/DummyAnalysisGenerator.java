package com.yegyu.lyricinsight.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class DummyAnalysisGenerator {

    private final ObjectMapper om = new ObjectMapper();

    public ObjectNode generate(String lyrics, String style) {
        String trimmed = lyrics == null ? "" : lyrics.trim();
        String firstLine = trimmed.split("\\R", 2)[0];
        if (firstLine.length() > 80) firstLine = firstLine.substring(0, 80) + "...";

        ObjectNode root = om.createObjectNode();

        // Summary (3 lines)
        ArrayNode summary = om.createArrayNode();
        summary.add(switch (style.toLowerCase(Locale.ROOT)) {
            case "counselor" -> "이 가사는 감정을 억누르기보다 인정하고 흘려보내려는 과정을 담고 있어요.";
            case "friend" -> "솔직히 말해서, 이 노래는 마음 한구석이 저릿하게 만드는 타입이야.";
            case "concise" -> "핵심: 감정의 흔들림과 관계의 여운.";
            default -> "가사의 화자는 관계의 여운 속에서 자신을 되돌아보고 있습니다.";
        });
        summary.add("반복되는 이미지/상징을 통해 미련, 그리움, 또는 성장의 메시지를 강화합니다.");
        summary.add("특히 초반 구절이 전체 정서를 결정하며 후렴에서 감정이 최고조에 이릅니다.");

        root.set("summary", summary);

        // Emotions
        ArrayNode emotions = om.createArrayNode();
        emotions.add(emotion("슬픔", 0.72));
        emotions.add(emotion("그리움", 0.58));
        emotions.add(emotion("희망", 0.22));
        root.set("emotions", emotions);

        // Themes
        ArrayNode themes = om.createArrayNode();
        themes.add("이별");
        themes.add("미련");
        themes.add("자기성찰");
        root.set("themes", themes);

        // Highlights
        ArrayNode highlights = om.createArrayNode();
        highlights.add(highlight(firstLine.isBlank() ? "첫 줄(가사)..." : firstLine,
                "첫 구절은 화자의 현재 정서를 압축해 보여주는 장치로 작동합니다.",
                "초반에 정서를 고정해 이후 전개를 설득력 있게 만듭니다."));
        highlights.add(highlight("반복되는 표현(후렴) ...",
                "같은 문장을 반복하는 것은 감정이 쉽게 정리되지 않는 상태를 드러냅니다.",
                "반복은 집착/미련/그리움을 강조하는 전형적 장치입니다."));
        highlights.add(highlight("상징적인 이미지(비/밤/거리 등) ...",
                "풍경을 감정의 은유로 사용해, 말하지 않아도 느낌이 전달되게 합니다.",
                "‘환경=감정’ 매핑으로 몰입을 높입니다."));
        root.set("highlights", highlights);

        // Optional: line-by-line off for MVP
        root.put("styleUsed", style);
        return root;
    }

    private ObjectNode emotion(String label, double score) {
        ObjectNode e = om.createObjectNode();
        e.put("label", label);
        e.put("score", score);
        return e;
    }

    private ObjectNode highlight(String line, String meaning, String why) {
        ObjectNode h = om.createObjectNode();
        h.put("line", line);
        h.put("meaning", meaning);
        h.put("why", why);
        return h;
    }
}
