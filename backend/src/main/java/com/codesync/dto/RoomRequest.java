package com.codesync.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomRequest {

    @NotBlank(message = "Room name cannot be blank")
    private String name;

    private String description;

    private boolean isPrivate = false;

    private String password; // optional room passcode
}
