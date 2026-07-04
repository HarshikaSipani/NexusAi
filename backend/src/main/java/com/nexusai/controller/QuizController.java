package com.nexusai.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexusai.config.EnvConfig;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quiz")
public class QuizController {

    private final EnvConfig envConfig;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public QuizController(EnvConfig envConfig) {
        this.envConfig = envConfig;
        this.restClient = RestClient.builder().build();
        this.objectMapper = new ObjectMapper();
    }

    public static class QuizRequest {
        private String topic;
        private String difficulty = "medium";
        private int count = 5;

        public String getTopic() {
            return topic;
        }

        public void setTopic(String topic) {
            this.topic = topic;
        }

        public String getDifficulty() {
            return difficulty;
        }

        public void setDifficulty(String difficulty) {
            this.difficulty = difficulty;
        }

        public int getCount() {
            return count;
        }

        public void setCount(int count) {
            this.count = count;
        }
    }

    public static class FlashcardRequest {
        private String topic;

        public String getTopic() {
            return topic;
        }

        public void setTopic(String topic) {
            this.topic = topic;
        }
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateQuiz(@RequestBody QuizRequest req) {
        if (req.getTopic() == null || req.getTopic().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Topic is required"));
        }

        String prompt = String.format(
                "Generate a %s difficulty quiz about \"%s\" with exactly %d multiple choice questions.\n" +
                "Return ONLY valid JSON, no other text:\n" +
                "{\n" +
                "  \"title\": \"Quiz title\",\n" +
                "  \"questions\": [\n" +
                "    {\n" +
                "      \"question\": \"Question?\",\n" +
                "      \"options\": [\"A\", \"B\", \"C\", \"D\"],\n" +
                "      \"correct\": 0,\n" +
                "      \"explanation\": \"Why this is correct\"\n" +
                "    }\n" +
                "  ]\n" +
                "}", req.getDifficulty(), req.getTopic(), req.getCount()
        );

        try {
            String url = String.format("https://api.cloudflare.com/client/v4/accounts/%s/ai/run/@cf/meta/llama-3.1-8b-instruct", envConfig.getCfAccountId());

            Map<String, Object> requestBody = Map.of(
                    "messages", List.of(
                            Map.of("role", "system", "content", "You are a quiz generator. Respond with valid JSON only, no markdown."),
                            Map.of("role", "user", "content", prompt)
                    ),
                    "max_tokens", 2000,
                    "temperature", 0.7
            );

            ResponseEntity<Map> responseEntity = restClient.post()
                    .uri(url)
                    .header("Authorization", "Bearer " + envConfig.getCfApiToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .toEntity(Map.class);

            if (!responseEntity.getStatusCode().is2xxSuccessful()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "AI API error: Status " + responseEntity.getStatusCode()));
            }

            Map responseBody = responseEntity.getBody();
            String text = "";
            if (responseBody != null && responseBody.containsKey("result")) {
                Map result = (Map) responseBody.get("result");
                if (result != null && result.containsKey("response")) {
                    Object responseObj = result.get("response");
                    if (responseObj instanceof String) {
                        text = (String) responseObj;
                    } else if (responseObj != null) {
                        text = objectMapper.writeValueAsString(responseObj);
                    }
                }
            }

            String jsonText = cleanAndExtractJson(text);
            if (jsonText.isEmpty()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Could not parse quiz"));
            }

            Map<?, ?> quizMap = objectMapper.readValue(jsonText, Map.class);
            return ResponseEntity.ok(Map.of("quiz", quizMap));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to generate quiz: " + e.getMessage()));
        }
    }

    @PostMapping("/flashcards")
    public ResponseEntity<?> generateFlashcards(@RequestBody FlashcardRequest req) {
        if (req.getTopic() == null || req.getTopic().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Topic is required"));
        }

        String prompt = String.format(
                "Generate exactly 8 flashcards about \"%s\".\n" +
                "Return ONLY valid JSON, no other text:\n" +
                "{\n" +
                "  \"cards\": [\n" +
                "    {\"front\": \"question or term here\", \"back\": \"answer or definition here\"}\n" +
                "  ]\n" +
                "}", req.getTopic()
        );

        try {
            String url = String.format("https://api.cloudflare.com/client/v4/accounts/%s/ai/run/@cf/meta/llama-3.1-8b-instruct", envConfig.getCfAccountId());

            Map<String, Object> requestBody = Map.of(
                    "messages", List.of(
                            Map.of("role", "system", "content", "You are a flashcard generator. Respond with valid JSON only, no markdown, no explanation."),
                            Map.of("role", "user", "content", prompt)
                    ),
                    "max_tokens", 1500,
                    "temperature", 0.7
            );

            ResponseEntity<Map> responseEntity = restClient.post()
                    .uri(url)
                    .header("Authorization", "Bearer " + envConfig.getCfApiToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .toEntity(Map.class);

            if (!responseEntity.getStatusCode().is2xxSuccessful()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "AI API error: Status " + responseEntity.getStatusCode()));
            }

            Map responseBody = responseEntity.getBody();
            String text = "";
            if (responseBody != null && responseBody.containsKey("result")) {
                Map result = (Map) responseBody.get("result");
                if (result != null && result.containsKey("response")) {
                    Object responseObj = result.get("response");
                    if (responseObj instanceof String) {
                        text = (String) responseObj;
                    } else if (responseObj != null) {
                        text = objectMapper.writeValueAsString(responseObj);
                    }
                }
            }

            String jsonText = cleanAndExtractJson(text);
            if (jsonText.isEmpty()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Could not parse flashcards"));
            }

            Map<?, ?> parsedMap = objectMapper.readValue(jsonText, Map.class);
            Object cards = parsedMap.get("cards");
            return ResponseEntity.ok(Map.of("cards", cards != null ? cards : List.of()));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to generate flashcards: " + e.getMessage()));
        }
    }

    private String cleanAndExtractJson(String text) {
        if (text == null) return "";
        // Remove markdown code fences
        text = text.replaceAll("(?i)```json\\s*", "");
        text = text.replaceAll("(?i)```\\s*", "");
        text = text.trim();

        // Extract JSON substring { ... }
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start != -1 && end != -1 && end > start) {
            return text.substring(start, end + 1);
        }
        return text;
    }
}
