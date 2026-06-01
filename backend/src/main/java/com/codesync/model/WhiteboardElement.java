package com.codesync.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "whiteboard_elements", indexes = {
    @Index(name = "idx_whiteboard_room", columnList = "room_id")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WhiteboardElement {

    @Id
    private String id; // Client-generated elements random ID string

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(nullable = false)
    private String type; // free, rect, circle, line

    @Column(columnDefinition = "TEXT", nullable = false)
    private String pointsJson; // Serialized points list

    private String color;

    private int strokeWidth;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
