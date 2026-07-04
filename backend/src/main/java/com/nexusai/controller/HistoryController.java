package com.nexusai.controller;

import com.nexusai.model.Conversation;
import com.nexusai.repository.ConversationRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/history")
public class HistoryController {

    private final ConversationRepository conversationRepository;

    private static final List<String> VALID_TOOLS = List.of(
            "chat", "summarizer", "code", "resume", "email", "grammar", "highlight"
    );

    public HistoryController(ConversationRepository conversationRepository) {
        this.conversationRepository = conversationRepository;
    }

    @GetMapping("/{tool}")
    public ResponseEntity<?> getHistory(HttpServletRequest request, @PathVariable String tool) {
        String userId = (String) request.getAttribute("userId");
        if (!VALID_TOOLS.contains(tool)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid tool"));
        }
        try {
            Optional<Conversation> conv = conversationRepository.findByUserIdAndTool(userId, tool);
            Map<String, Object> response = new HashMap<>();
            response.put("tool", tool);
            if (conv.isEmpty()) {
                response.put("messages", List.of());
                response.put("lastActive", null);
            } else {
                Conversation c = conv.get();
                response.put("messages", c.getMessages());
                response.put("lastActive", c.getLastActive());
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to load history"));
        }
    }

    @GetMapping
    public ResponseEntity<?> getHistorySummary(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        try {
            List<Conversation> conversations = conversationRepository.findByUserId(userId);
            List<Map<String, Object>> summary = new ArrayList<>();
            
            for (String tool : VALID_TOOLS) {
                Conversation match = conversations.stream()
                        .filter(c -> tool.equals(c.getTool()))
                        .findFirst()
                        .orElse(null);
                
                Map<String, Object> item = new HashMap<>();
                item.put("tool", tool);
                item.put("messageCount", match != null ? match.getMessages().size() : 0);
                item.put("lastActive", match != null ? match.getLastActive() : null);
                summary.add(item);
            }
            return ResponseEntity.ok(Map.of("summary", summary));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to load summary"));
        }
    }

    @DeleteMapping("/{tool}")
    public ResponseEntity<?> clearHistory(HttpServletRequest request, @PathVariable String tool) {
        String userId = (String) request.getAttribute("userId");
        if (!VALID_TOOLS.contains(tool)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid tool"));
        }
        try {
            Optional<Conversation> convOpt = conversationRepository.findByUserIdAndTool(userId, tool);
            if (convOpt.isPresent()) {
                Conversation conv = convOpt.get();
                conv.getMessages().clear();
                conv.setLastActive(Instant.now());
                conversationRepository.save(conv);
            }
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to clear history"));
        }
    }

    @DeleteMapping
    public ResponseEntity<?> clearAllHistory(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        try {
            conversationRepository.deleteByUserId(userId);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to clear all history"));
        }
    }
}
