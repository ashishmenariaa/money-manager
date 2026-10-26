package com.moneymanager.dto.request;

import com.moneymanager.model.Transaction.TransactionType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TransactionRequest {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    @Digits(integer = 13, fraction = 2, message = "Invalid amount format")
    private BigDecimal amount;

    @NotNull(message = "Transaction type is required")
    private TransactionType type;

    @NotNull(message = "Date is required")
    private LocalDate transactionDate;

    @NotNull(message = "Category is required")
    private Long categoryId;

    @Size(max = 200)
    private String description;

    @Size(max = 500)
    private String notes;
}
