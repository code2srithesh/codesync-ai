package com.codesync.repository;

import com.codesync.model.SessionPlayback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SessionPlaybackRepository extends JpaRepository<SessionPlayback, UUID> {
    List<SessionPlayback> findByRoomIdOrderByTimestampOffsetMsAsc(UUID roomId);
}
