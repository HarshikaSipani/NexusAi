package com.nexusai.model;

import java.time.Instant;

public class Message {
    private String role; // "user" or "assistant"
    private String content;
    private Instant createdAt = Instant.now();

    public Message() {
    }

    public Message(String role, String content) {
        this.role = role;
        this.content = content;
        this.createdAt = Instant.now();
    }

    public Message(String role, String content, Instant createdAt) {
        this.role = role;
        this.content = content;
        this.createdAt = createdAt;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
