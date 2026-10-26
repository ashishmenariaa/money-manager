package com.moneymanager.service;

import com.moneymanager.dto.request.TransactionRequest;
import com.moneymanager.dto.response.CategoryResponse;
import com.moneymanager.dto.response.TransactionResponse;
import com.moneymanager.exception.BadRequestException;
import com.moneymanager.exception.ResourceNotFoundException;
import com.moneymanager.model.Category;
import com.moneymanager.model.Transaction;
import com.moneymanager.model.User;
import com.moneymanager.repository.CategoryRepository;
import com.moneymanager.repository.TransactionRepository;
import com.moneymanager.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Transactional
    public TransactionResponse create(Long userId, TransactionRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Category category = categoryRepository.findAccessibleById(request.getCategoryId(), userId)
            .orElseThrow(() -> new ResourceNotFoundException("Category", request.getCategoryId()));

        // Validate category type matches transaction type
        if (category.getType() != Category.CategoryType.BOTH) {
            if (request.getType() == Transaction.TransactionType.INCOME && category.getType() != Category.CategoryType.INCOME) {
                throw new BadRequestException("Category is not valid for income transactions");
            }
            if (request.getType() == Transaction.TransactionType.EXPENSE && category.getType() != Category.CategoryType.EXPENSE) {
                throw new BadRequestException("Category is not valid for expense transactions");
            }
        }

        Transaction transaction = Transaction.builder()
            .amount(request.getAmount())
            .type(request.getType())
            .transactionDate(request.getTransactionDate())
            .description(request.getDescription())
            .notes(request.getNotes())
            .user(user)
            .category(category)
            .build();

        transaction = transactionRepository.save(transaction);
        log.debug("Created transaction {} for user {}", transaction.getId(), userId);
        return mapToResponse(transaction);
    }

    @Transactional
    public TransactionResponse update(Long userId, Long transactionId, TransactionRequest request) {
        Transaction transaction = transactionRepository.findById(transactionId)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction", transactionId));

        if (!transaction.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Transaction", transactionId);
        }

        Category category = categoryRepository.findAccessibleById(request.getCategoryId(), userId)
            .orElseThrow(() -> new ResourceNotFoundException("Category", request.getCategoryId()));

        transaction.setAmount(request.getAmount());
        transaction.setType(request.getType());
        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setDescription(request.getDescription());
        transaction.setNotes(request.getNotes());
        transaction.setCategory(category);

        return mapToResponse(transactionRepository.save(transaction));
    }

    @Transactional
    public void delete(Long userId, Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction", transactionId));

        if (!transaction.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Transaction", transactionId);
        }

        transactionRepository.delete(transaction);
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponse> getAll(Long userId, Transaction.TransactionType type,
                                             Long categoryId, LocalDate startDate, LocalDate endDate,
                                             int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("transactionDate").descending()
            .and(Sort.by("createdAt").descending()));

        Specification<Transaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("user").get("id"), userId));

            if (type != null) predicates.add(cb.equal(root.get("type"), type));
            if (categoryId != null) predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            if (startDate != null) predicates.add(cb.greaterThanOrEqualTo(root.get("transactionDate"), startDate));
            if (endDate != null) predicates.add(cb.lessThanOrEqualTo(root.get("transactionDate"), endDate));

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return transactionRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public TransactionResponse getById(Long userId, Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction", transactionId));

        if (!transaction.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Transaction", transactionId);
        }

        return mapToResponse(transaction);
    }

    public TransactionResponse mapToResponse(Transaction t) {
        return TransactionResponse.builder()
            .id(t.getId())
            .amount(t.getAmount())
            .type(t.getType())
            .transactionDate(t.getTransactionDate())
            .description(t.getDescription())
            .notes(t.getNotes())
            .category(CategoryResponse.builder()
                .id(t.getCategory().getId())
                .name(t.getCategory().getName())
                .color(t.getCategory().getColor())
                .icon(t.getCategory().getIcon())
                .type(t.getCategory().getType())
                .predefined(t.getCategory().isPredefined())
                .build())
            .createdAt(t.getCreatedAt())
            .updatedAt(t.getUpdatedAt())
            .build();
    }
}
