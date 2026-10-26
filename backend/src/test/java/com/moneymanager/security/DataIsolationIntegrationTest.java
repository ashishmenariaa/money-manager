package com.moneymanager.security;

import com.moneymanager.support.ApiTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** One user must never see or use another user's data. */
@SpringBootTest
@AutoConfigureMockMvc
class DataIsolationIntegrationTest extends ApiTestSupport {

    @Test
    void usersCannotReadOrModifyEachOthersTransactions() throws Exception {
        Session alice = registerNewUser();
        Session bob = registerNewUser();

        long categoryId = createCategory(alice, "Alice Private");
        long txnId = json(mvc.perform(authed(post("/api/transactions"), alice)
                .contentType(MediaType.APPLICATION_JSON).content(transactionBody(categoryId)))
            .andExpect(status().isCreated())).get("id").asLong();

        mvc.perform(authed(get("/api/transactions/" + txnId), bob)).andExpect(status().isNotFound());
        mvc.perform(authed(delete("/api/transactions/" + txnId), bob)).andExpect(status().isNotFound());
        mvc.perform(authed(get("/api/transactions"), bob))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.totalElements").value(0));

        mvc.perform(authed(get("/api/transactions/" + txnId), alice)).andExpect(status().isOk());
    }

    @Test
    void usersCannotAttachTransactionsToAnotherUsersCategory() throws Exception {
        Session alice = registerNewUser();
        Session bob = registerNewUser();
        long aliceCategory = createCategory(alice, "Alice Only");

        mvc.perform(authed(post("/api/transactions"), bob)
                .contentType(MediaType.APPLICATION_JSON).content(transactionBody(aliceCategory)))
            .andExpect(status().isNotFound());
    }

    private long createCategory(Session owner, String name) throws Exception {
        String body = """
            {"name":"%s","color":"#123456","icon":"tag","type":"EXPENSE"}
            """.formatted(name);
        return json(mvc.perform(authed(post("/api/categories"), owner)
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated())).get("id").asLong();
    }

    private static String transactionBody(long categoryId) {
        return """
            {"amount":250.00,"type":"EXPENSE","transactionDate":"2026-10-01","categoryId":%d,"description":"Groceries"}
            """.formatted(categoryId);
    }
}
