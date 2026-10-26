package com.moneymanager.controller;

import com.moneymanager.dto.response.ApiResponse;
import com.moneymanager.dto.response.DashboardResponse;
import com.moneymanager.service.DashboardService;
import com.moneymanager.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getDashboard(principal.getId())));
    }
}
