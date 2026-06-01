package com.codesync.controller;

import com.codesync.model.Message;
import com.codesync.service.CollabService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class WSCollabController {

    private final CollabService collabService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Handles real-time incremental code synchronization.
     * Maps to client sending: /app/room/{roomCode}/code-update
     */
    @MessageMapping("/room/{roomCode}/code-update")
    public void handleCodeUpdate(
            @DestinationVariable String roomCode,
            @Payload Map<String, Object> payload,
            Principal principal
    ) {
        String username = principal != null ? principal.getName() : "Anonymous";
        String content = (String) payload.get("content");
        String language = (String) payload.get("language");
        Number versionNum = (Number) payload.get("version");
        Long version = versionNum != null ? versionNum.longValue() : 0L;

        // Save new content in DB & get updated version
        try {
            collabService.updateDocument(roomCode, language, content, version, username);
        } catch (Exception e) {
            // Concurrent modification error fallback.
        }

        // Broadcast to all users subscribing to /topic/room/{roomCode}/code
        Map<String, Object> response = new HashMap<>();
        response.put("sender", username);
        response.put("content", content);
        response.put("language", language);
        response.put("version", version + 1);
        response.put("timestamp", LocalDateTime.now().toString());

        messagingTemplate.convertAndSend("/topic/room/" + roomCode + "/code", response);
    }

    /**
     * Coordinates cursors and text selections.
     * Maps to client sending: /app/room/{roomCode}/cursor-update
     */
    @MessageMapping("/room/{roomCode}/cursor-update")
    @SendTo("/topic/room/{roomCode}/cursors")
    public Map<String, Object> handleCursorUpdate(
            @DestinationVariable String roomCode,
            @Payload Map<String, Object> payload,
            Principal principal
    ) {
        String username = principal != null ? principal.getName() : "Anonymous";
        Map<String, Object> response = new HashMap<>(payload);
        response.put("username", username);
        return response;
    }

    /**
     * Distributes active room conversations.
     * Maps to client sending: /app/room/{roomCode}/chat-send
     */
    @MessageMapping("/room/{roomCode}/chat-send")
    public void handleChatMessage(
            @DestinationVariable String roomCode,
            @Payload Map<String, Object> payload,
            Principal principal
    ) {
        String username = principal != null ? principal.getName() : "Anonymous";
        String content = (String) payload.get("content");
        String type = (String) payload.get("type"); // CHAT, SYSTEM

        Message msg = collabService.saveChatMessage(roomCode, content, username, type != null ? type : "CHAT");

        Map<String, Object> broadcast = new HashMap<>();
        broadcast.put("id", msg.getId());
        broadcast.put("sender", username);
        broadcast.put("senderRole", msg.getSender().getRole().name());
        broadcast.put("content", content);
        broadcast.put("type", msg.getType());
        broadcast.put("createdAt", msg.getCreatedAt().toString());

        messagingTemplate.convertAndSend("/topic/room/" + roomCode + "/chat", broadcast);
    }

    @MessageMapping("/room/{roomCode}/whiteboard-draw")
    @SendTo("/topic/room/{roomCode}/whiteboard")
    public Map<String, Object> handleWhiteboardDraw(
            @DestinationVariable String roomCode,
            @Payload Map<String, Object> payload,
            Principal principal
    ) {
        String username = principal != null ? principal.getName() : "Anonymous";
        
        String action = (String) payload.get("action");
        if ("DRAW".equals(action)) {
            @SuppressWarnings("unchecked")
            Map<String, Object> elementMap = (Map<String, Object>) payload.get("element");
            if (elementMap != null) {
                String id = (String) elementMap.get("id");
                String type = (String) elementMap.get("type");
                String color = (String) elementMap.get("color");
                Number strokeWidthNum = (Number) elementMap.get("strokeWidth");
                int strokeWidth = strokeWidthNum != null ? strokeWidthNum.intValue() : 3;
                Object pointsObj = elementMap.get("points");
                String pointsJson = "";
                try {
                    pointsJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(pointsObj);
                } catch (Exception e) {
                    // Fail-safe serializations fallback
                }
                collabService.saveWhiteboardElement(roomCode, id, type, pointsJson, color, strokeWidth);
            }
        } else if ("CLEAR".equals(action)) {
            collabService.clearWhiteboardElements(roomCode);
        }

        Map<String, Object> response = new HashMap<>(payload);
        response.put("sender", username);
        return response;
    }

    /**
     * Routes Peer-to-Peer WebRTC voice/video signals.
     * Maps to client sending: /app/room/{roomCode}/webrtc-signal
     */
    @MessageMapping("/room/{roomCode}/webrtc-signal")
    @SendTo("/topic/room/{roomCode}/webrtc")
    public Map<String, Object> handleWebRTCSignal(
            @DestinationVariable String roomCode,
            @Payload Map<String, Object> payload,
            Principal principal
    ) {
        String username = principal != null ? principal.getName() : "Anonymous";
        Map<String, Object> response = new HashMap<>(payload);
        response.put("sender", username);
        return response;
    }
}
