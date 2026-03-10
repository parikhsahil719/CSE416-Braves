package edu.stonybrook.cse416.braves.server;

import edu.stonybrook.cse416.braves.server.repository.*;
import edu.stonybrook.cse416.braves.server.service.BackendDataService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertThrows;

class BackendDataServiceValidationTest {

    private BackendDataService service() {
        return new BackendDataService(
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }

    @Test
    void summaryIsSkeletonForNow() {
        assertThrows(UnsupportedOperationException.class, () -> service().getStateSummary("OR"));
    }

    @Test
    void heatmapIsSkeletonForNow() {
        assertThrows(UnsupportedOperationException.class, () -> service().getHeatmap("OR", "black"));
    }
}
