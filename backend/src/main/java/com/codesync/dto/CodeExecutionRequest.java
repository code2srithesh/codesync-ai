package com.codesync.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CodeExecutionRequest {

    @NotBlank(message = "Language is required")
    private String language; // java, python, cpp, javascript

    @NotBlank(message = "Code content is required")
    private String code;

    private String stdin; // optional input for test cases
}
