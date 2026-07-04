package com.nexusai.repository;

import com.nexusai.model.Conversation;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends MongoRepository<Conversation, String> {
    Optional<Conversation> findByUserIdAndTool(String userId, String tool);
    List<Conversation> findByUserId(String userId);
    void deleteByUserId(String userId);
}
