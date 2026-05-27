package com.codesync.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_analytics", indexes = {
    @Index(name = "idx_analytics_user", columnList = "user_id", unique = true)
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "active_days_streak", nullable = false)
    private int activeDaysStreak;

    @Column(name = "total_problems_solved", nullable = false)
    private int totalProblemsSolved;

    @Column(name = "total_sessions_joined", nullable = false)
    private int totalSessionsJoined;

    @Column(name = "total_time_spent_seconds", nullable = false)
    private long totalTimeSpentSeconds;

    @Column(name = "java_executions_count", nullable = false)
    private int javaExecutionsCount;

    @Column(name = "python_executions_count", nullable = false)
    private int pythonExecutionsCount;

    @Column(name = "cpp_executions_count", nullable = false)
    private int cppExecutionsCount;

    @Column(name = "js_executions_count", nullable = false)
    private int jsExecutionsCount;

    @LastModifiedDate
    @Column(name = "last_active_at")
    private LocalDateTime lastActiveAt;
}
