package com.codesync.repository;

import com.codesync.model.RoomParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, UUID> {
    Optional<RoomParticipant> findByRoomIdAndUserId(UUID roomId, UUID userId);
    
    @Query("SELECT rp FROM RoomParticipant rp JOIN FETCH rp.user WHERE rp.room.id = :roomId AND rp.status = 'ACTIVE'")
    List<RoomParticipant> findActiveByRoomId(UUID roomId);
    
    @Query("SELECT rp FROM RoomParticipant rp JOIN FETCH rp.room WHERE rp.user.id = :userId ORDER BY rp.joinedAt DESC")
    List<RoomParticipant> findRoomsByUserId(UUID userId);

    @Query("SELECT rp FROM RoomParticipant rp JOIN FETCH rp.room JOIN FETCH rp.user WHERE rp.user.username = :username AND rp.status = 'ACTIVE'")
    List<RoomParticipant> findActiveByUsername(String username);
}
