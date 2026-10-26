package com.moneymanager.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.moneymanager.support.ApiTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthFlowIntegrationTest extends ApiTestSupport {

    @Test
    void registerReturnsTokensAndFreePlan() throws Exception {
        String body = """
            {"email":"New.Person@Test.dev","password":"Secret123","firstName":"New","lastName":"Person"}
            """;
        postJson("/api/auth/register", body)
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
            .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
            .andExpect(jsonPath("$.data.user.email").value("new.person@test.dev"))
            .andExpect(jsonPath("$.data.user.role").value("USER"))
            .andExpect(jsonPath("$.data.user.subscription.plan").value("FREE"))
            .andExpect(jsonPath("$.data.user.password").doesNotExist());
    }

    @Test
    void duplicateEmailIsRejected() throws Exception {
        Session user = registerNewUser();
        String body = """
            {"email":"%s","password":"Secret123","firstName":"A","lastName":"B"}
            """.formatted(user.email().toUpperCase());

        postJson("/api/auth/register", body).andExpect(status().isBadRequest());
    }

    @Test
    void weakPasswordIsRejected() throws Exception {
        postJson("/api/auth/register", """
            {"email":"weak@test.dev","password":"password","firstName":"A","lastName":"B"}
            """)
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.data.password").exists());
    }

    @Test
    void wrongPasswordReturns401() throws Exception {
        Session user = registerNewUser();

        postJson("/api/auth/login", """
            {"email":"%s","password":"WrongPass1"}
            """.formatted(user.email()))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void protectedEndpointsRequireValidToken() throws Exception {
        mvc.perform(get("/api/dashboard"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.success").value(false));

        mvc.perform(get("/api/dashboard").header("Authorization", "Bearer not.a.jwt"))
            .andExpect(status().isUnauthorized());

        Session user = registerNewUser();
        mvc.perform(authed(get("/api/dashboard"), user)).andExpect(status().isOk());
        mvc.perform(authed(get("/api/auth/me"), user))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.email").value(user.email()));
    }

    @Test
    void regularUserCannotReachAdminEndpoints() throws Exception {
        Session user = registerNewUser();

        mvc.perform(authed(get("/api/admin/stats"), user)).andExpect(status().isForbidden());
        mvc.perform(authed(get("/api/admin/users"), user)).andExpect(status().isForbidden());
    }

    @Test
    void adminCanListUsersAndChangePlans() throws Exception {
        Session admin = login("admin@test.dev", "AdminPass123");
        Session user = registerNewUser();
        long userId = json(mvc.perform(authed(get("/api/auth/me"), user))).get("id").asLong();

        mvc.perform(authed(get("/api/admin/users").param("size", "100"), admin))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content").isArray());

        mvc.perform(authed(patch("/api/admin/users/" + userId + "/subscription"), admin)
                .contentType(MediaType.APPLICATION_JSON).content("{\"plan\":\"PREMIUM\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.subscription.plan").value("PREMIUM"));
    }

    @Test
    void refreshRotatesTokensAndDetectsReuse() throws Exception {
        Session user = registerNewUser();

        JsonNode rotated = json(postJson("/api/auth/refresh", refreshBody(user.refreshToken()))
            .andExpect(status().isOk()));
        String newRefresh = rotated.get("refreshToken").asText();
        assertThat(newRefresh).isNotEqualTo(user.refreshToken());

        // Re-using the old token is treated as theft: it fails and revokes the new one too
        postJson("/api/auth/refresh", refreshBody(user.refreshToken())).andExpect(status().isUnauthorized());
        postJson("/api/auth/refresh", refreshBody(newRefresh)).andExpect(status().isUnauthorized());
    }

    @Test
    void logoutRevokesRefreshToken() throws Exception {
        Session user = registerNewUser();

        postJson("/api/auth/logout", refreshBody(user.refreshToken())).andExpect(status().isOk());
        postJson("/api/auth/refresh", refreshBody(user.refreshToken())).andExpect(status().isUnauthorized());
    }

    @Test
    void disabledUserLosesAccessImmediately() throws Exception {
        Session admin = login("admin@test.dev", "AdminPass123");
        Session user = registerNewUser();
        long userId = json(mvc.perform(authed(get("/api/auth/me"), user))).get("id").asLong();

        mvc.perform(authed(patch("/api/admin/users/" + userId + "/toggle-status"), admin))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.enabled").value(false));

        mvc.perform(authed(get("/api/dashboard"), user)).andExpect(status().isUnauthorized());
        postJson("/api/auth/refresh", refreshBody(user.refreshToken())).andExpect(status().isUnauthorized());
        postJson("/api/auth/login", """
            {"email":"%s","password":"%s"}
            """.formatted(user.email(), PASSWORD))
            .andExpect(status().isForbidden());
    }

    @Test
    void adminCannotDisableThemselves() throws Exception {
        Session admin = login("admin@test.dev", "AdminPass123");
        long adminId = json(mvc.perform(authed(get("/api/auth/me"), admin))).get("id").asLong();

        mvc.perform(authed(patch("/api/admin/users/" + adminId + "/toggle-status"), admin))
            .andExpect(status().isBadRequest());
    }

    private static String refreshBody(String token) {
        return "{\"refreshToken\":\"" + token + "\"}";
    }
}
