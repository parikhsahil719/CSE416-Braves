package edu.stonybrook.cse416.braves.server.api;

import edu.stonybrook.cse416.braves.server.dto.StateOptionResponse;
import edu.stonybrook.cse416.braves.server.service.BackendDataService;
import edu.stonybrook.cse416.braves.server.service.GeometryAssetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@Validated
@Tag(name = "State API", description = "Professor-facing client/server routes for GUI use cases")
public class StateController {
    private static final CacheControl STATIC_GEOMETRY_CACHE = CacheControl.maxAge(Duration.ofDays(7)).cachePublic();

    private final BackendDataService dataService;
    private final GeometryAssetService geometryAssetService;

    public StateController(BackendDataService dataService, GeometryAssetService geometryAssetService) {
        this.dataService = dataService;
        this.geometryAssetService = geometryAssetService;
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
            summary = "GUI-2: Enacted district map topology for state",
            description = "Status: Live. Returns the enacted district TopoJSON payload for a supported state."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "TopoJSON topology payload for the enacted congressional district map"
            )
    })
    @GetMapping("/states/{stateId}/districts/enacted/topology")
    public ResponseEntity<Map<String, Object>> getDistrictTopology(
            @Parameter(description = "Required state code. Current supported values: OR or SC.")
            @PathVariable @NotBlank String stateId,
            WebRequest webRequest
    ) {
        return cachedGeometryResponse(geometryAssetService.getDistrictTopologyAsset(stateId), webRequest);
    }

    @Operation(
            summary = "GUI-4 geometry: Precinct topology for state",
            description = "Status: Live. Returns the precinct TopoJSON payload for a supported state."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "TopoJSON topology payload for precinct geometry"
            )
    })
    @GetMapping("/states/{stateId}/precincts/topology")
    public ResponseEntity<Map<String, Object>> getPrecinctTopology(
            @Parameter(description = "Required state code. Current supported values: OR or SC.")
            @PathVariable @NotBlank String stateId,
            WebRequest webRequest
    ) {
        return cachedGeometryResponse(geometryAssetService.getPrecinctTopologyAsset(stateId), webRequest);
    }

    @Operation(
            summary = "Splash map: US states topology",
            description = "Status: Live. Returns the TopoJSON payload for the splash-page US states overview map."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "TopoJSON topology payload for the US states overview map"
            )
    })
    @GetMapping("/maps/us-states/topology")
    public ResponseEntity<Map<String, Object>> getUsStatesTopology(WebRequest webRequest) {
        return cachedGeometryResponse(geometryAssetService.getUsStatesTopologyAsset(), webRequest);
    }

    @Operation(
            summary = "GUI-3: State summary",
            description = "Status: Live. Returns the seeded summary payload for a supported state."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "State summary payload containing statewide summary data and feasible groups"
            )
    })
    @GetMapping("/states/{stateId}/state-summary")
    public Map<String, Object> getStateSummary(
            @Parameter(description = "Required state code. Current supported values: OR or SC.")
            @PathVariable @NotBlank String stateId
    ) {
        return dataService.getStateSummary(stateId);
    }

    @Operation(
            summary = "State page Ensembles tab: Ensemble summary",
            description = "Status: Live. Returns the seeded ensemble-summary payload for a supported state."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Ensemble summary payload containing the seeded ensemble metadata for the tab"
            )
    })
    @GetMapping("/states/{stateId}/ensembles-summary")
    public Map<String, Object> getEnsembleSummary(
            @Parameter(description = "Required state code. Current supported values: OR or SC.")
            @PathVariable @NotBlank String stateId
    ) {
        return dataService.getEnsembleSummary(stateId);
    }

    @Operation(
            summary = "GUI-4: Precomputed precinct heatmap bins",
            description = "Status: Live. Returns the stored legend/bin payload for the requested state and group."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Heatmap legend/bin payload for the requested state and demographic group"
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
            description = "Status: Live. Returns the enacted district table for the requested election."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "District table payload for the enacted map and requested election"
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
            summary = "GUI-9: Gingles analysis scatter plot",
            description = "Status: Live. Returns the stored Gingles scatter payload for the requested state, group, and election."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Gingles scatter payload with precinct points and optional regression curves"
            )
    })
    @GetMapping("/states/{stateId}/analysis/gingles")
    public Map<String, Object> getGingles(
            @Parameter(description = "Required state code. Current supported values: OR or SC.")
            @PathVariable @NotBlank String stateId,
            @Parameter(description = "Required normalized demographic group key. Seeded examples use latino for OR and black for SC.")
            @RequestParam @NotBlank String group,
            @Parameter(description = "Election selector. Default is 2024_pres, which matches the current seeded examples.")
            @RequestParam(required = false, defaultValue = "2024_pres") String election
    ) {
        return dataService.getGingles(stateId, group, election);
    }

    @Operation(
            summary = "GUI-10: Gingles precinct table",
            description = "Status: Live. Returns the stored precinct-level Gingles table payload for the requested state, group, and election."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Gingles precinct table payload"
            )
    })
    @GetMapping("/states/{stateId}/analysis/gingles/table")
    public Map<String, Object> getGinglesTable(
            @Parameter(description = "Required state code. Current supported values: OR or SC.")
            @PathVariable @NotBlank String stateId,
            @Parameter(description = "Required normalized demographic group key. Seeded examples use latino for OR and black for SC.")
            @RequestParam @NotBlank String group,
            @Parameter(description = "Election selector. Default is 2024_pres, which matches the current seeded examples.")
            @RequestParam(required = false, defaultValue = "2024_pres") String election
    ) {
        return dataService.getGinglesTable(stateId, group, election);
    }

    @Operation(
            summary = "GUI-12: EI support distribution",
            description = "Status: Live. Returns the stored ecological inference support distribution payload."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Ecological inference support distribution payload"
            )
    })
    @GetMapping("/states/{stateId}/analysis/ei-support")
    public Map<String, Object> getEiSupport(
            @Parameter(description = "Required state code. Current supported values: OR or SC.")
            @PathVariable @NotBlank String stateId,
            @Parameter(description = "Required group selector. Current stored examples use one focal group per state.")
            @RequestParam @NotBlank String groups,
            @Parameter(description = "Election selector. Default is 2024_pres, which matches the current seeded examples.")
            @RequestParam(required = false, defaultValue = "2024_pres") String election,
            @Parameter(description = "Required party selector. Expected values: DEM or REP.")
            @RequestParam @NotBlank String party
    ) {
        return dataService.getEiSupport(stateId, groups, election, party);
    }

    @Operation(
            summary = "GUI-13: EI precinct bar chart with confidence intervals",
            description = "Status: Live. Returns the stored EI category peak and confidence interval payload."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "EI precinct bar chart payload with confidence intervals"
            )
    })
    @GetMapping("/states/{stateId}/analysis/ei-precinct-bar-ci")
    public Map<String, Object> getEiPrecinctBarCi(
            @Parameter(description = "Required state code. Current supported values: OR or SC.")
            @PathVariable @NotBlank String stateId,
            @Parameter(description = "Required normalized demographic group key. Seeded examples use latino for OR and black for SC.")
            @RequestParam @NotBlank String group,
            @Parameter(description = "Election selector. Default is 2024_pres, which matches the current seeded examples.")
            @RequestParam(required = false, defaultValue = "2024_pres") String election,
            @Parameter(description = "Required party selector. Expected values: DEM or REP.")
            @RequestParam @NotBlank String party
    ) {
        return dataService.getEiPrecinctBarCi(stateId, group, election, party);
    }

    @Operation(
            summary = "GUI-15: EI KDE comparison",
            description = "Status: Live. Returns the stored EI KDE comparison payload."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "EI KDE comparison payload"
            )
    })
    @GetMapping("/states/{stateId}/analysis/ei-kde")
    public Map<String, Object> getEiKde(
            @Parameter(description = "Required state code. Current supported values: OR or SC.")
            @PathVariable @NotBlank String stateId,
            @Parameter(description = "Required normalized demographic group key. Seeded examples use latino for OR and black for SC.")
            @RequestParam @NotBlank String group,
            @Parameter(description = "Election selector. Default is 2024_pres, which matches the current seeded examples.")
            @RequestParam(required = false, defaultValue = "2024_pres") String election,
            @Parameter(description = "Metric selector. Default is support_gap.")
            @RequestParam(required = false, defaultValue = "support_gap") String metric
    ) {
        return dataService.getEiKde(stateId, group, election, metric);
    }

    @Operation(
            summary = "GUI-16: Ensemble split comparison",
            description = "Status: Live. Returns the stored race-blind versus VRA-constrained split comparison payload."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Ensemble split payload comparing race-blind and VRA-constrained distributions"
            )
    })
    @GetMapping("/states/{stateId}/ensembles/splits")
    public Map<String, Object> getEnsembleSplits(
            @Parameter(description = "Required state code. Current supported values: OR or SC.")
            @PathVariable @NotBlank String stateId,
            @Parameter(description = "Ensemble selector. Default is final.")
            @RequestParam(required = false, defaultValue = "final") String ensembleSize,
            @Parameter(description = "Election selector. Default is 2024_pres, which matches the current seeded examples.")
            @RequestParam(required = false, defaultValue = "2024_pres") String election
    ) {
        return dataService.getEnsembleSplits(stateId, ensembleSize, election);
    }

    @Operation(
            summary = "GUI-17: Box-and-whisker ensemble summary",
            description = "Status: Live. Returns the stored box-and-whisker payload for the requested group, ensemble type, and metric."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Box-and-whisker payload for the requested group, ensemble type, and metric"
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
            @Parameter(description = "Metric selector. Default is minority_share.")
            @RequestParam(required = false, defaultValue = "minority_share") String metric
    ) {
        return dataService.getBoxWhisker(stateId, group, ensembleType, metric);
    }

    @Operation(
            summary = "GUI-19: Interesting district plan",
            description = "Status: Live. Returns the stored interesting-plan metadata plus TopoJSON payload."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Interesting plan payload with metadata and map-ready TopoJSON"
            )
    })
    @GetMapping("/states/{stateId}/districts/interesting")
    public Map<String, Object> getInterestingPlan(
            @Parameter(description = "Required state code. Current supported values: OR or SC.")
            @PathVariable @NotBlank String stateId,
            @Parameter(description = "Required interesting-plan selector. Current seeded example uses plan-42.")
            @RequestParam @NotBlank String planId
    ) {
        return dataService.getInterestingPlan(stateId, planId);
    }

    @Operation(
            summary = "GUI-20: VRA impact threshold table",
            description = "Status: Live. Returns the stored legal-threshold comparison table for the requested group and election."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "VRA impact threshold comparison table"
            )
    })
    @GetMapping("/states/{stateId}/analysis/vra-impact-thresholds")
    public Map<String, Object> getVraImpactThresholds(
            @Parameter(description = "Required state code. Current supported values: OR or SC.")
            @PathVariable @NotBlank String stateId,
            @Parameter(description = "Required normalized demographic group key. Seeded examples use latino for OR and black for SC.")
            @RequestParam @NotBlank String group,
            @Parameter(description = "Election selector. Default is 2024_pres, which matches the current seeded examples.")
            @RequestParam(required = false, defaultValue = "2024_pres") String election
    ) {
        return dataService.getVraImpactThresholds(stateId, group, election);
    }

    @Operation(
            summary = "GUI-21: Minority effectiveness box-and-whisker comparison",
            description = "Status: Live. Returns the stored by-group minority-effectiveness box summaries for the requested election."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Minority effectiveness box-and-whisker comparison payload"
            )
    })
    @GetMapping("/states/{stateId}/analysis/minority-effectiveness/box-whisker")
    public Map<String, Object> getMinorityEffectivenessBoxWhisker(
            @Parameter(description = "Required state code. Current supported values: OR or SC.")
            @PathVariable @NotBlank String stateId,
            @Parameter(description = "Election selector. Default is 2024_pres, which matches the current seeded examples.")
            @RequestParam(required = false, defaultValue = "2024_pres") String election
    ) {
        return dataService.getMinorityEffectivenessBoxWhisker(stateId, election);
    }

    @Operation(
            summary = "GUI-22: Minority effectiveness histogram",
            description = "Status: Live. Returns the stored overlapping minority-effectiveness histogram payload."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Minority effectiveness histogram payload"
            )
    })
    @GetMapping("/states/{stateId}/analysis/minority-effectiveness/histogram")
    public Map<String, Object> getMinorityEffectivenessHistogram(
            @Parameter(description = "Required state code. Current supported values: OR or SC.")
            @PathVariable @NotBlank String stateId,
            @Parameter(description = "Required normalized demographic group key. Seeded examples use latino for OR and black for SC.")
            @RequestParam @NotBlank String group,
            @Parameter(description = "Election selector. Default is 2024_pres, which matches the current seeded examples.")
            @RequestParam(required = false, defaultValue = "2024_pres") String election
    ) {
        return dataService.getMinorityEffectivenessHistogram(stateId, group, election);
    }

    private ResponseEntity<Map<String, Object>> cachedGeometryResponse(GeometryAssetService.GeometryAsset asset, WebRequest webRequest) {
        if (webRequest.checkNotModified(asset.etag())) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED)
                    .cacheControl(STATIC_GEOMETRY_CACHE)
                    .eTag(asset.etag())
                    .build();
        }

        return ResponseEntity.ok()
                .cacheControl(STATIC_GEOMETRY_CACHE)
                .eTag(asset.etag())
                .body(asset.body());
    }
}
