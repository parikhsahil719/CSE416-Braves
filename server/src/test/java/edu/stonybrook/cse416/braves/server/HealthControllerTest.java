package edu.stonybrook.cse416.braves.server;

import edu.stonybrook.cse416.braves.server.api.HealthController;
import edu.stonybrook.cse416.braves.server.service.DatabaseHealthService;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class HealthControllerTest {

    @Test
    void basicHealthEndpointReturnsServiceStatus() {
        HealthController controller = new HealthController(new FakeDatabaseHealthService());

        Map<String, Object> response = controller.health();

        assertEquals("ok", response.get("status"));
        assertEquals("braves-server", response.get("service"));
    }

    @Test
    void dbHealthEndpointReturnsDatabaseSnapshot() {
        HealthController controller = new HealthController(new FakeDatabaseHealthService());

        Map<String, Object> response = controller.dbHealth();

        assertEquals("ok", response.get("status"));
        assertEquals("cse416_braves", response.get("database"));
        assertEquals(Map.of("district_maps", 2L), response.get("collections"));
    }

    private static final class FakeDatabaseHealthService implements DatabaseHealthService {
        @Override
        public Map<String, Object> getHealth() {
            return Map.of(
                    "status", "ok",
                    "service", "braves-server",
                    "database", "cse416_braves",
                    "mongoStatus", "ok",
                    "collections", Map.of("district_maps", 2L),
                    "availableCollections", java.util.Set.of("district_maps", "states")
            );
        }
    }
}
