package edu.stonybrook.cse416.braves.server.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.stonybrook.cse416.braves.server.util.StateCodeUtil;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;

@Service
public class GeometryAssetService {
    private static final Set<String> DISTRICT_PROPERTY_KEYS = Set.of("RESULT", "NAMELSAD", "district_number", "GEOID");
    private static final Set<String> PRECINCT_PROPERTY_KEYS = Set.of("GEOID", "total", "black", "asian", "hispanic");
    private static final Set<String> US_STATES_PROPERTY_KEYS = Set.of("name", "isActive");

    private final ObjectMapper objectMapper;

    public GeometryAssetService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public record GeometryAsset(Map<String, Object> body, String etag) {
    }

    @Cacheable("districtTopology")
    public GeometryAsset getDistrictTopologyAsset(String stateIdInput) {
        String stateId = StateCodeUtil.normalizeOrThrow(stateIdInput);
        return loadGeometryAsset(
                relativeDistrictTopologyPath(stateId),
                "District topology not found for stateId=" + stateId,
                DISTRICT_PROPERTY_KEYS
        );
    }

    public Map<String, Object> getDistrictTopology(String stateIdInput) {
        return getDistrictTopologyAsset(stateIdInput).body();
    }

    @Cacheable("precinctTopology")
    public GeometryAsset getPrecinctTopologyAsset(String stateIdInput) {
        String stateId = StateCodeUtil.normalizeOrThrow(stateIdInput);
        return loadGeometryAsset(
                relativePrecinctTopologyPath(stateId),
                "Precinct topology not found for stateId=" + stateId,
                PRECINCT_PROPERTY_KEYS
        );
    }

    public Map<String, Object> getPrecinctTopology(String stateIdInput) {
        return getPrecinctTopologyAsset(stateIdInput).body();
    }

    @Cacheable("usStatesTopology")
    public GeometryAsset getUsStatesTopologyAsset() {
        return loadGeometryAsset("geometry/us-states.json", "US states topology not found", US_STATES_PROPERTY_KEYS);
    }

    public Map<String, Object> getUsStatesTopology() {
        return getUsStatesTopologyAsset().body();
    }

    private String relativeDistrictTopologyPath(String stateId) {
        return switch (stateId) {
            case "OR" -> "geometry/oregon_congressional_districts.json";
            case "SC" -> "geometry/south_carolina_congressional_districts.json";
            default -> throw new IllegalArgumentException("Unsupported stateId=" + stateId);
        };
    }

    private String relativePrecinctTopologyPath(String stateId) {
        return switch (stateId) {
            case "OR" -> "geometry/precincts_or.json";
            case "SC" -> "geometry/precincts_sc.json";
            default -> throw new IllegalArgumentException("Unsupported stateId=" + stateId);
        };
    }

    private GeometryAsset loadGeometryAsset(String classpathLocation, String notFoundMessage, Set<String> propertyKeysToKeep) {
        Map<String, Object> sanitized = sanitizeTopology(readJsonMap(classpathLocation, notFoundMessage), propertyKeysToKeep);
        return new GeometryAsset(sanitized, computeEtag(sanitized));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> sanitizeTopology(Map<String, Object> topology, Set<String> propertyKeysToKeep) {
        Map<String, Object> sanitized = new LinkedHashMap<>();
        copyIfPresent(topology, sanitized, "type");
        copyIfPresent(topology, sanitized, "bbox");
        copyIfPresent(topology, sanitized, "transform");
        copyIfPresent(topology, sanitized, "arcs");

        Map<String, Object> objects = (Map<String, Object>) topology.get("objects");
        Map<String, Object> sanitizedObjects = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : objects.entrySet()) {
            sanitizedObjects.put(entry.getKey(), sanitizeGeometryCollection((Map<String, Object>) entry.getValue(), propertyKeysToKeep));
        }
        sanitized.put("objects", sanitizedObjects);
        return sanitized;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> sanitizeGeometryCollection(Map<String, Object> geometryCollection, Set<String> propertyKeysToKeep) {
        Map<String, Object> sanitized = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : geometryCollection.entrySet()) {
            if (!"geometries".equals(entry.getKey())) {
                sanitized.put(entry.getKey(), entry.getValue());
            }
        }

        List<Map<String, Object>> geometries = (List<Map<String, Object>>) geometryCollection.get("geometries");
        List<Map<String, Object>> sanitizedGeometries = new ArrayList<>(geometries.size());
        for (Map<String, Object> geometry : geometries) {
            sanitizedGeometries.add(sanitizeGeometry(geometry, propertyKeysToKeep));
        }
        sanitized.put("geometries", sanitizedGeometries);
        return sanitized;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> sanitizeGeometry(Map<String, Object> geometry, Set<String> propertyKeysToKeep) {
        Map<String, Object> sanitized = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : geometry.entrySet()) {
            if (!"properties".equals(entry.getKey())) {
                sanitized.put(entry.getKey(), entry.getValue());
            }
        }

        Map<String, Object> properties = (Map<String, Object>) geometry.get("properties");
        if (properties != null) {
            Map<String, Object> sanitizedProperties = new LinkedHashMap<>();
            for (String key : propertyKeysToKeep) {
                if (properties.containsKey(key)) {
                    sanitizedProperties.put(key, properties.get(key));
                }
            }
            sanitized.put("properties", sanitizedProperties);
        }

        return sanitized;
    }

    private void copyIfPresent(Map<String, Object> source, Map<String, Object> target, String key) {
        if (source.containsKey(key)) {
            target.put(key, source.get(key));
        }
    }

    private String computeEtag(Map<String, Object> payload) {
        try {
            byte[] bytes = objectMapper.writeValueAsBytes(payload);
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes);
            StringBuilder builder = new StringBuilder("\"");
            for (byte value : digest) {
                builder.append(String.format("%02x", value));
            }
            return builder.append('"').toString();
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to serialize geometry payload for ETag generation", exception);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 algorithm unavailable for ETag generation", exception);
        }
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
