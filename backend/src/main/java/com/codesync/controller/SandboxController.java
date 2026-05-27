package com.codesync.controller;

import com.codesync.dto.CodeExecutionRequest;
import com.codesync.dto.CodeExecutionResponse;
import com.codesync.service.SandboxExecutorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SandboxController {

    private final SandboxExecutorService executorService;

    @PostMapping("/{roomId}/execute")
    public ResponseEntity<CodeExecutionResponse> execute(
            @PathVariable String roomId,
            @Valid @RequestBody CodeExecutionRequest request,
            Authentication authentication
    ) {
        String username = authentication.getName();
        CodeExecutionResponse response = executorService.executeCode(request, username);
        return ResponseEntity.ok(response);
    }
}
