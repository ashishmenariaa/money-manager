package com.moneymanager.repository;

import com.moneymanager.model.Transaction;
import com.moneymanager.model.Transaction.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {

    Page<Transaction> findByUserId(Long userId, Pageable pageable);

    List<Transaction> findByUserIdAndTransactionDateBetween(Long userId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id = :userId AND t.type = :type AND MONTH(t.transactionDate) = :month AND YEAR(t.transactionDate) = :year")
    BigDecimal sumByUserIdAndTypeAndMonthAndYear(@Param("userId") Long userId, @Param("type") TransactionType type, @Param("month") int month, @Param("year") int year);

    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId ORDER BY t.transactionDate DESC, t.createdAt DESC")
    List<Transaction> findRecentByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT t.category.name, COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id = :userId AND t.type = 'EXPENSE' AND MONTH(t.transactionDate) = :month AND YEAR(t.transactionDate) = :year GROUP BY t.category.name")
    List<Object[]> sumExpensesByCategoryForMonth(@Param("userId") Long userId, @Param("month") int month, @Param("year") int year);

    @Query("SELECT MONTH(t.transactionDate), COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id = :userId AND t.type = :type AND YEAR(t.transactionDate) = :year GROUP BY MONTH(t.transactionDate) ORDER BY MONTH(t.transactionDate)")
    List<Object[]> sumByMonthAndTypeAndYear(@Param("userId") Long userId, @Param("type") TransactionType type, @Param("year") int year);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id = :userId AND t.type = 'EXPENSE' AND t.category.id = :categoryId AND MONTH(t.transactionDate) = :month AND YEAR(t.transactionDate) = :year")
    BigDecimal sumExpensesByCategoryAndMonth(@Param("userId") Long userId, @Param("categoryId") Long categoryId, @Param("month") int month, @Param("year") int year);

    long countByUserId(Long userId);
}
