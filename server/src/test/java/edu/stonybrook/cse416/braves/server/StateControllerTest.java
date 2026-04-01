package edu.stonybrook.cse416.braves.server;

import edu.stonybrook.cse416.braves.server.api.StateController;
import edu.stonybrook.cse416.braves.server.config.ApiExceptionHandler;
import edu.stonybrook.cse416.braves.server.dto.StateOptionResponse;
import edu.stonybrook.cse416.braves.server.service.BackendDataService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class StateControllerTest {
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        BackendDataService service = new BackendDataService(
                null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null
        ) {
            @Override
            public List<StateOptionResponse> getStates() {
                return List.of(new StateOptionResponse("OR", "Oregon", 6));
            }

            @Override
            public Map<String, Object> getGinglesTable(String stateIdInput, String groupInput, String electionInput) {
                return Map.of(
                        "schemaVersion", "v1",
                        "tableType", "gingles-precinct-table",
                        "state", stateIdInput,
                        "selectedGroup", "Latino",
                        "rows", List.of(Map.of("precinctId", "OR-P001", "democraticVotes", 746))
                );
            }

            @Override
            public Map<String, Object> getInterestingPlan(String stateIdInput, String planIdInput) {
                return Map.of(
                        "schemaVersion", "v1",
                        "state", stateIdInput,
                        "planId", planIdInput,
                        "planName", "Oregon Opportunity Corridor",
                        "geojson", Map.of("type", "FeatureCollection", "features", List.of())
                );
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(new StateController(service))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void getStatesReturnsJsonArray() throws Exception {
        mockMvc.perform(get("/api/states"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].stateId").value("OR"))
                .andExpect(jsonPath("$[0].stateName").value("Oregon"))
                .andExpect(jsonPath("$[0].totalDistricts").value(6));
    }

    @Test
    void getGinglesTableReturnsPayload() throws Exception {
        mockMvc.perform(get("/api/states/OR/analysis/gingles/table")
                        .param("group", "latino")
                        .param("election", "2024_pres"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tableType").value("gingles-precinct-table"))
                .andExpect(jsonPath("$.state").value("OR"))
                .andExpect(jsonPath("$.rows[0].precinctId").value("OR-P001"));
    }

    @Test
    void getInterestingPlanReturnsPayload() throws Exception {
        mockMvc.perform(get("/api/states/OR/districts/interesting")
                        .param("planId", "plan-42"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.planId").value("plan-42"))
                .andExpect(jsonPath("$.geojson.type").value("FeatureCollection"));
    }

    @Test
    void missingGroupParameterReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/states/OR/analysis/minority-effectiveness/histogram"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }
}
