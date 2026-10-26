package com.moneymanager.config;

import com.moneymanager.model.Category;
import com.moneymanager.model.Subscription;
import com.moneymanager.model.User;
import com.moneymanager.repository.CategoryRepository;
import com.moneymanager.repository.SubscriptionRepository;
import com.moneymanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedCategories();
        seedAdmin();
    }

    /**
     * Creates the first admin from APP_ADMIN_EMAIL / APP_ADMIN_PASSWORD when both are set.
     * No account is created otherwise, so there are no default credentials.
     */
    private void seedAdmin() {
        if (adminEmail.isBlank() || adminPassword.isBlank()) {
            return;
        }
        String email = adminEmail.trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            return;
        }

        User admin = userRepository.save(User.builder()
            .email(email)
            .password(passwordEncoder.encode(adminPassword))
            .firstName("Admin")
            .lastName("User")
            .role(User.Role.ADMIN)
            .build());

        subscriptionRepository.save(Subscription.builder()
            .user(admin)
            .plan(Subscription.Plan.PREMIUM)
            .status(Subscription.SubscriptionStatus.ACTIVE)
            .startDate(LocalDate.now())
            .build());

        log.info("Admin account created for {}", email);
    }

    private void seedCategories() {
        if (categoryRepository.findByPredefinedTrue().isEmpty()) {
            save("Salary",        "#4CAF50", "briefcase",     Category.CategoryType.INCOME);
            save("Freelance",     "#8BC34A", "laptop",        Category.CategoryType.INCOME);
            save("Investment",    "#009688", "trending-up",   Category.CategoryType.INCOME);
            save("Food & Dining", "#FF5722", "utensils",      Category.CategoryType.EXPENSE);
            save("Transportation","#2196F3", "car",           Category.CategoryType.EXPENSE);
            save("Shopping",      "#9C27B0", "shopping-bag",  Category.CategoryType.EXPENSE);
            save("Entertainment", "#F44336", "film",          Category.CategoryType.EXPENSE);
            save("Healthcare",    "#00BCD4", "heart",         Category.CategoryType.EXPENSE);
            save("Education",     "#FF9800", "book",          Category.CategoryType.EXPENSE);
            save("Utilities",     "#607D8B", "zap",           Category.CategoryType.EXPENSE);
            save("Rent/Housing",  "#795548", "home",          Category.CategoryType.EXPENSE);
            save("Savings",       "#3F51B5", "piggy-bank",    Category.CategoryType.BOTH);
            log.info("Default categories seeded");
        }
    }

    private void save(String name, String color, String icon, Category.CategoryType type) {
        categoryRepository.save(Category.builder()
            .name(name).color(color).icon(icon).type(type).predefined(true).build());
    }
}
