package edu.stonybrook.cse416.braves.server.api;

import edu.stonybrook.cse416.braves.server.service.DatabaseHealthService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {
    private final DatabaseHealthService databaseHealthService;

    public HealthController(DatabaseHealthService databaseHealthService) {
        this.databaseHealthService = databaseHealthService;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("status", "ok", "service", "braves-server");
    }

    @GetMapping("/health/db")
    public Map<String, Object> dbHealth() {
        return databaseHealthService.getHealth();
    }
}
