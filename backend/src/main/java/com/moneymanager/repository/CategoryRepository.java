package com.moneymanager.repository;

import com.moneymanager.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByPredefinedTrue();

    List<Category> findByUserId(Long userId);

    @Query("SELECT c FROM Category c WHERE c.predefined = true OR c.user.id = :userId")
    List<Category> findAllAccessibleByUser(@Param("userId") Long userId);

    Optional<Category> findByIdAndUserId(Long id, Long userId);

    /** A category the user may use: a system default or one they created. */
    @Query("SELECT c FROM Category c WHERE c.id = :id AND (c.predefined = true OR c.user.id = :userId)")
    Optional<Category> findAccessibleById(@Param("id") Long id, @Param("userId") Long userId);

    boolean existsByNameAndUserId(String name, Long userId);
}
