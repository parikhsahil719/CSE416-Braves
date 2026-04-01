package edu.stonybrook.cse416.braves.server.api;

import edu.stonybrook.cse416.braves.server.dto.StateOptionResponse;
import edu.stonybrook.cse416.braves.server.service.BackendDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@Validated
@Tag(name = "State API", description = "Professor-facing client/server routes for GUI use cases")
public class StateController {
    private final BackendDataService dataService;

    public StateController(BackendDataService dataService) {
        this.dataService = dataService;
    }

    @Operation(summary = "GUI-1: List supported states")
    @GetMapping("/states")
    public List<StateOptionResponse> getStates() {
        return dataService.getStates();
    }

    @Operation(summary = "GUI-2: Enacted district map for state")
    @GetMapping("/states/{stateId}/districts/enacted/geojson")
    public ResponseEntity<Map<String, Object>> getDistrictMap(@PathVariable @NotBlank String stateId) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore().mustRevalidate())
                .header(HttpHeaders.PRAGMA, "no-cache")
                .header(HttpHeaders.EXPIRES, "0")
                .body(dataService.getDistrictMap(stateId));
    }

    @Operation(summary = "GUI-3: State summary")
    @GetMapping("/states/{stateId}/summary")
    public Map<String, Object> getStateSummary(@PathVariable @NotBlank String stateId) {
        return dataService.getStateSummary(stateId);
    }

    @Operation(summary = "GUI-4: Precomputed precinct heatmap bins")
    @GetMapping("/states/{stateId}/heatmap/precincts")
    public Map<String, Object> getHeatmap(
            @PathVariable @NotBlank String stateId,
            @RequestParam @NotBlank String group
    ) {
        return dataService.getHeatmap(stateId, group);
    }

    @Operation(summary = "GUI-6: Congressional representation table")
    @GetMapping("/states/{stateId}/districts/enacted/table")
    public Map<String, Object> getDistrictTable(
            @PathVariable @NotBlank String stateId,
            @RequestParam(required = false, defaultValue = "2024_pres") String election
    ) {
        return dataService.getDistrictTable(stateId, election);
    }

    @Operation(summary = "GUI-9: Gingles analysis scatter plot")
    @GetMapping("/states/{stateId}/analysis/gingles")
    public Map<String, Object> getGingles(
            @PathVariable @NotBlank String stateId,
            @RequestParam @NotBlank String group,
            @RequestParam(required = false, defaultValue = "2024_pres") String election
    ) {
        return dataService.getGingles(stateId, group, election);
    }

    @Operation(summary = "GUI-10: Gingles precinct table")
    @GetMapping("/states/{stateId}/analysis/gingles/table")
    public Map<String, Object> getGinglesTable(
            @PathVariable @NotBlank String stateId,
            @RequestParam @NotBlank String group,
            @RequestParam(required = false, defaultValue = "2024_pres") String election
    ) {
        return dataService.getGinglesTable(stateId, group, election);
    }

    @Operation(summary = "GUI-12: EI support distribution")
    @GetMapping("/states/{stateId}/analysis/ei-support")
    public Map<String, Object> getEiSupport(
            @PathVariable @NotBlank String stateId,
            @RequestParam @NotBlank String groups,
            @RequestParam(required = false, defaultValue = "2024_pres") String election,
            @RequestParam @NotBlank String party
    ) {
        return dataService.getEiSupport(stateId, groups, election, party);
    }

    @Operation(summary = "GUI-13: EI precinct bar chart with confidence intervals")
    @GetMapping("/states/{stateId}/analysis/ei-precinct-bar-ci")
    public Map<String, Object> getEiPrecinctBarCi(
            @PathVariable @NotBlank String stateId,
            @RequestParam @NotBlank String group,
            @RequestParam(required = false, defaultValue = "2024_pres") String election,
            @RequestParam @NotBlank String party
    ) {
        return dataService.getEiPrecinctBarCi(stateId, group, election, party);
    }

    @Operation(summary = "GUI-15: EI KDE comparison")
    @GetMapping("/states/{stateId}/analysis/ei-kde")
    public Map<String, Object> getEiKde(
            @PathVariable @NotBlank String stateId,
            @RequestParam @NotBlank String group,
            @RequestParam(required = false, defaultValue = "2024_pres") String election,
            @RequestParam(required = false, defaultValue = "support_gap") String metric
    ) {
        return dataService.getEiKde(stateId, group, election, metric);
    }

    @Operation(summary = "GUI-16: Ensemble split comparison")
    @GetMapping("/states/{stateId}/ensembles/splits")
    public Map<String, Object> getEnsembleSplits(
            @PathVariable @NotBlank String stateId,
            @RequestParam(required = false, defaultValue = "final") String ensembleSize,
            @RequestParam(required = false, defaultValue = "2024_pres") String election
    ) {
        return dataService.getEnsembleSplits(stateId, ensembleSize, election);
    }

    @Operation(summary = "GUI-17: Box-and-whisker ensemble summary")
    @GetMapping("/states/{stateId}/ensembles/box-whisker")
    public Map<String, Object> getBoxWhisker(
            @PathVariable @NotBlank String stateId,
            @RequestParam @NotBlank String group,
            @RequestParam @NotBlank String ensembleType,
            @RequestParam(required = false, defaultValue = "minority_share") String metric
    ) {
        return dataService.getBoxWhisker(stateId, group, ensembleType, metric);
    }

    @Operation(summary = "GUI-19: Interesting district plan")
    @GetMapping("/states/{stateId}/districts/interesting")
    public Map<String, Object> getInterestingPlan(
            @PathVariable @NotBlank String stateId,
            @RequestParam @NotBlank String planId
    ) {
        return dataService.getInterestingPlan(stateId, planId);
    }

    @Operation(summary = "GUI-20: VRA impact threshold table")
    @GetMapping("/states/{stateId}/analysis/vra-impact-thresholds")
    public Map<String, Object> getVraImpactThresholds(
            @PathVariable @NotBlank String stateId,
            @RequestParam @NotBlank String group,
            @RequestParam(required = false, defaultValue = "2024_pres") String election
    ) {
        return dataService.getVraImpactThresholds(stateId, group, election);
    }

    @Operation(summary = "GUI-21: Minority effectiveness box-and-whisker comparison")
    @GetMapping("/states/{stateId}/analysis/minority-effectiveness/box-whisker")
    public Map<String, Object> getMinorityEffectivenessBoxWhisker(
            @PathVariable @NotBlank String stateId,
            @RequestParam(required = false, defaultValue = "2024_pres") String election
    ) {
        return dataService.getMinorityEffectivenessBoxWhisker(stateId, election);
    }

    @Operation(summary = "GUI-22: Minority effectiveness histogram")
    @GetMapping("/states/{stateId}/analysis/minority-effectiveness/histogram")
    public Map<String, Object> getMinorityEffectivenessHistogram(
            @PathVariable @NotBlank String stateId,
            @RequestParam @NotBlank String group,
            @RequestParam(required = false, defaultValue = "2024_pres") String election
    ) {
        return dataService.getMinorityEffectivenessHistogram(stateId, group, election);
    }
}
