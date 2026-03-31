package edu.stonybrook.cse416.braves.server.api;

import edu.stonybrook.cse416.braves.server.dto.StateOptionResponse;
import edu.stonybrook.cse416.braves.server.service.BackendDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "State API", description = "Professor-facing client/server routes for GUI use cases")
public class StateController {
    private final BackendDataService dataService;

    public StateController(BackendDataService dataService) {
        this.dataService = dataService;
    }

    @Operation(
            summary = "GUI-1: List supported states",
            description = "Status: Live. Returns the state selector options exposed by the backend."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Array of supported states",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = StateOptionResponse.class)))
            )
    })
    @GetMapping("/states")
    public List<StateOptionResponse> getStates() {
        return dataService.getStates();
    }

    @Operation(
            summary = "GUI-2: Enacted district map for state",
            description = "Status: Live. Returns the enacted district GeoJSON payload for a supported state."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "GeoJSON FeatureCollection payload for the enacted congressional district map"
            )
    })
    @GetMapping("/states/{stateId}/districts/enacted/geojson")
    public Map<String, Object> getDistrictMap(
            @Parameter(description = "Required state code. Current supported values: OR or SC.")
            @PathVariable @NotBlank String stateId
    ) {
        return dataService.getDistrictMap(stateId);
    }

    @Operation(
            summary = "GUI-3: State summary",
            description = "Status: Seeded contract. Route shape and seeded Mongo payloads exist, but the service is still marked Planned for next phase."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "State summary payload containing statewide summary data and feasible groups"
            ),
            @ApiResponse(
                    responseCode = "501",
                    description = "Current service behavior while the seeded contract is not yet activated"
            )
    })
    @GetMapping("/states/{stateId}/summary")
    public Map<String, Object> getStateSummary(
            @Parameter(description = "Required state code. Current supported values: OR or SC.")
            @PathVariable @NotBlank String stateId
    ) {
        return dataService.getStateSummary(stateId);
    }

    @Operation(
            summary = "GUI-4: Precomputed precinct heatmap bins",
            description = "Status: Seeded contract. Route shape and seeded Mongo payloads exist, but the service is still marked Planned for next phase."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Heatmap legend/bin payload for the requested state and demographic group"
            ),
            @ApiResponse(
                    responseCode = "501",
                    description = "Current service behavior while the seeded contract is not yet activated"
            )
    })
    @GetMapping("/states/{stateId}/heatmap/precincts")
    public Map<String, Object> getHeatmap(
            @Parameter(description = "Required state code. Current supported values: OR or SC.")
            @PathVariable @NotBlank String stateId,
            @Parameter(description = "Required normalized group key. Seeded examples include latino, asian, and black.")
            @RequestParam @NotBlank String group
    ) {
        return dataService.getHeatmap(stateId, group);
    }

    @Operation(
            summary = "GUI-6: Congressional representation table",
            description = "Status: Seeded contract. Route shape and seeded Mongo payloads exist, but the service is still marked Planned for next phase."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "District table payload for the enacted map and requested election"
            ),
            @ApiResponse(
                    responseCode = "501",
                    description = "Current service behavior while the seeded contract is not yet activated"
            )
    })
    @GetMapping("/states/{stateId}/districts/enacted/table")
    public Map<String, Object> getDistrictTable(
            @Parameter(description = "Required state code. Current supported values: OR or SC.")
            @PathVariable @NotBlank String stateId,
            @Parameter(description = "Election selector. Default is 2024_pres, which matches the current seeded examples.")
            @RequestParam(required = false, defaultValue = "2024_pres") String election
    ) {
        return dataService.getDistrictTable(stateId, election);
    }

    @Operation(
            summary = "GUI-9: Gingles analysis",
            description = "Status: Seeded contract. Route shape and seeded Mongo payloads exist, but the service is still marked Planned for next phase."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Gingles scatter payload with precinct points and optional regression curves"
            ),
            @ApiResponse(
                    responseCode = "501",
                    description = "Current service behavior while the seeded contract is not yet activated"
            )
    })
    @GetMapping("/states/{stateId}/analysis/gingles")
    public Map<String, Object> getGingles(
            @Parameter(description = "Required state code. Current supported values: OR or SC.")
            @PathVariable @NotBlank String stateId,
            @Parameter(description = "Optional normalized demographic group key. Seeded examples use latino for OR and black for SC.")
            @RequestParam(required = false) String group,
            @Parameter(description = "Election selector. Default is 2024_pres, which matches the current seeded examples.")
            @RequestParam(required = false, defaultValue = "2024_pres") String election
    ) {
        return dataService.getGingles(stateId, group, election);
    }

    @Operation(
            summary = "GUI-12: EI support distribution",
            description = "Status: Seeded contract. Route shape and seeded Mongo payloads exist, but the service is still marked Planned for next phase."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Ecological inference support distribution payload"
            ),
            @ApiResponse(
                    responseCode = "501",
                    description = "Current service behavior while the seeded contract is not yet activated"
            )
    })
    @GetMapping("/states/{stateId}/analysis/ei-support")
    public Map<String, Object> getEiSupport(
            @Parameter(description = "Required state code. Current supported values: OR or SC.")
            @PathVariable @NotBlank String stateId,
            @Parameter(description = "Required comma-separated group list. Current seeded examples effectively use a single stored group per state.")
            @RequestParam @NotBlank String groups,
            @Parameter(description = "Election selector. Default is 2024_pres, which matches the current seeded examples.")
            @RequestParam(required = false, defaultValue = "2024_pres") String election,
            @Parameter(description = "Required party selector. Expected values: DEM or REP.")
            @RequestParam @NotBlank String party
    ) {
        return dataService.getEiSupport(stateId, groups, election, party);
    }

    @Operation(
            summary = "GUI-16: Ensemble splits",
            description = "Status: Seeded contract. Route shape and seeded Mongo payloads exist, but the service is still marked Planned for next phase."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Ensemble split payload comparing race-blind and VRA-constrained distributions"
            ),
            @ApiResponse(
                    responseCode = "501",
                    description = "Current service behavior while the seeded contract is not yet activated"
            )
    })
    @GetMapping("/states/{stateId}/ensembles/splits")
    public Map<String, Object> getEnsembleSplits(
            @Parameter(description = "Required state code. Current supported values: OR or SC.")
            @PathVariable @NotBlank String stateId,
            @Parameter(description = "Ensemble selector. Controller default is final; current seeded compare payloads are stored under that selector.")
            @RequestParam(required = false, defaultValue = "final") String ensembleSize,
            @Parameter(description = "Election selector. Default is 2024_pres, which matches the current seeded examples.")
            @RequestParam(required = false, defaultValue = "2024_pres") String election
    ) {
        return dataService.getEnsembleSplits(stateId, ensembleSize, election);
    }

    @Operation(
            summary = "GUI-17: Box and whisker summaries",
            description = "Status: Seeded contract. Route shape and seeded Mongo payloads exist, but the service is still marked Planned for next phase."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Box-and-whisker payload for the requested group, ensemble type, and metric"
            ),
            @ApiResponse(
                    responseCode = "501",
                    description = "Current service behavior while the seeded contract is not yet activated"
            )
    })
    @GetMapping("/states/{stateId}/ensembles/box-whisker")
    public Map<String, Object> getBoxWhisker(
            @Parameter(description = "Required state code. Current supported values: OR or SC.")
            @PathVariable @NotBlank String stateId,
            @Parameter(description = "Required normalized demographic group key. Seeded examples use latino for OR and black for SC.")
            @RequestParam @NotBlank String group,
            @Parameter(description = "Required ensemble selector. Seeded values are vra_constrained or race_blind.")
            @RequestParam @NotBlank String ensembleType,
            @Parameter(description = "Required metric selector. Current seeded repository key is minority_share.")
            @RequestParam @NotBlank String metric
    ) {
        return dataService.getBoxWhisker(stateId, group, ensembleType, metric);
    }
}
