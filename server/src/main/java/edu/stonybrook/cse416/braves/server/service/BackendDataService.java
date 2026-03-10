package edu.stonybrook.cse416.braves.server.service;

import edu.stonybrook.cse416.braves.server.dto.StateOptionResponse;
import edu.stonybrook.cse416.braves.server.model.DistrictMapDocument;
import edu.stonybrook.cse416.braves.server.repository.DistrictMapRepository;
import edu.stonybrook.cse416.braves.server.repository.StateRepository;
import edu.stonybrook.cse416.braves.server.util.PopulationMeasure;
import edu.stonybrook.cse416.braves.server.util.StateCodeUtil;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
public class BackendDataService {
    private final StateRepository stateRepository;
    private final DistrictMapRepository districtMapRepository;

    public BackendDataService(
            StateRepository stateRepository,
            DistrictMapRepository districtMapRepository
    ) {
        this.stateRepository = stateRepository;
        this.districtMapRepository = districtMapRepository;
    }

    public List<StateOptionResponse> getStates() {
        return stateRepository.findAllByOrderByStateIdAsc().stream()
                .map(doc -> new StateOptionResponse(
                        doc.getStateId(),
                        String.valueOf(doc.getPayload().get("stateName")),
                        Integer.parseInt(String.valueOf(doc.getPayload().get("totalDistricts")))
                ))
                .toList();
    }

    public Map<String, Object> getDistrictMap(String stateIdInput) {
        String stateId = StateCodeUtil.normalizeOrThrow(stateIdInput);
        DistrictMapDocument doc = districtMapRepository.findByStateId(stateId)
                .orElseThrow(() -> new NoSuchElementException("District map not found for stateId=" + stateId));
        return withPopulationMeasure(doc.getPayload(), null);
    }

    private Map<String, Object> withPopulationMeasure(Map<String, Object> payload, PopulationMeasure measure) {
        Map<String, Object> copy = new LinkedHashMap<>(payload);
        if (measure != null) {
            copy.put("populationMeasureUsed", measure.name());
        }
        if (!copy.containsKey("schemaVersion")) {
            copy.put("schemaVersion", "v1");
        }
        return copy;
    }
}
