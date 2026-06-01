package com.codesync.service;

import com.codesync.dto.CodeExecutionRequest;
import com.codesync.dto.CodeExecutionResponse;
import com.codesync.model.User;
import com.codesync.model.UserAnalytics;
import com.codesync.repository.UserAnalyticsRepository;
import com.codesync.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SandboxExecutorServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserAnalyticsRepository analyticsRepository;

    @InjectMocks
    private SandboxExecutorService sandboxExecutorService;

    @Test
    public void testExecuteCode_Success_WithAnalytics() {
        // Arrange
        String username = "testuser";
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .username(username)
                .email("testuser@codesync.com")
                .build();

        UserAnalytics analytics = UserAnalytics.builder()
                .id(UUID.randomUUID())
                .user(user)
                .totalSessionsJoined(5)
                .pythonExecutionsCount(10)
                .build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(analyticsRepository.findByUserId(userId)).thenReturn(Optional.of(analytics));

        CodeExecutionRequest request = new CodeExecutionRequest("python", "print('hello')", "");

        // Act
        CodeExecutionResponse response = sandboxExecutorService.executeCode(request, username);

        // Assert
        assertNotNull(response);
        assertEquals("SUCCESS", response.getStatus());
        assertTrue(response.getOutput().contains("Hello, CodeSync AI!"));
        verify(userRepository, times(1)).findByUsername(username);
        verify(analyticsRepository, times(1)).findByUserId(userId);
        verify(analyticsRepository, times(1)).save(any(UserAnalytics.class));
        assertEquals(6, analytics.getTotalSessionsJoined());
        assertEquals(11, analytics.getPythonExecutionsCount());
    }

    @Test
    public void testExecuteCode_Success_NoAnalytics() {
        // Arrange
        String username = "unknownuser";
        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        CodeExecutionRequest request = new CodeExecutionRequest("javascript", "console.log('hello')", "");

        // Act
        CodeExecutionResponse response = sandboxExecutorService.executeCode(request, username);

        // Assert
        assertNotNull(response);
        assertEquals("SUCCESS", response.getStatus());
        assertTrue(response.getOutput().contains("Hello, CodeSync AI!"));
        verify(userRepository, times(1)).findByUsername(username);
        verify(analyticsRepository, never()).findByUserId(any(UUID.class));
        verify(analyticsRepository, never()).save(any(UserAnalytics.class));
    }

    @Test
    public void testExecuteCode_Timeout() {
        // Arrange
        String username = "testuser";
        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        CodeExecutionRequest request = new CodeExecutionRequest("python", "while True:\n    pass", "");

        // Act
        CodeExecutionResponse response = sandboxExecutorService.executeCode(request, username);

        // Assert
        assertNotNull(response);
        assertEquals("TIMEOUT", response.getStatus());
        assertTrue(response.getOutput().contains("timed out"));
    }

    @Test
    public void testExecuteCode_CompileError() {
        // Arrange
        String username = "testuser";
        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        CodeExecutionRequest request = new CodeExecutionRequest("python", "sintax_error", "");

        // Act
        CodeExecutionResponse response = sandboxExecutorService.executeCode(request, username);

        // Assert
        assertNotNull(response);
        assertEquals("COMPILE_ERROR", response.getStatus());
        assertTrue(response.getOutput().contains("SyntaxError"));
    }
}
