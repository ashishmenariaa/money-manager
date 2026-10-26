package com.moneymanager.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class BudgetResponse {
    private Long id;
    private BigDecimal limitAmount;
    private BigDecimal spentAmount;
    private BigDecimal remainingAmount;
    private double percentageUsed;
    private boolean exceeded;
    private Integer month;
    private Integer year;
    private CategoryResponse category;
    private LocalDateTime createdAt;
}
