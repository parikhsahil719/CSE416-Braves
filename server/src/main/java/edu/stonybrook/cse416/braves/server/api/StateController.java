package edu.stonybrook.cse416.braves.server.api;

import edu.stonybrook.cse416.braves.server.dto.StateOptionResponse;
import edu.stonybrook.cse416.braves.server.service.BackendDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.constraints.NotBlank;
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
    public Map<String, Object> getDistrictMap(@PathVariable @NotBlank String stateId) {
        return dataService.getDistrictMap(stateId);
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

    @Operation(summary = "GUI-9: Gingles analysis")
    @GetMapping("/states/{stateId}/analysis/gingles")
    public Map<String, Object> getGingles(
            @PathVariable @NotBlank String stateId,
            @RequestParam(required = false) String group,
            @RequestParam(required = false, defaultValue = "2024_pres") String election
    ) {
        return dataService.getGingles(stateId, group, election);
    }

    @Operation(summary = "GUI-12: EI support distribution")
    @GetMapping("/states/{stateId}/analysis/ei-support")
    public Map<String, Object> getEiSupport(
            @PathVariable @NotBlank String stateId,
            @Parameter(description = "Comma-separated groups")
            @RequestParam @NotBlank String groups,
            @RequestParam(required = false, defaultValue = "2024_pres") String election,
            @Parameter(description = "Required: DEM or REP")
            @RequestParam @NotBlank String party
    ) {
        return dataService.getEiSupport(stateId, groups, election, party);
    }

    @Operation(summary = "GUI-16: Ensemble splits")
    @GetMapping("/states/{stateId}/ensembles/splits")
    public Map<String, Object> getEnsembleSplits(
            @PathVariable @NotBlank String stateId,
            @RequestParam(required = false, defaultValue = "final") String ensembleSize,
            @RequestParam(required = false, defaultValue = "2024_pres") String election
    ) {
        return dataService.getEnsembleSplits(stateId, ensembleSize, election);
    }

    @Operation(summary = "GUI-17: Box and whisker summaries")
    @GetMapping("/states/{stateId}/ensembles/box-whisker")
    public Map<String, Object> getBoxWhisker(
            @PathVariable @NotBlank String stateId,
            @RequestParam @NotBlank String group,
            @RequestParam @NotBlank String ensembleType,
            @RequestParam @NotBlank String metric
    ) {
        return dataService.getBoxWhisker(stateId, group, ensembleType, metric);
    }
}
