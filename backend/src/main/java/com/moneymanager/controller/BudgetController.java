package com.moneymanager.controller;

import com.moneymanager.dto.request.BudgetRequest;
import com.moneymanager.dto.response.ApiResponse;
import com.moneymanager.dto.response.BudgetResponse;
import com.moneymanager.service.BudgetService;
import jakarta.validation.Valid;
import com.moneymanager.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BudgetResponse>>> getAll(@AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) Integer month,
        @RequestParam(required = false) Integer year
    ) {
        LocalDate now = LocalDate.now();
        int m = month != null ? month : now.getMonthValue();
        int y = year != null ? year : now.getYear();
        return ResponseEntity.ok(ApiResponse.success(budgetService.getForMonth(principal.getId(), m, y)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BudgetResponse>> create(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Budget created", budgetService.create(principal.getId(), request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BudgetResponse>> update(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id, @Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.ok(ApiResponse.success(budgetService.update(principal.getId(), id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        budgetService.delete(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Budget deleted", null));
    }
}
