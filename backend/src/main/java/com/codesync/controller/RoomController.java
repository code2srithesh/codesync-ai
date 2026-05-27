package com.codesync.controller;

import com.codesync.dto.RoomRequest;
import com.codesync.dto.RoomResponse;
import com.codesync.model.Message;
import com.codesync.model.RoomParticipant;
import com.codesync.model.SessionPlayback;
import com.codesync.service.CollabService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RoomController {

    private final CollabService collabService;

    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(
            @Valid @RequestBody RoomRequest request,
            Authentication authentication
    ) {
        String username = authentication.getName();
        RoomResponse response = collabService.createRoom(request, username);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{roomCode}")
    public ResponseEntity<RoomResponse> joinRoom(
            @PathVariable String roomCode,
            Authentication authentication
    ) {
        String username = authentication.getName();
        RoomResponse response = collabService.joinRoom(roomCode, username);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<?> getRoomHistory(Authentication authentication) {
        String username = authentication.getName();
        List<RoomParticipant> participants = collabService.getRoomHistory(username);
        
        List<Map<String, Object>> list = new ArrayList<>();
        for (RoomParticipant rp : participants) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", rp.getId());
            map.put("roomCode", rp.getRoom().getRoomCode());
            map.put("name", rp.getRoom().getName());
            map.put("description", rp.getRoom().getDescription());
            map.put("role", rp.getRole());
            map.put("joinedAt", rp.getJoinedAt());
            map.put("creator", rp.getRoom().getCreator().getUsername());
            list.add(map);
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{roomCode}/chat")
    public ResponseEntity<List<Map<String, Object>>> getChatHistory(@PathVariable String roomCode) {
        List<Message> messages = collabService.getChatHistory(roomCode);
        List<Map<String, Object>> list = new ArrayList<>();
        for (Message m : messages) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("sender", m.getSender().getUsername());
            map.put("senderRole", m.getSender().getRole().name());
            map.put("content", m.getContent());
            map.put("type", m.getType());
            map.put("createdAt", m.getCreatedAt());
            list.add(map);
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{roomCode}/playback")
    public ResponseEntity<List<Map<String, Object>>> getPlaybackHistory(@PathVariable String roomCode) {
        List<SessionPlayback> playbacks = collabService.getPlaybackHistory(roomCode);
        List<Map<String, Object>> list = new ArrayList<>();
        for (SessionPlayback sp : playbacks) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", sp.getId());
            map.put("user", sp.getUser().getUsername());
            map.put("eventType", sp.getEventType());
            map.put("payload", sp.getPayload());
            map.put("timestampOffsetMs", sp.getTimestampOffsetMs());
            map.put("recordedAt", sp.getRecordedAt());
            list.add(map);
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{roomCode}/participants")
    public ResponseEntity<List<Map<String, Object>>> getActiveParticipants(@PathVariable String roomCode) {
        List<RoomParticipant> participants = collabService.getActiveParticipants(roomCode);
        List<Map<String, Object>> list = new ArrayList<>();
        for (RoomParticipant rp : participants) {
            Map<String, Object> map = new HashMap<>();
            map.put("username", rp.getUser().getUsername());
            map.put("role", rp.getRole());
            map.put("joinedAt", rp.getJoinedAt());
            list.add(map);
        }
        return ResponseEntity.ok(list);
    }
}
