package com.moneymanager.controller;

import com.moneymanager.dto.request.SubscriptionUpdateRequest;
import com.moneymanager.dto.response.ApiResponse;
import com.moneymanager.dto.response.UserResponse;
import com.moneymanager.security.UserPrincipal;
import com.moneymanager.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getStats()));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getUsers(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getUsers(page, size)));
    }

    @PatchMapping("/users/{id}/toggle-status")
    public ResponseEntity<ApiResponse<UserResponse>> toggleStatus(@AuthenticationPrincipal UserPrincipal admin,
                                                                  @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminService.toggleStatus(admin.getId(), id)));
    }

    @PatchMapping("/users/{id}/subscription")
    public ResponseEntity<ApiResponse<UserResponse>> changePlan(@PathVariable Long id,
                                                                @Valid @RequestBody SubscriptionUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(adminService.changePlan(id, request.getPlan())));
    }
}
