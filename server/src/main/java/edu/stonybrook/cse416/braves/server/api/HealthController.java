package edu.stonybrook.cse416.braves.server.api;

import edu.stonybrook.cse416.braves.server.service.DatabaseHealthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@Tag(name = "Operational API", description = "Operational health endpoints for the Braves backend")
public class HealthController {
    private final DatabaseHealthService databaseHealthService;

    public HealthController(DatabaseHealthService databaseHealthService) {
        this.databaseHealthService = databaseHealthService;
    }

    @Operation(summary = "OPS-1: Service health", description = "Status: Live. Returns basic service availability information.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Service health payload")
    })
    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("status", "ok", "service", "braves-server");
    }

    @Operation(summary = "OPS-2: Database health", description = "Status: Live. Returns MongoDB availability and collection metadata.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Database health payload")
    })
    @GetMapping("/health/db")
    public Map<String, Object> dbHealth() {
        return databaseHealthService.getHealth();
    }
}
