package com.moneymanager.dto.request;

import com.moneymanager.model.Subscription.Plan;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubscriptionUpdateRequest {

    @NotNull(message = "Plan is required")
    private Plan plan;
}
