package edu.stonybrook.cse416.braves.server.api;

import edu.stonybrook.cse416.braves.server.dto.StateOptionResponse;
import edu.stonybrook.cse416.braves.server.service.BackendDataService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
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
    public ResponseEntity<Map<String, Object>> getDistrictMap(@PathVariable @NotBlank String stateId) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore().mustRevalidate())
                .header(HttpHeaders.PRAGMA, "no-cache")
                .header(HttpHeaders.EXPIRES, "0")
                .body(dataService.getDistrictMap(stateId));
    }
}
