package edu.stonybrook.cse416.braves.server.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.stonybrook.cse416.braves.server.config.ApiExceptionHandler;
import edu.stonybrook.cse416.braves.server.dto.StateOptionResponse;
import edu.stonybrook.cse416.braves.server.service.BackendDataService;
import edu.stonybrook.cse416.braves.server.service.GeometryAssetService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class StateControllerTest {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void getDistrictTopologyReturnsJsonAssetWithResultField() throws Exception {
        MockMvc mockMvc = mockMvcFor(dataServiceForResponse(Map.of()));

        mockMvc.perform(get("/api/states/OR/districts/enacted/topology"))
                .andExpect(status().isOk())
                .andExpect(header().exists(HttpHeaders.ETAG))
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, org.hamcrest.Matchers.containsString("max-age")))
                .andExpect(jsonPath("$.type").value("Topology"))
                .andExpect(jsonPath("$.objects.districts.geometries[0].properties.RESULT").value("DEMOCRATIC"))
                .andExpect(jsonPath("$.objects.districts.geometries[0].properties.STATEFP").doesNotExist());
    }

    @Test
    void getUsStatesTopologyReturnsRenamedJsonAsset() throws Exception {
        MockMvc mockMvc = mockMvcFor(dataServiceForResponse(Map.of()));

        mockMvc.perform(get("/api/maps/us-states/topology"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("Topology"))
                .andExpect(header().exists(HttpHeaders.ETAG))
                .andExpect(jsonPath("$.objects['us-states'].geometries[0].properties.name").value("Alabama"));
    }

    @Test
    void getPrecinctTopologyReturnsJsonAsset() throws Exception {
        MockMvc mockMvc = mockMvcFor(dataServiceForResponse(Map.of()));

        mockMvc.perform(get("/api/states/OR/precincts/topology"))
                .andExpect(status().isOk())
                .andExpect(header().exists(HttpHeaders.ETAG))
                .andExpect(jsonPath("$.type").value("Topology"))
                .andExpect(jsonPath("$.objects.precincts_or.geometries[0].properties.GEOID").exists())
                .andExpect(jsonPath("$.objects.precincts_or.geometries[0].properties.total").exists())
                .andExpect(jsonPath("$.objects.precincts_or.geometries[0].properties.hispanic").exists())
                .andExpect(jsonPath("$.objects.precincts_or.geometries[0].properties.total_votes").doesNotExist());
    }

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

    @Test
    void implementedEndpointsReturnHealthyPayloadsIncludingFullGinglesScatter() throws Exception {
        Map<String, Object> stateSummary = Map.of(
                "schemaVersion", "v1",
                "state", "OR",
                "feasibleGroups", List.of("Latino", "Asian", "White")
        );
        Map<String, Object> ensembleSummary = Map.of(
                "schemaVersion", "v1",
                "state", "OR",
                "finalPlanCount", 5000
        );
        Map<String, Object> heatmap = Map.of(
                "schemaVersion", "v1",
                "state", "OR",
                "group", "Latino",
                "bins", List.of(Map.of("min", 0, "max", 10, "color", "#f7fcb9"))
        );
        Map<String, Object> districtTable = Map.of(
                "schemaVersion", "v1",
                "state", "OR",
                "rows", List.of(Map.of("district", "1", "winner", "DEMOCRATIC"))
        );
        Map<String, Object> gingles = readFixture("gingles-scatter/OR_2024_latino.json");
        Map<String, Object> ginglesTable = readFixture("gingles-table/OR_2024_latino.json");
        Map<String, Object> eiSupport = Map.of(
                "schemaVersion", "v1",
                "selectedCandidate", "Democratic Candidate",
                "groups", List.of(Map.of("group", "Latino", "support", 0.62))
        );
        Map<String, Object> eiPrecinctBarCi = Map.of(
                "schemaVersion", "v1",
                "bars", List.of(Map.of("label", "Latino", "peak", 0.62, "ciLow", 0.58, "ciHigh", 0.66))
        );
        Map<String, Object> eiKde = Map.of(
                "schemaVersion", "v1",
                "series", List.of(Map.of("label", "Latino", "points", List.of(Map.of("x", 0.1, "density", 0.2))))
        );
        Map<String, Object> ensembleSplits = Map.of(
                "schemaVersion", "v1",
                "ensembleSize", 5000,
                "series", Map.of("vraConstrained", List.of(Map.of("districtsWon", 3, "frequency", 1000)))
        );
        Map<String, Object> boxWhisker = Map.of(
                "schemaVersion", "v1",
                "rankSummaries", List.of(Map.of("district", 1, "min", 0.1, "q1", 0.2, "median", 0.3, "q3", 0.4, "max", 0.5))
        );
        Map<String, Object> interestingPlan = Map.of(
                "schemaVersion", "v1",
                "planId", "plan-42",
                "topology", Map.of("type", "Topology")
        );
        Map<String, Object> vraImpact = Map.of(
                "schemaVersion", "v1",
                "rows", List.of(Map.of("metric", "Ability to Elect", "threshold", 0.5))
        );
        Map<String, Object> minorityEffectivenessBoxWhisker = Map.of(
                "schemaVersion", "v1",
                "groups", List.of(Map.of("group", "Latino", "min", 1, "q1", 2, "median", 3, "q3", 4, "max", 5))
        );
        Map<String, Object> minorityEffectivenessHistogram = Map.of(
                "schemaVersion", "v1",
                "bins", List.of(Map.of("districts", 1, "frequency", 1200))
        );

        BackendDataService dataService = new BackendDataService(
                null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null
        ) {
            @Override
            public List<StateOptionResponse> getStates() {
                return List.of(
                        new StateOptionResponse("OR", "Oregon", 6),
                        new StateOptionResponse("SC", "South Carolina", 7)
                );
            }

            @Override
            public Map<String, Object> getStateSummary(String stateIdInput) {
                return stateSummary;
            }

            @Override
            public Map<String, Object> getEnsembleSummary(String stateIdInput) {
                return ensembleSummary;
            }

            @Override
            public Map<String, Object> getHeatmap(String stateIdInput, String groupInput) {
                return heatmap;
            }

            @Override
            public Map<String, Object> getDistrictTable(String stateIdInput, String electionInput) {
                return districtTable;
            }

            @Override
            public Map<String, Object> getGingles(String stateIdInput, String groupInput, String electionInput) {
                return gingles;
            }

            @Override
            public Map<String, Object> getGinglesTable(String stateIdInput, String groupInput, String electionInput) {
                return ginglesTable;
            }

            @Override
            public Map<String, Object> getEiSupport(String stateIdInput, String groupsInput, String electionInput, String partyInput) {
                return eiSupport;
            }

            @Override
            public Map<String, Object> getEiPrecinctBarCi(String stateIdInput, String groupInput, String electionInput, String partyInput) {
                return eiPrecinctBarCi;
            }

            @Override
            public Map<String, Object> getEiKde(String stateIdInput, String groupInput, String electionInput, String metricInput) {
                return eiKde;
            }

            @Override
            public Map<String, Object> getEnsembleSplits(String stateIdInput, String ensembleSizeInput, String electionInput) {
                return ensembleSplits;
            }

            @Override
            public Map<String, Object> getBoxWhisker(String stateIdInput, String groupInput, String ensembleTypeInput, String metricInput) {
                return boxWhisker;
            }

            @Override
            public Map<String, Object> getInterestingPlan(String stateIdInput, String planIdInput) {
                return interestingPlan;
            }

            @Override
            public Map<String, Object> getVraImpactThresholds(String stateIdInput, String groupInput, String electionInput) {
                return vraImpact;
            }

            @Override
            public Map<String, Object> getMinorityEffectivenessBoxWhisker(String stateIdInput, String electionInput) {
                return minorityEffectivenessBoxWhisker;
            }

            @Override
            public Map<String, Object> getMinorityEffectivenessHistogram(String stateIdInput, String groupInput, String electionInput) {
                return minorityEffectivenessHistogram;
            }
        };

        MockMvc mockMvc = mockMvcFor(dataService);

        mockMvc.perform(get("/api/states"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].stateId").value("OR"))
                .andExpect(jsonPath("$[1].stateId").value("SC"));

        mockMvc.perform(get("/api/states/OR/state-summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.state").value("OR"))
                .andExpect(jsonPath("$.feasibleGroups.length()").value(3));

        mockMvc.perform(get("/api/states/OR/ensembles-summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.state").value("OR"))
                .andExpect(jsonPath("$.finalPlanCount").value(5000));

        mockMvc.perform(get("/api/states/OR/heatmap/precincts").param("group", "latino"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.group").value("Latino"))
                .andExpect(jsonPath("$.bins.length()").value(1));

        mockMvc.perform(get("/api/states/OR/districts/enacted/table").param("election", "2024_pres"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rows.length()").value(1));

        mockMvc.perform(get("/api/states/OR/analysis/gingles")
                        .param("group", "latino")
                        .param("election", "2024_pres"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.state").value("OR"))
                .andExpect(jsonPath("$.points.length()").value(1682))
                .andExpect(jsonPath("$.regressionCurves.length()").value(2))
                .andExpect(jsonPath("$.regressionCurves[0].points.length()").value(21));

        mockMvc.perform(get("/api/states/OR/analysis/gingles/table")
                        .param("group", "latino")
                        .param("election", "2024_pres"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rows.length()").value(100));

        mockMvc.perform(get("/api/states/OR/analysis/ei-support")
                        .param("groups", "latino")
                        .param("election", "2024_pres")
                        .param("party", "DEM"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.selectedCandidate").value("Democratic Candidate"));

        mockMvc.perform(get("/api/states/OR/analysis/ei-precinct-bar-ci")
                        .param("group", "latino")
                        .param("election", "2024_pres")
                        .param("party", "DEM"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bars[0].ciLow").value(0.58));

        mockMvc.perform(get("/api/states/OR/analysis/ei-kde")
                        .param("group", "latino")
                        .param("election", "2024_pres")
                        .param("metric", "support_gap"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.series[0].points[0].density").value(0.2));

        mockMvc.perform(get("/api/states/OR/ensembles/splits")
                        .param("ensembleSize", "final")
                        .param("election", "2024_pres"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.series.vraConstrained[0].frequency").value(1000));

        mockMvc.perform(get("/api/states/OR/ensembles/box-whisker")
                        .param("group", "latino")
                        .param("ensembleType", "vra_constrained")
                        .param("metric", "minority_share"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rankSummaries[0].median").value(0.3));

        mockMvc.perform(get("/api/states/OR/districts/interesting").param("planId", "plan-42"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.topology.type").value("Topology"));

        mockMvc.perform(get("/api/states/OR/analysis/vra-impact-thresholds")
                        .param("group", "latino")
                        .param("election", "2024_pres"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rows[0].metric").value("Ability to Elect"));

        mockMvc.perform(get("/api/states/OR/analysis/minority-effectiveness/box-whisker")
                        .param("election", "2024_pres"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.groups[0].group").value("Latino"));

        mockMvc.perform(get("/api/states/OR/analysis/minority-effectiveness/histogram")
                        .param("group", "latino")
                        .param("election", "2024_pres"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bins[0].frequency").value(1200));
    }

    private MockMvc mockMvcFor(BackendDataService dataService) {
        StateController controller = new StateController(dataService, new GeometryAssetService(objectMapper));
        return MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    private Map<String, Object> readFixture(String relativePath) throws Exception {
        return objectMapper.readValue(
                Path.of("..", "mock-data", "v1", relativePath).normalize().toFile(),
                objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class)
        );
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
