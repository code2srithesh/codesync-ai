package com.codesync.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeExecutionResponse {
    private String status; // SUCCESS, COMPILE_ERROR, RUNTIME_ERROR, TIMEOUT
    private String output;
    private int executionTimeMs;
}
