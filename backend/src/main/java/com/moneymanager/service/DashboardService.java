package com.moneymanager.service;

import com.moneymanager.dto.response.BudgetResponse;
import com.moneymanager.dto.response.DashboardResponse;
import com.moneymanager.dto.response.TransactionResponse;
import com.moneymanager.model.Transaction.TransactionType;
import com.moneymanager.repository.BudgetRepository;
import com.moneymanager.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final TransactionService transactionService;
    private final BudgetService budgetService;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(Long userId) {
        LocalDate now = LocalDate.now();
        int month = now.getMonthValue();
        int year = now.getYear();

        BigDecimal totalIncome = transactionRepository.sumByUserIdAndTypeAndMonthAndYear(userId, TransactionType.INCOME, month, year);
        BigDecimal totalExpense = transactionRepository.sumByUserIdAndTypeAndMonthAndYear(userId, TransactionType.EXPENSE, month, year);
        BigDecimal netSavings = totalIncome.subtract(totalExpense);

        double savingsRate = totalIncome.compareTo(BigDecimal.ZERO) > 0
            ? netSavings.divide(totalIncome, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
            : 0.0;

        // Recent 10 transactions
        List<TransactionResponse> recent = transactionRepository
            .findRecentByUserId(userId, PageRequest.of(0, 10))
            .stream().map(transactionService::mapToResponse).collect(Collectors.toList());

        // Expense by category this month
        Map<String, BigDecimal> expenseByCategory = new LinkedHashMap<>();
        transactionRepository.sumExpensesByCategoryForMonth(userId, month, year)
            .forEach(row -> expenseByCategory.put((String) row[0], (BigDecimal) row[1]));

        // Budget alerts (exceeded or > 80%)
        List<BudgetResponse> budgetAlerts = budgetService.getForMonth(userId, month, year)
            .stream()
            .filter(b -> b.isExceeded() || b.getPercentageUsed() >= 80)
            .collect(Collectors.toList());

        return DashboardResponse.builder()
            .totalIncome(totalIncome)
            .totalExpense(totalExpense)
            .netSavings(netSavings)
            .savingsRate(savingsRate)
            .recentTransactions(recent)
            .expenseByCategory(expenseByCategory)
            .budgetAlerts(budgetAlerts)
            .currentMonth(month)
            .currentYear(year)
            .build();
    }
}
