package com.moneymanager.service;

import com.moneymanager.dto.request.CategoryRequest;
import com.moneymanager.dto.response.CategoryResponse;
import com.moneymanager.exception.BadRequestException;
import com.moneymanager.exception.ResourceNotFoundException;
import com.moneymanager.model.Category;
import com.moneymanager.model.User;
import com.moneymanager.repository.CategoryRepository;
import com.moneymanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllForUser(Long userId) {
        return categoryRepository.findAllAccessibleByUser(userId)
            .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getPredefined() {
        return categoryRepository.findByPredefinedTrue()
            .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public CategoryResponse create(Long userId, CategoryRequest request) {
        if (categoryRepository.existsByNameAndUserId(request.getName(), userId)) {
            throw new BadRequestException("Category with this name already exists");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Category category = Category.builder()
            .name(request.getName())
            .color(request.getColor())
            .icon(request.getIcon())
            .type(request.getType())
            .predefined(false)
            .user(user)
            .build();

        return mapToResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(Long userId, Long categoryId, CategoryRequest request) {
        Category category = categoryRepository.findByIdAndUserId(categoryId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Category", categoryId));

        if (category.isPredefined()) {
            throw new BadRequestException("Predefined categories cannot be modified");
        }

        category.setName(request.getName());
        category.setColor(request.getColor());
        category.setIcon(request.getIcon());
        category.setType(request.getType());

        return mapToResponse(categoryRepository.save(category));
    }

    @Transactional
    public void delete(Long userId, Long categoryId) {
        Category category = categoryRepository.findByIdAndUserId(categoryId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Category", categoryId));

        if (category.isPredefined()) {
            throw new BadRequestException("Predefined categories cannot be deleted");
        }

        categoryRepository.delete(category);
    }

    public CategoryResponse mapToResponse(Category c) {
        return CategoryResponse.builder()
            .id(c.getId())
            .name(c.getName())
            .color(c.getColor())
            .icon(c.getIcon())
            .type(c.getType())
            .predefined(c.isPredefined())
            .build();
    }
}
