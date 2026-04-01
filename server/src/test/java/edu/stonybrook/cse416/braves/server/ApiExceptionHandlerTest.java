package edu.stonybrook.cse416.braves.server;

import edu.stonybrook.cse416.braves.server.config.ApiExceptionHandler;
import edu.stonybrook.cse416.braves.server.dto.SkeletonResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ApiExceptionHandlerTest {

    @Test
    void unsupportedOperationMapsToSkeletonResponse() {
        ApiExceptionHandler handler = new ApiExceptionHandler();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/states/OR/summary");

        ResponseEntity<SkeletonResponse> response = handler.handleNotImplemented(
                new UnsupportedOperationException("Planned for next phase"),
                request
        );

        assertEquals(HttpStatus.NOT_IMPLEMENTED, response.getStatusCode());
        assertEquals("v1", response.getBody().schemaVersion());
        assertEquals("skeleton", response.getBody().status());
        assertEquals("/api/states/OR/summary", response.getBody().route());
    }
}
