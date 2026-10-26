package com.moneymanager.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class DashboardResponse {
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal netSavings;
    private double savingsRate;
    private List<TransactionResponse> recentTransactions;
    private Map<String, BigDecimal> expenseByCategory;
    private List<BudgetResponse> budgetAlerts;
    private int currentMonth;
    private int currentYear;
}
