package com.codesync.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomResponse {
    private UUID id;
    private String roomCode;
    private String name;
    private String description;
    private boolean isPrivate;
    private String status;
    private String creatorName;
    private String activeLanguage;
    private String activeContent;
    private Long documentVersion;
    private LocalDateTime createdAt;
}
