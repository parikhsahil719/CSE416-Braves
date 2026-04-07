package edu.stonybrook.cse416.braves.server.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.stonybrook.cse416.braves.server.util.StateCodeUtil;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
public class GeometryAssetService {
    private final ObjectMapper objectMapper;

    public GeometryAssetService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> getDistrictTopology(String stateIdInput) {
        String stateId = StateCodeUtil.normalizeOrThrow(stateIdInput);
        return readJsonMap(relativeDistrictTopologyPath(stateId), "District topology not found for stateId=" + stateId);
    }

    public Map<String, Object> getDistrictGeoJson(String stateIdInput) {
        String stateId = StateCodeUtil.normalizeOrThrow(stateIdInput);
        return readJsonMap(relativeDistrictGeoJsonPath(stateId), "District GeoJSON not found for stateId=" + stateId);
    }

    public Map<String, Object> getPrecinctTopology(String stateIdInput) {
        String stateId = StateCodeUtil.normalizeOrThrow(stateIdInput);
        return readJsonMap(relativePrecinctTopologyPath(stateId), "Precinct topology not found for stateId=" + stateId);
    }

    public Map<String, Object> getUsStatesTopology() {
        return readJsonMap("geometry/us-states.json", "US states topology not found");
    }

    private String relativeDistrictTopologyPath(String stateId) {
        return switch (stateId) {
            case "OR" -> "geometry/oregon_congressional_districts.json";
            case "SC" -> "geometry/south_carolina_congressional_districts.json";
            default -> throw new IllegalArgumentException("Unsupported stateId=" + stateId);
        };
    }

    private String relativeDistrictGeoJsonPath(String stateId) {
        return switch (stateId) {
            case "OR" -> "geometry/oregon_congressional_districts.geojson";
            case "SC" -> "geometry/south_carolina_congressional_districts.geojson";
            default -> throw new IllegalArgumentException("Unsupported stateId=" + stateId);
        };
    }

    private String relativePrecinctTopologyPath(String stateId) {
        return switch (stateId) {
            case "OR" -> "geometry/OR-precincts-with-results.topology.json";
            case "SC" -> "geometry/SC-precincts-with-results.topology.json";
            default -> throw new IllegalArgumentException("Unsupported stateId=" + stateId);
        };
    }

    private Map<String, Object> readJsonMap(String classpathLocation, String notFoundMessage) {
        ClassPathResource resource = new ClassPathResource(classpathLocation);
        if (!resource.exists()) {
            throw new NoSuchElementException(notFoundMessage);
        }

        try (InputStream inputStream = resource.getInputStream()) {
            return objectMapper.readValue(inputStream, new TypeReference<>() {
            });
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to read geometry asset from classpath:" + classpathLocation, exception);
        }
    }
}
