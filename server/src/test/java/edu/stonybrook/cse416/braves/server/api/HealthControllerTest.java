package edu.stonybrook.cse416.braves.server.api;

import edu.stonybrook.cse416.braves.server.service.DatabaseHealthService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class HealthControllerTest {

    @Test
    void healthEndpointsReturnHealthyPayloads() throws Exception {
        DatabaseHealthService databaseHealthService = () -> Map.of(
                "status", "ok",
                "database", "cse416_braves",
                "collections", Map.of("states", 2, "gingles_results", 4)
        );

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new HealthController(databaseHealthService)).build();

        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.service").value("braves-server"));

        mockMvc.perform(get("/health/db"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.database").value("cse416_braves"))
                .andExpect(jsonPath("$.collections.gingles_results").value(4));
    }
}
