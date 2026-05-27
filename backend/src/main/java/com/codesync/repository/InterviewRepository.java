package com.codesync.repository;

import com.codesync.model.Interview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, UUID> {
    Optional<Interview> findByRoomId(UUID roomId);
    List<Interview> findByInterviewerIdOrderByCreatedAtDesc(UUID interviewerId);
    List<Interview> findByCandidateIdOrderByCreatedAtDesc(UUID candidateId);
}
