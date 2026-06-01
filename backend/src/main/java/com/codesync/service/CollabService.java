package com.codesync.service;

import com.codesync.dto.RoomRequest;
import com.codesync.dto.RoomResponse;
import com.codesync.model.*;
import com.codesync.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CollabService {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final RoomParticipantRepository participantRepository;
    private final DocumentRepository documentRepository;
    private final MessageRepository messageRepository;
    private final SessionPlaybackRepository playbackRepository;
    private final WhiteboardElementRepository whiteboardElementRepository;

    @Transactional
    public RoomResponse createRoom(RoomRequest request, String creatorUsername) {
        User creator = userRepository.findByUsername(creatorUsername)
                .orElseThrow(() -> new RuntimeException("Creator profile not found"));

        // Generate a clean LeetCode-like room code (e.g. abc-defg-hij)
        String roomCode = generateRoomCode();

        Room room = Room.builder()
                .roomCode(roomCode)
                .name(request.getName())
                .description(request.getDescription())
                .isPrivate(request.isPrivate())
                .passwordHash(request.getPassword() != null && !request.getPassword().isBlank() ? request.getPassword() : null)
                .status("ACTIVE")
                .creator(creator)
                .expiresAt(LocalDateTime.now().plusHours(12)) // Auto expires in 12 hours
                .build();

        Room savedRoom = roomRepository.save(room);

        // Bind creator as participant OWNER
        RoomParticipant participant = RoomParticipant.builder()
                .room(savedRoom)
                .user(creator)
                .joinedAt(LocalDateTime.now())
                .status("ACTIVE")
                .role("OWNER")
                .build();
        participantRepository.save(participant);

        // Seed initial Document with Python boilerplate
        Document document = Document.builder()
                .room(savedRoom)
                .language("python")
                .content("# Welcome to CodeSync AI!\n# Start coding collaboratively here.\n\ndef hello_world():\n    print(\"Hello, CodeSync AI!\")\n\nhello_world()\n")
                .version(1L)
                .build();
        Document savedDoc = documentRepository.save(document);

        return RoomResponse.builder()
                .id(savedRoom.getId())
                .roomCode(savedRoom.getRoomCode())
                .name(savedRoom.getName())
                .description(savedRoom.getDescription())
                .isPrivate(savedRoom.isPrivate())
                .status(savedRoom.getStatus())
                .creatorName(creator.getUsername())
                .activeLanguage(savedDoc.getLanguage())
                .activeContent(savedDoc.getContent())
                .documentVersion(savedDoc.getVersion())
                .createdAt(savedRoom.getCreatedAt())
                .build();
    }

    @Transactional
    public RoomResponse joinRoom(String roomCode, String username) {
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RuntimeException("Room with code " + roomCode + " not found"));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User profile not found"));

        // Check if already participant
        Optional<RoomParticipant> existingParticipant = participantRepository.findByRoomIdAndUserId(room.getId(), user.getId());
        if (existingParticipant.isEmpty()) {
            RoomParticipant participant = RoomParticipant.builder()
                    .room(room)
                    .user(user)
                    .joinedAt(LocalDateTime.now())
                    .status("ACTIVE")
                    .role("COLLABORATOR")
                    .build();
            participantRepository.save(participant);
        } else {
            RoomParticipant rp = existingParticipant.get();
            if ("LEFT".equals(rp.getStatus())) {
                rp.setStatus("ACTIVE");
                rp.setJoinedAt(LocalDateTime.now());
                participantRepository.save(rp);
            }
        }

        Document document = documentRepository.findByRoomId(room.getId())
                .orElseThrow(() -> new RuntimeException("Room document state not initialized"));

        return RoomResponse.builder()
                .id(room.getId())
                .roomCode(room.getRoomCode())
                .name(room.getName())
                .description(room.getDescription())
                .isPrivate(room.isPrivate())
                .status(room.getStatus())
                .creatorName(room.getCreator().getUsername())
                .activeLanguage(document.getLanguage())
                .activeContent(document.getContent())
                .documentVersion(document.getVersion())
                .createdAt(room.getCreatedAt())
                .build();
    }

    @Transactional
    public void leaveRoom(String roomCode, String username) {
        Room room = roomRepository.findByRoomCode(roomCode).orElse(null);
        if (room == null) return;

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return;

        participantRepository.findByRoomIdAndUserId(room.getId(), user.getId())
                .ifPresent(p -> {
                    p.setStatus("LEFT");
                    p.setLeftAt(LocalDateTime.now());
                    participantRepository.save(p);
                });
    }

    @Transactional
    public Document updateDocument(String roomCode, String language, String content, Long version, String username) {
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        Document doc = documentRepository.findByRoomId(room.getId())
                .orElseThrow(() -> new RuntimeException("Document state not initialized"));

        // Simple Operational Sync: Update content, bump version
        doc.setContent(content);
        if (language != null) {
            doc.setLanguage(language);
        }
        doc.setVersion(version + 1);
        Document savedDoc = documentRepository.save(doc);

        // Record for scrubbing playback log
        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            long offset = java.time.Duration.between(room.getCreatedAt(), LocalDateTime.now()).toMillis();
            SessionPlayback playback = SessionPlayback.builder()
                    .room(room)
                    .user(user)
                    .eventType("CODE_EDIT")
                    .payload("{\"content\":\"" + escapeJson(content) + "\",\"language\":\"" + doc.getLanguage() + "\",\"version\":" + doc.getVersion() + "}")
                    .timestampOffsetMs(offset)
                    .recordedAt(LocalDateTime.now())
                    .build();
            playbackRepository.save(playback);
        }

        return savedDoc;
    }

    @Transactional
    public Message saveChatMessage(String roomCode, String content, String senderUsername, String type) {
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        User sender = userRepository.findByUsername(senderUsername)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        Message message = Message.builder()
                .room(room)
                .sender(sender)
                .content(content)
                .type(type)
                .build();

        return messageRepository.save(message);
    }

    public List<Message> getChatHistory(String roomCode) {
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        return messageRepository.findByRoomIdOrderByCreatedAtAsc(room.getId());
    }

    public List<SessionPlayback> getPlaybackHistory(String roomCode) {
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        return playbackRepository.findByRoomIdOrderByTimestampOffsetMsAsc(room.getId());
    }

    public List<RoomParticipant> getActiveParticipants(String roomCode) {
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        return participantRepository.findActiveByRoomId(room.getId());
    }

    public List<RoomParticipant> getRoomHistory(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return participantRepository.findRoomsByUserId(user.getId());
    }

    @Transactional
    public WhiteboardElement saveWhiteboardElement(String roomCode, String elementId, String type, String pointsJson, String color, int strokeWidth) {
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        
        WhiteboardElement element = WhiteboardElement.builder()
                .id(elementId)
                .room(room)
                .type(type)
                .pointsJson(pointsJson)
                .color(color)
                .strokeWidth(strokeWidth)
                .build();
                
        return whiteboardElementRepository.save(element);
    }

    public List<WhiteboardElement> getWhiteboardElements(String roomCode) {
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        return whiteboardElementRepository.findByRoomIdOrderByCreatedAtAsc(room.getId());
    }

    @Transactional
    public void clearWhiteboardElements(String roomCode) {
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        whiteboardElementRepository.deleteByRoomId(room.getId());
    }

    private String generateRoomCode() {
        // Generates clean combinations: xxx-xxxx-xxx
        Random random = new Random();
        StringBuilder sb = new StringBuilder();
        String chars = "abcdefghijklmnopqrstuvwxyz";
        for (int i = 0; i < 3; i++) sb.append(chars.charAt(random.nextInt(26)));
        sb.append("-");
        for (int i = 0; i < 4; i++) sb.append(chars.charAt(random.nextInt(26)));
        sb.append("-");
        for (int i = 0; i < 3; i++) sb.append(chars.charAt(random.nextInt(26)));
        return sb.toString();
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
