package com.moneymanager.repository;

import com.moneymanager.model.Subscription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    Optional<Subscription> findByUserId(Long userId);

    Page<Subscription> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByPlan(Subscription.Plan plan);
}
