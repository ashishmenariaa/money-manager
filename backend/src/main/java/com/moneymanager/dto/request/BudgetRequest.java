package com.moneymanager.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class BudgetRequest {

    @NotNull(message = "Limit amount is required")
    @DecimalMin(value = "0.01", message = "Limit must be greater than 0")
    private BigDecimal limitAmount;

    @NotNull(message = "Category is required")
    private Long categoryId;

    @NotNull(message = "Month is required")
    @Min(value = 1) @Max(value = 12)
    private Integer month;

    @NotNull(message = "Year is required")
    @Min(value = 2020) @Max(value = 2100)
    private Integer year;
}
