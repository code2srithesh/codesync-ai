package com.codesync.repository;

import com.codesync.model.WhiteboardElement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WhiteboardElementRepository extends JpaRepository<WhiteboardElement, String> {
    List<WhiteboardElement> findByRoomIdOrderByCreatedAtAsc(UUID roomId);
    void deleteByRoomId(UUID roomId);
}
