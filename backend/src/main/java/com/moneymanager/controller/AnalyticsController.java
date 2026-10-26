package com.moneymanager.controller;

import com.moneymanager.dto.response.ApiResponse;
import com.moneymanager.service.AnalyticsService;
import com.moneymanager.service.ExportService;
import com.moneymanager.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final ExportService exportService;

    @GetMapping("/yearly")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getYearlyReport(@AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().getYear()}") int year
    ) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getYearlyReport(principal.getId(), year)));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCategoryBreakdown(@AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) Integer month,
        @RequestParam(required = false) Integer year
    ) {
        LocalDate now = LocalDate.now();
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getCategoryBreakdown(
            principal.getId(),
            month != null ? month : now.getMonthValue(),
            year != null ? year : now.getYear()
        )));
    }

    @GetMapping("/trend")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSpendingTrend(@AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(defaultValue = "6") int months
    ) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getSpendingTrend(principal.getId(), months)));
    }

    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportCsv(@AuthenticationPrincipal UserPrincipal principal,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        byte[] bytes = exportService.exportTransactionsToCsv(principal.getId(), startDate, endDate).getBytes();
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"transactions.csv\"")
            .contentType(MediaType.parseMediaType("text/csv"))
            .contentLength(bytes.length)
            .body(bytes);
    }
}
