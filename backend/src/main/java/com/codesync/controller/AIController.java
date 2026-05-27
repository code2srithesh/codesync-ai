package com.codesync.controller;

import com.codesync.dto.AIQueryRequest;
import com.codesync.dto.AIQueryResponse;
import com.codesync.service.OpenAIService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AIController {

    private final OpenAIService aiService;

    @PostMapping("/{roomId}/ai-query")
    public ResponseEntity<AIQueryResponse> getSuggestions(
            @PathVariable String roomId,
            @Valid @RequestBody AIQueryRequest request,
            Authentication authentication
    ) {
        String username = authentication.getName();
        AIQueryResponse response = aiService.getAISuggestions(roomId, request, username);
        return ResponseEntity.ok(response);
    }
}
