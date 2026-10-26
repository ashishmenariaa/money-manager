package com.moneymanager.service;

import com.moneymanager.dto.response.UserResponse;
import com.moneymanager.exception.BadRequestException;
import com.moneymanager.exception.ResourceNotFoundException;
import com.moneymanager.model.Subscription;
import com.moneymanager.model.User;
import com.moneymanager.repository.RefreshTokenRepository;
import com.moneymanager.repository.SubscriptionRepository;
import com.moneymanager.repository.TransactionRepository;
import com.moneymanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private static final int MAX_PAGE_SIZE = 100;

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final TransactionRepository transactionRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers",        userRepository.count());
        stats.put("totalTransactions", transactionRepository.count());
        stats.put("freeUsers",         subscriptionRepository.countByPlan(Subscription.Plan.FREE));
        stats.put("basicUsers",        subscriptionRepository.countByPlan(Subscription.Plan.BASIC));
        stats.put("premiumUsers",      subscriptionRepository.countByPlan(Subscription.Plan.PREMIUM));
        return stats;
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> getUsers(int page, int size) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
        return userRepository.findAllByOrderByCreatedAtDesc(pageable).map(UserResponse::from);
    }

    /** Enable or disable a user. Disabling also revokes their refresh tokens so they are signed out everywhere. */
    @Transactional
    public UserResponse toggleStatus(Long adminId, Long userId) {
        if (adminId.equals(userId)) {
            throw new BadRequestException("You cannot disable your own account");
        }
        User user = findUser(userId);
        user.setEnabled(!user.isEnabled());
        if (!user.isEnabled()) {
            refreshTokenRepository.revokeAllForUser(userId);
        }
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse changePlan(Long userId, Subscription.Plan plan) {
        User user = findUser(userId);
        Subscription subscription = subscriptionRepository.findByUserId(userId)
            .orElseGet(() -> subscriptionRepository.save(Subscription.builder()
                .user(user)
                .startDate(LocalDate.now())
                .build()));
        subscription.setPlan(plan);
        user.setSubscription(subscription);
        return UserResponse.from(user);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", userId));
    }
}
