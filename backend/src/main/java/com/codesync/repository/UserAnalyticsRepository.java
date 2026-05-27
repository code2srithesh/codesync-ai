package com.codesync.repository;

import com.codesync.model.UserAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserAnalyticsRepository extends JpaRepository<UserAnalytics, UUID> {
    Optional<UserAnalytics> findByUserId(UUID userId);
}
