package com.codesync.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIQueryRequest {

    @NotBlank(message = "Query type is required")
    private String type; // CODE_REVIEW, COMPLEXITY, HINT, OPTIMIZATION

    @NotBlank(message = "Code is required")
    private String code;

    @NotBlank(message = "Language is required")
    private String language;

    private String additionalPrompt; // user custom instruction
}
