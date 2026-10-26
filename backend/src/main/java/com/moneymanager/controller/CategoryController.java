package com.moneymanager.controller;

import com.moneymanager.dto.request.CategoryRequest;
import com.moneymanager.dto.response.ApiResponse;
import com.moneymanager.dto.response.CategoryResponse;
import com.moneymanager.service.CategoryService;
import jakarta.validation.Valid;
import com.moneymanager.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAll(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getAllForUser(principal.getId())));
    }

    @GetMapping("/predefined")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getPredefined() {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getPredefined()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponse>> create(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Category created", categoryService.create(principal.getId(), request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> update(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(categoryService.update(principal.getId(), id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        categoryService.delete(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Category deleted", null));
    }
}
