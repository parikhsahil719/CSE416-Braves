package edu.stonybrook.cse416.braves.server;

import edu.stonybrook.cse416.braves.server.api.StateController;
import edu.stonybrook.cse416.braves.server.dto.StateOptionResponse;
import edu.stonybrook.cse416.braves.server.service.BackendDataService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class StateControllerTest {

    @Test
    void districtMapResponseDisablesCaching() {
        StateController controller = new StateController(new FakeBackendDataService());

        ResponseEntity<Map<String, Object>> response = controller.getDistrictMap("OR");

        assertEquals(200, response.getStatusCode().value());
        assertEquals("no-cache", response.getHeaders().getFirst(HttpHeaders.PRAGMA));
        assertEquals("0", response.getHeaders().getFirst(HttpHeaders.EXPIRES));
        assertEquals("no-store, must-revalidate", response.getHeaders().getCacheControl());
        assertEquals("FeatureCollection", response.getBody().get("type"));
    }

    private static final class FakeBackendDataService extends BackendDataService {
        FakeBackendDataService() {
            super(null, null);
        }

        @Override
        public List<StateOptionResponse> getStates() {
            throw new UnsupportedOperationException("Not needed in this test");
        }

        @Override
        public Map<String, Object> getDistrictMap(String stateIdInput) {
            return Map.of(
                    "schemaVersion", "v1",
                    "type", "FeatureCollection",
                    "features", List.of()
            );
        }
    }
}
