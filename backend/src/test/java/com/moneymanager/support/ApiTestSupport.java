package com.moneymanager.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Helpers for MockMvc tests that need real registered users and tokens. */
public abstract class ApiTestSupport {

    public static final String PASSWORD = "Secret123";

    @Autowired protected MockMvc mvc;
    @Autowired protected ObjectMapper objectMapper;

    protected record Session(String email, String accessToken, String refreshToken) {}

    protected Session registerNewUser() throws Exception {
        String email = "user-" + UUID.randomUUID() + "@test.dev";
        String body = """
            {"email":"%s","password":"%s","firstName":"Test","lastName":"User"}
            """.formatted(email, PASSWORD);
        JsonNode data = json(mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated()));
        return new Session(email, data.get("accessToken").asText(), data.get("refreshToken").asText());
    }

    protected Session login(String email, String password) throws Exception {
        String body = """
            {"email":"%s","password":"%s"}
            """.formatted(email, password);
        JsonNode data = json(mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk()));
        return new Session(email, data.get("accessToken").asText(), data.get("refreshToken").asText());
    }

    protected MockHttpServletRequestBuilder authed(MockHttpServletRequestBuilder request, Session session) {
        return request.header("Authorization", "Bearer " + session.accessToken());
    }

    protected ResultActions postJson(String url, String body) throws Exception {
        return mvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(body));
    }

    /** Returns the "data" field of an ApiResponse body. */
    protected JsonNode json(ResultActions result) throws Exception {
        return objectMapper.readTree(result.andReturn().getResponse().getContentAsString()).get("data");
    }
}
