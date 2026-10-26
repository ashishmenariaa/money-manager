package com.moneymanager.dto.response;

import com.moneymanager.model.Category.CategoryType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoryResponse {
    private Long id;
    private String name;
    private String color;
    private String icon;
    private CategoryType type;
    private boolean predefined;
}
