package com.moneymanager.service;

import com.moneymanager.model.Transaction.TransactionType;
import com.moneymanager.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final TransactionRepository transactionRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getYearlyReport(Long userId, int year) {
        List<Object[]> incomeData = transactionRepository.sumByMonthAndTypeAndYear(userId, TransactionType.INCOME, year);
        List<Object[]> expenseData = transactionRepository.sumByMonthAndTypeAndYear(userId, TransactionType.EXPENSE, year);

        BigDecimal[] incomeByMonth = new BigDecimal[13];
        BigDecimal[] expenseByMonth = new BigDecimal[13];
        Arrays.fill(incomeByMonth, BigDecimal.ZERO);
        Arrays.fill(expenseByMonth, BigDecimal.ZERO);

        incomeData.forEach(row -> incomeByMonth[(int) row[0]] = (BigDecimal) row[1]);
        expenseData.forEach(row -> expenseByMonth[(int) row[0]] = (BigDecimal) row[1]);

        List<Map<String, Object>> monthly = new ArrayList<>();
        String[] months = {"", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        for (int m = 1; m <= 12; m++) {
            Map<String, Object> monthData = new LinkedHashMap<>();
            monthData.put("month", months[m]);
            monthData.put("monthNum", m);
            monthData.put("income", incomeByMonth[m]);
            monthData.put("expense", expenseByMonth[m]);
            monthData.put("savings", incomeByMonth[m].subtract(expenseByMonth[m]));
            monthly.add(monthData);
            totalIncome = totalIncome.add(incomeByMonth[m]);
            totalExpense = totalExpense.add(expenseByMonth[m]);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("year", year);
        result.put("monthly", monthly);
        result.put("totalIncome", totalIncome);
        result.put("totalExpense", totalExpense);
        result.put("netSavings", totalIncome.subtract(totalExpense));
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCategoryBreakdown(Long userId, int month, int year) {
        List<Object[]> data = transactionRepository.sumExpensesByCategoryForMonth(userId, month, year);
        Map<String, BigDecimal> breakdown = new LinkedHashMap<>();
        BigDecimal total = BigDecimal.ZERO;
        for (Object[] row : data) {
            breakdown.put((String) row[0], (BigDecimal) row[1]);
            total = total.add((BigDecimal) row[1]);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("month", month);
        result.put("year", year);
        result.put("breakdown", breakdown);
        result.put("total", total);
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSpendingTrend(Long userId, int months) {
        List<Map<String, Object>> trend = new ArrayList<>();
        java.time.LocalDate now = java.time.LocalDate.now();

        for (int i = months - 1; i >= 0; i--) {
            java.time.LocalDate date = now.minusMonths(i);
            int m = date.getMonthValue();
            int y = date.getYear();

            BigDecimal income = transactionRepository.sumByUserIdAndTypeAndMonthAndYear(userId, TransactionType.INCOME, m, y);
            BigDecimal expense = transactionRepository.sumByUserIdAndTypeAndMonthAndYear(userId, TransactionType.EXPENSE, m, y);

            Map<String, Object> point = new LinkedHashMap<>();
            point.put("month", date.getMonth().getDisplayName(java.time.format.TextStyle.SHORT, Locale.ENGLISH));
            point.put("year", y);
            point.put("income", income);
            point.put("expense", expense);
            point.put("savings", income.subtract(expense));
            trend.add(point);
        }
        return trend;
    }
}
