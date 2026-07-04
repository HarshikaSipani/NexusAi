package com.nexusai.controller;

import com.nexusai.model.Note;
import com.nexusai.repository.NoteRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private final NoteRepository noteRepository;

    public NoteController(NoteRepository noteRepository) {
        this.noteRepository = noteRepository;
    }

    public static class NoteRequest {
        private String title;
        private String content;

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }

    @GetMapping
    public ResponseEntity<?> getNotes(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        try {
            List<Note> notes = noteRepository.findByUserIdOrderByUpdatedAtDesc(userId);
            return ResponseEntity.ok(Map.of("notes", notes));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to fetch notes"));
        }
    }

    @PostMapping
    public ResponseEntity<?> createNote(HttpServletRequest request, @RequestBody NoteRequest req) {
        String userId = (String) request.getAttribute("userId");
        try {
            Note note = new Note();
            note.setUserId(userId);
            note.setTitle(req.getTitle() != null ? req.getTitle() : "Untitled");
            note.setContent(req.getContent() != null ? req.getContent() : "");
            Note saved = noteRepository.save(note);
            return ResponseEntity.ok(Map.of("note", saved));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to create note"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateNote(HttpServletRequest request, @PathVariable String id, @RequestBody NoteRequest req) {
        String userId = (String) request.getAttribute("userId");
        try {
            Optional<Note> existing = noteRepository.findByIdAndUserId(id, userId);
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Note not found"));
            }
            Note note = existing.get();
            if (req.getTitle() != null) note.setTitle(req.getTitle());
            if (req.getContent() != null) note.setContent(req.getContent());
            Note saved = noteRepository.save(note);
            return ResponseEntity.ok(Map.of("note", saved));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to update note"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNote(HttpServletRequest request, @PathVariable String id) {
        String userId = (String) request.getAttribute("userId");
        try {
            Optional<Note> existing = noteRepository.findByIdAndUserId(id, userId);
            if (existing.isPresent()) {
                noteRepository.delete(existing.get());
            }
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to delete note"));
        }
    }
}
