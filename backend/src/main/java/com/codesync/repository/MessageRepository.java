package com.codesync.repository;

import com.codesync.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {
    
    @Query("SELECT m FROM Message m JOIN FETCH m.sender WHERE m.room.id = :roomId ORDER BY m.createdAt ASC")
    List<Message> findByRoomIdOrderByCreatedAtAsc(UUID roomId);
}
