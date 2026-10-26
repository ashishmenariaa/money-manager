package com.moneymanager.dto.request;

import com.moneymanager.model.Category.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoryRequest {

    @NotBlank(message = "Category name is required")
    @Size(min = 2, max = 100)
    private String name;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Invalid color format (use #RRGGBB)")
    private String color;

    @Size(max = 50)
    private String icon;

    @NotNull(message = "Category type is required")
    private CategoryType type;
}
