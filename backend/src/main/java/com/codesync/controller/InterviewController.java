package com.codesync.controller;

import com.codesync.model.*;
import com.codesync.repository.*;
import com.codesync.service.OpenAIService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/interviews")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InterviewController {

    private final InterviewRepository interviewRepository;
    private final RoomRepository roomRepository;
    private final DocumentRepository documentRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final OpenAIService aiService;

    @PostMapping("/{roomCode}/complete")
    public ResponseEntity<?> completeInterview(
            @PathVariable String roomCode,
            @RequestBody Map<String, String> payload,
            Authentication authentication
    ) {
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RuntimeException("Room not found with code: " + roomCode));

        Document document = documentRepository.findByRoomId(room.getId())
                .orElseThrow(() -> new RuntimeException("Document state not initialized for room"));

        // Compile chat transcript history
        List<Message> messages = messageRepository.findByRoomIdOrderByCreatedAtAsc(room.getId());
        StringBuilder chatTranscript = new StringBuilder();
        for (Message m : messages) {
            if ("CHAT".equals(m.getType())) {
                chatTranscript.append(m.getSender().getUsername())
                        .append(": ")
                        .append(m.getContent())
                        .append("\n");
            }
        }

        // Generate assessment report utilizing OpenAI models
        String scorecard = aiService.generateInterviewScorecard(
                document.getContent(),
                chatTranscript.toString(),
                document.getLanguage()
        );

        // Find or seed a new Interview record
        Interview interview = interviewRepository.findByRoomId(room.getId()).orElse(null);
        if (interview == null) {
            String username = authentication.getName();
            User interviewer = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("Interviewer not found"));
            
            // Candidate is creator or first joiner who is not interviewer
            User candidate = room.getCreator();
            
            interview = Interview.builder()
                    .room(room)
                    .interviewer(interviewer)
                    .candidate(candidate)
                    .title(room.getName())
                    .problemStatement("Standard Coding Assessment Task")
                    .status("IN_PROGRESS")
                    .build();
        }

        // Apply completed evaluation parameters
        interview.setCandidateFeedback(scorecard);
        interview.setEvaluationScore(8); // Standard evaluation score
        interview.setStatus("COMPLETED");
        interview.setEndedAt(LocalDateTime.now());
        if (interview.getStartedAt() == null) {
            interview.setStartedAt(room.getCreatedAt());
        }

        Interview savedInterview = interviewRepository.save(interview);

        Map<String, Object> response = new HashMap<>();
        response.put("scorecard", scorecard);
        response.put("score", savedInterview.getEvaluationScore());
        response.put("roomCode", roomCode);
        response.put("status", savedInterview.getStatus());
        response.put("endedAt", savedInterview.getEndedAt());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{roomCode}/scorecard")
    public ResponseEntity<?> getInterviewScorecard(@PathVariable String roomCode) {
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        Optional<Interview> interviewOpt = interviewRepository.findByRoomId(room.getId());
        if (interviewOpt.isEmpty() || !"COMPLETED".equals(interviewOpt.get().getStatus())) {
            return ResponseEntity.notFound().build();
        }

        Interview interview = interviewOpt.get();
        Map<String, Object> response = new HashMap<>();
        response.put("scorecard", interview.getCandidateFeedback());
        response.put("score", interview.getEvaluationScore());
        response.put("title", interview.getTitle());
        response.put("status", interview.getStatus());
        response.put("endedAt", interview.getEndedAt());
        response.put("interviewer", interview.getInterviewer().getUsername());
        response.put("candidate", interview.getCandidate().getUsername());

        return ResponseEntity.ok(response);
    }
}
