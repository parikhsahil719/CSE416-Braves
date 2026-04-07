package edu.stonybrook.cse416.braves.server.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GeometryAssetServiceTest {

    private final GeometryAssetService geometryAssetService = new GeometryAssetService(new ObjectMapper());

    @Test
    void loadsDistrictTopologyFromJsonAssetWithResultField() {
        Map<String, Object> topology = geometryAssetService.getDistrictTopology("OR");
        Map<String, Object> objects = castMap(topology.get("objects"));
        Map<String, Object> layer = castMap(objects.get("layer"));
        List<Map<String, Object>> geometries = castList(layer.get("geometries"));
        Map<String, Object> properties = castMap(geometries.get(0).get("properties"));

        assertEquals("Topology", topology.get("type"));
        assertEquals("DEMOCRATIC", properties.get("RESULT"));
    }

    @Test
    void loadsRenamedUsStatesTopologyJsonAsset() {
        Map<String, Object> topology = geometryAssetService.getUsStatesTopology();
        Map<String, Object> objects = castMap(topology.get("objects"));
        Map<String, Object> states = castMap(objects.get("us-states"));
        List<Map<String, Object>> geometries = castList(states.get("geometries"));
        Map<String, Object> properties = castMap(geometries.get(0).get("properties"));

        assertEquals("Topology", topology.get("type"));
        assertFalse(objects.isEmpty());
        assertTrue(properties.containsKey("name"));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> castMap(Object value) {
        return (Map<String, Object>) value;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> castList(Object value) {
        return (List<Map<String, Object>>) value;
    }
}
