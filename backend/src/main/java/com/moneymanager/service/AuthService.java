package com.moneymanager.service;

import com.moneymanager.dto.request.LoginRequest;
import com.moneymanager.dto.request.RegisterRequest;
import com.moneymanager.dto.response.AuthResponse;
import com.moneymanager.dto.response.UserResponse;
import com.moneymanager.exception.BadRequestException;
import com.moneymanager.exception.ResourceNotFoundException;
import com.moneymanager.exception.UnauthorizedException;
import com.moneymanager.model.RefreshToken;
import com.moneymanager.model.Subscription;
import com.moneymanager.model.User;
import com.moneymanager.repository.RefreshTokenRepository;
import com.moneymanager.repository.SubscriptionRepository;
import com.moneymanager.repository.UserRepository;
import com.moneymanager.security.JwtService;
import com.moneymanager.security.UserPrincipal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Base64;
import java.util.HexFormat;

@Service
@Slf4j
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final Duration refreshTokenTtl;

    public AuthService(UserRepository userRepository,
                       SubscriptionRepository subscriptionRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       @Value("${app.jwt.refresh-token-ttl:7d}") Duration refreshTokenTtl) {
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.refreshTokenTtl = refreshTokenTtl;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email is already registered");
        }

        User user = userRepository.save(User.builder()
            .email(email)
            .password(passwordEncoder.encode(request.getPassword()))
            .firstName(request.getFirstName().trim())
            .lastName(request.getLastName().trim())
            .role(User.Role.USER)
            .build());

        Subscription subscription = subscriptionRepository.save(Subscription.builder()
            .user(user)
            .plan(Subscription.Plan.FREE)
            .status(Subscription.SubscriptionStatus.ACTIVE)
            .startDate(LocalDate.now())
            .build());
        user.setSubscription(subscription);

        log.info("New user registered: id={}", user.getId());
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        // Throws BadCredentialsException / DisabledException, mapped to 401 / 403 by GlobalExceptionHandler
        var authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(normalizeEmail(request.getEmail()), request.getPassword()));

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User", principal.getId()));
        return issueTokens(user);
    }

    /**
     * Rotates the refresh token: the presented token is revoked and a new pair is issued.
     * Presenting an already-revoked token signals theft, so every session of that user is revoked.
     */
    @Transactional(noRollbackFor = UnauthorizedException.class)
    public AuthResponse refresh(String rawRefreshToken) {
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash(rawRefreshToken))
            .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        User user = stored.getUser();

        if (stored.isRevoked()) {
            refreshTokenRepository.revokeAllForUser(user.getId());
            log.warn("Refresh token reuse detected for user id={}; all sessions revoked", user.getId());
            throw new UnauthorizedException("Refresh token has been revoked");
        }
        if (!stored.isUsable()) {
            throw new UnauthorizedException("Refresh token has expired");
        }
        if (!user.isEnabled()) {
            throw new UnauthorizedException("Account is disabled");
        }

        stored.setRevoked(true);
        return issueTokens(user);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        refreshTokenRepository.findByTokenHash(hash(rawRefreshToken))
            .ifPresent(token -> token.setRevoked(true));
    }

    @Transactional(readOnly = true)
    public UserResponse currentUser(Long userId) {
        return userRepository.findById(userId)
            .map(UserResponse::from)
            .orElseThrow(() -> new ResourceNotFoundException("User", userId));
    }

    private AuthResponse issueTokens(User user) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String rawRefreshToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        refreshTokenRepository.save(RefreshToken.builder()
            .user(user)
            .tokenHash(hash(rawRefreshToken))
            .expiresAt(Instant.now().plus(refreshTokenTtl))
            .build());

        return AuthResponse.builder()
            .accessToken(jwtService.generateAccessToken(UserPrincipal.from(user)))
            .refreshToken(rawRefreshToken)
            .expiresIn(jwtService.getAccessTokenTtlSeconds())
            .user(UserResponse.from(user))
            .build();
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
