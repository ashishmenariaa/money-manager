package com.moneymanager.dto.response;

import com.moneymanager.model.Subscription.Plan;
import com.moneymanager.model.Subscription.SubscriptionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class SubscriptionResponse {
    private Long id;
    private Plan plan;
    private SubscriptionStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
}
