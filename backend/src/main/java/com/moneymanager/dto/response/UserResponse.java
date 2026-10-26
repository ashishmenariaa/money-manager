package com.moneymanager.dto.response;

import com.moneymanager.model.Subscription;
import com.moneymanager.model.User;
import com.moneymanager.model.User.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserResponse {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String fullName;
    private Role role;
    private boolean enabled;
    private LocalDateTime createdAt;
    private SubscriptionResponse subscription;

    public static UserResponse from(User user) {
        Subscription sub = user.getSubscription();
        return UserResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .fullName(user.getFullName())
            .role(user.getRole())
            .enabled(user.isEnabled())
            .createdAt(user.getCreatedAt())
            .subscription(sub == null ? null : SubscriptionResponse.builder()
                .id(sub.getId())
                .plan(sub.getPlan())
                .status(sub.getStatus())
                .startDate(sub.getStartDate())
                .endDate(sub.getEndDate())
                .build())
            .build();
    }
}
