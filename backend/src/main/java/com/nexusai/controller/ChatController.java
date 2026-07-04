package com.nexusai.controller;

import com.nexusai.config.EnvConfig;
import com.nexusai.model.Conversation;
import com.nexusai.model.Message;
import com.nexusai.repository.ConversationRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ConversationRepository conversationRepository;
    private final EnvConfig envConfig;
    private final RestClient restClient;

    private static final Map<String, String> SYSTEM_PROMPTS = Map.of(
            "chat", "You are a brilliant, concise AI assistant. Be helpful, direct, and friendly.",
            "summarizer", "You are a master summarizer. Produce tight, well-structured summaries with key points. Use bullet points and headers.",
            "code", "You are an expert senior software engineer. Help with writing, debugging, and explaining code. Format all code in markdown code blocks.",
            "resume", "You are an elite career coach and ATS expert. Give specific actionable resume feedback: ATS score estimate, missing keywords, formatting issues, and rewritten bullet points.",
            "email", "You are a professional email writing expert. Write clear, concise, and professional emails. Always provide a subject line, greeting, body, and sign-off. Adapt tone based on context.",
            "grammar", "You are an expert editor and writing coach. Fix grammar, spelling, punctuation, and style issues. Explain the changes you made and suggest improvements to make the writing clearer and more professional.",
            "highlight", "You are a document analysis expert. When given any text, return it with important parts wrapped in these exact tags: Key facts: <mark type=\"fact\">text</mark> — Action items: <mark type=\"action\">text</mark> — Warnings: <mark type=\"warning\">text</mark> — Definitions: <mark type=\"definition\">text</mark> — Numbers/Dates: <mark type=\"number\">text</mark>. After the marked text, add a brief SUMMARY section listing all highlights by category."
    );

    public ChatController(ConversationRepository conversationRepository, EnvConfig envConfig) {
        this.conversationRepository = conversationRepository;
        this.envConfig = envConfig;
        this.restClient = RestClient.builder().build();
    }

    public static class ChatRequest {
        private String tool;
        private String message;

        public String getTool() {
            return tool;
        }

        public void setTool(String tool) {
            this.tool = tool;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(HttpServletRequest request, @RequestBody ChatRequest req) {
        String userId = (String) request.getAttribute("userId");
        String tool = req.getTool();
        String message = req.getMessage();

        if (tool == null || !SYSTEM_PROMPTS.containsKey(tool)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid tool"));
        }
        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message is required"));
        }
        if (message.length() > 10000) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message too long"));
        }

        try {
            // Find or create Conversation
            Conversation conversation = conversationRepository.findByUserIdAndTool(userId, tool)
                    .orElseGet(() -> {
                        Conversation conv = new Conversation();
                        conv.setUserId(userId);
                        conv.setTool(tool);
                        conv.setMessages(new ArrayList<>());
                        return conv;
                    });

            // Add user message
            Message userMessage = new Message("user", message.trim(), Instant.now());
            conversation.getMessages().add(userMessage);

            // Get last 20 messages
            List<Message> messagesList = conversation.getMessages();
            List<Message> recentMessages = messagesList.subList(Math.max(0, messagesList.size() - 20), messagesList.size());

            // Build request to Cloudflare Workers AI
            String url = String.format("https://api.cloudflare.com/client/v4/accounts/%s/ai/run/@cf/meta/llama-3.1-8b-instruct", envConfig.getCfAccountId());

            List<Map<String, String>> apiMessages = new ArrayList<>();
            apiMessages.add(Map.of("role", "system", "content", SYSTEM_PROMPTS.get(tool)));
            for (Message m : recentMessages) {
                apiMessages.add(Map.of("role", m.getRole(), "content", m.getContent()));
            }

            Map<String, Object> requestBody = Map.of(
                    "messages", apiMessages,
                    "max_tokens", 1500,
                    "temperature", 0.7
            );

            System.out.println("Calling Cloudflare Workers AI API...");
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
            String assistantReply = "No response generated.";
            if (responseBody != null && responseBody.containsKey("result")) {
                Map result = (Map) responseBody.get("result");
                if (result != null && result.containsKey("response")) {
                    assistantReply = (String) result.get("response");
                }
            }

            // Add assistant reply
            Message assistantMessage = new Message("assistant", assistantReply, Instant.now());
            conversation.getMessages().add(assistantMessage);
            conversation.setLastActive(Instant.now());

            conversationRepository.save(conversation);

            return ResponseEntity.ok(Map.of(
                    "reply", assistantReply,
                    "tool", tool,
                    "messageCount", conversation.getMessages().size()
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Failed to get response."));
        }
    }
}
