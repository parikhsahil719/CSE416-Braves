package edu.stonybrook.cse416.braves.server.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@Tag(name = "Operational API", description = "Operational endpoints for the Braves backend")
public class MetaController {

    // Captured once at class-load time; changes on every server restart.
    private static final Instant BOOT_TIME = Instant.now();

    @Operation(
        summary = "OPS-3: Server metadata",
        description = "Returns the server boot time as ISO-8601. "
            + "Clients compare this value against localStorage to detect a server restart "
            + "and invalidate their TanStack Query cache accordingly."
    )
    @ApiResponses({ @ApiResponse(responseCode = "200", description = "Server metadata payload") })
    @GetMapping("/api/meta")
    public Map<String, Object> meta() {
        return Map.of("bootTime", BOOT_TIME.toString());
    }
}
