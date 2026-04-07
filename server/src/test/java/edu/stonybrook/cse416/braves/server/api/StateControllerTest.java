package edu.stonybrook.cse416.braves.server.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.stonybrook.cse416.braves.server.config.ApiExceptionHandler;
import edu.stonybrook.cse416.braves.server.service.BackendDataService;
import edu.stonybrook.cse416.braves.server.service.GeometryAssetService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class StateControllerTest {

    @Test
    void getEnsembleSummaryReturnsSeededPayloadForSupportedState() throws Exception {
        BackendDataService dataService = dataServiceForResponse(Map.of(
                "schemaVersion", "v1",
                "state", "OR",
                "finalPlanCount", 5000,
                "populationEqualityThreshold", "0.50%"
        ));

        MockMvc mockMvc = mockMvcFor(dataService);

        mockMvc.perform(get("/api/states/OR/ensembles-summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.schemaVersion").value("v1"))
                .andExpect(jsonPath("$.state").value("OR"))
                .andExpect(jsonPath("$.finalPlanCount").value(5000))
                .andExpect(jsonPath("$.populationEqualityThreshold").value("0.50%"));
    }

    @Test
    void getEnsembleSummaryRejectsUnsupportedStateIds() throws Exception {
        BackendDataService dataService = dataServiceForException(new IllegalArgumentException("Unsupported stateId: XX"));

        MockMvc mockMvc = mockMvcFor(dataService);

        mockMvc.perform(get("/api/states/XX/ensembles-summary"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message").value("Unsupported stateId: XX"))
                .andExpect(jsonPath("$.path").value("/api/states/XX/ensembles-summary"));
    }

    private MockMvc mockMvcFor(BackendDataService dataService) {
        StateController controller = new StateController(dataService, new GeometryAssetService(new ObjectMapper()));
        return MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    private BackendDataService dataServiceForResponse(Map<String, Object> response) {
        return new BackendDataService(
                null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null
        ) {
            @Override
            public Map<String, Object> getEnsembleSummary(String stateIdInput) {
                return response;
            }
        };
    }

    private BackendDataService dataServiceForException(RuntimeException exception) {
        return new BackendDataService(
                null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null
        ) {
            @Override
            public Map<String, Object> getEnsembleSummary(String stateIdInput) {
                throw exception;
            }
        };
    }
}
