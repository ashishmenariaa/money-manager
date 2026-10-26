package com.moneymanager.service;

import com.moneymanager.dto.request.BudgetRequest;
import com.moneymanager.dto.response.BudgetResponse;
import com.moneymanager.dto.response.CategoryResponse;
import com.moneymanager.exception.BadRequestException;
import com.moneymanager.exception.ResourceNotFoundException;
import com.moneymanager.model.Budget;
import com.moneymanager.model.Category;
import com.moneymanager.model.User;
import com.moneymanager.repository.BudgetRepository;
import com.moneymanager.repository.CategoryRepository;
import com.moneymanager.repository.TransactionRepository;
import com.moneymanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @Transactional
    public BudgetResponse create(Long userId, BudgetRequest request) {
        if (budgetRepository.findByUserIdAndCategoryIdAndMonthAndYear(
                userId, request.getCategoryId(), request.getMonth(), request.getYear()).isPresent()) {
            throw new BadRequestException("Budget already exists for this category and period");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Category category = categoryRepository.findAccessibleById(request.getCategoryId(), userId)
            .orElseThrow(() -> new ResourceNotFoundException("Category", request.getCategoryId()));

        Budget budget = Budget.builder()
            .limitAmount(request.getLimitAmount())
            .month(request.getMonth())
            .year(request.getYear())
            .user(user)
            .category(category)
            .build();

        return mapToResponse(budgetRepository.save(budget), userId);
    }

    @Transactional
    public BudgetResponse update(Long userId, Long budgetId, BudgetRequest request) {
        Budget budget = budgetRepository.findByIdAndUserId(budgetId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Budget", budgetId));

        budget.setLimitAmount(request.getLimitAmount());
        return mapToResponse(budgetRepository.save(budget), userId);
    }

    @Transactional
    public void delete(Long userId, Long budgetId) {
        Budget budget = budgetRepository.findByIdAndUserId(budgetId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Budget", budgetId));
        budgetRepository.delete(budget);
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> getForMonth(Long userId, Integer month, Integer year) {
        return budgetRepository.findByUserIdAndMonthAndYear(userId, month, year)
            .stream().map(b -> mapToResponse(b, userId)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> getAll(Long userId) {
        return budgetRepository.findByUserIdOrderByYearDescMonthDesc(userId)
            .stream().map(b -> mapToResponse(b, userId)).collect(Collectors.toList());
    }

    private BudgetResponse mapToResponse(Budget budget, Long userId) {
        BigDecimal spent = transactionRepository.sumExpensesByCategoryAndMonth(
            userId, budget.getCategory().getId(), budget.getMonth(), budget.getYear());

        BigDecimal limit = budget.getLimitAmount();
        BigDecimal remaining = limit.subtract(spent);
        double percentage = limit.compareTo(BigDecimal.ZERO) > 0
            ? spent.divide(limit, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
            : 0.0;

        Category c = budget.getCategory();
        return BudgetResponse.builder()
            .id(budget.getId())
            .limitAmount(limit)
            .spentAmount(spent)
            .remainingAmount(remaining)
            .percentageUsed(percentage)
            .exceeded(remaining.compareTo(BigDecimal.ZERO) < 0)
            .month(budget.getMonth())
            .year(budget.getYear())
            .category(CategoryResponse.builder()
                .id(c.getId()).name(c.getName()).color(c.getColor())
                .icon(c.getIcon()).type(c.getType()).predefined(c.isPredefined())
                .build())
            .createdAt(budget.getCreatedAt())
            .build();
    }
}
