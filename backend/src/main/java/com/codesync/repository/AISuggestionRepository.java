package com.codesync.repository;

import com.codesync.model.AISuggestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AISuggestionRepository extends JpaRepository<AISuggestion, UUID> {
    List<AISuggestion> findByRoomIdOrderByCreatedAtDesc(UUID roomId);
    List<AISuggestion> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
