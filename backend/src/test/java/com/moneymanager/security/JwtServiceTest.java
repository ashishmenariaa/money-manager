package com.moneymanager.security;

import com.moneymanager.model.User;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRET = "unit-test-secret-that-is-long-enough-123";

    private final UserPrincipal user = UserPrincipal.from(User.builder()
        .id(42L).email("a@test.dev").password("x").firstName("A").lastName("B").role(User.Role.USER).build());

    @Test
    void validTokenRoundTrips() {
        JwtService jwt = new JwtService(SECRET, Duration.ofMinutes(15));

        assertThat(jwt.extractUserId(jwt.generateAccessToken(user))).contains(42L);
        assertThat(jwt.getAccessTokenTtlSeconds()).isEqualTo(900);
    }

    @Test
    void tamperedTokenIsRejected() {
        JwtService jwt = new JwtService(SECRET, Duration.ofMinutes(15));
        String token = jwt.generateAccessToken(user);
        String tampered = token.substring(0, token.length() - 2) + (token.endsWith("A") ? "BB" : "AA");

        assertThat(jwt.extractUserId(tampered)).isEmpty();
    }

    @Test
    void tokenSignedWithAnotherKeyIsRejected() {
        String foreign = new JwtService("another-secret-that-is-also-long-enough!", Duration.ofMinutes(15))
            .generateAccessToken(user);

        assertThat(new JwtService(SECRET, Duration.ofMinutes(15)).extractUserId(foreign)).isEmpty();
    }

    @Test
    void expiredTokenIsRejected() {
        JwtService jwt = new JwtService(SECRET, Duration.ofSeconds(-1));

        assertThat(jwt.extractUserId(jwt.generateAccessToken(user))).isEmpty();
    }

    @Test
    void shortSecretFailsFast() {
        assertThatThrownBy(() -> new JwtService("too-short", Duration.ofMinutes(15)))
            .isInstanceOf(IllegalStateException.class);
    }
}
