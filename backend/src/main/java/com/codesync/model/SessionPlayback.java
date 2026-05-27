package com.codesync.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "session_playbacks", indexes = {
    @Index(name = "idx_playback_room_time", columnList = "room_id, timestamp_offset_ms")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionPlayback {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType; // CODE_EDIT, CURSOR_MOVE, EXECUTE, WHITEBOARD_DRAW

    @Column(name = "payload", nullable = false, columnDefinition = "TEXT")
    private String payload; // JSON payload

    @Column(name = "timestamp_offset_ms", nullable = false)
    private long timestampOffsetMs; // milliseconds offset from room creation

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;
}
