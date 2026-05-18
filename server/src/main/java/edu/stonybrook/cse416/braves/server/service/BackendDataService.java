package edu.stonybrook.cse416.braves.server.service;

import edu.stonybrook.cse416.braves.server.dto.StateOptionResponse;
import edu.stonybrook.cse416.braves.server.model.BasePayloadDocument;
import edu.stonybrook.cse416.braves.server.model.enums.PartyKey;
import edu.stonybrook.cse416.braves.server.repository.*;
import edu.stonybrook.cse416.braves.server.util.GroupThresholds;
import edu.stonybrook.cse416.braves.server.util.StateCodeUtil;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import edu.stonybrook.cse416.braves.server.model.BoxWhiskerResultDocument;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BackendDataService {
    // Omitted election selectors fall back to the seeded baseline dataset instead of forcing every caller
    // to repeat the only election currently guaranteed to exist.
    private static final String DEFAULT_ELECTION_ID = "2024_pres";

    private final StateRepository stateRepository;
    private final StateSummaryRepository stateSummaryRepository;
    private final EnsembleSummaryRepository ensembleSummaryRepository;
    private final DistrictTableRepository districtTableRepository;
    private final HeatmapBinRepository heatmapBinRepository;
    private final GinglesResultRepository ginglesResultRepository;
    private final GinglesTableRepository ginglesTableRepository;
    private final EiSupportResultRepository eiSupportResultRepository;
    private final EiPrecinctBarCiRepository eiPrecinctBarCiRepository;
    private final EiKdeRepository eiKdeRepository;
    private final EnsembleSplitRepository ensembleSplitRepository;
    private final BoxWhiskerResultRepository boxWhiskerResultRepository;
    private final InterestingPlanRepository interestingPlanRepository;
    private final VraImpactThresholdTableRepository vraImpactThresholdTableRepository;
    private final MinorityEffectivenessBoxWhiskerRepository minorityEffectivenessBoxWhiskerRepository;
    private final MinorityEffectivenessHistogramRepository minorityEffectivenessHistogramRepository;

    public BackendDataService(
            StateRepository stateRepository,
            StateSummaryRepository stateSummaryRepository,
            EnsembleSummaryRepository ensembleSummaryRepository,
            DistrictTableRepository districtTableRepository,
            HeatmapBinRepository heatmapBinRepository,
            GinglesResultRepository ginglesResultRepository,
            GinglesTableRepository ginglesTableRepository,
            EiSupportResultRepository eiSupportResultRepository,
            EiPrecinctBarCiRepository eiPrecinctBarCiRepository,
            EiKdeRepository eiKdeRepository,
            EnsembleSplitRepository ensembleSplitRepository,
            BoxWhiskerResultRepository boxWhiskerResultRepository,
            InterestingPlanRepository interestingPlanRepository,
            VraImpactThresholdTableRepository vraImpactThresholdTableRepository,
            MinorityEffectivenessBoxWhiskerRepository minorityEffectivenessBoxWhiskerRepository,
            MinorityEffectivenessHistogramRepository minorityEffectivenessHistogramRepository
    ) {
        this.stateRepository = stateRepository;
        this.stateSummaryRepository = stateSummaryRepository;
        this.ensembleSummaryRepository = ensembleSummaryRepository;
        this.districtTableRepository = districtTableRepository;
        this.heatmapBinRepository = heatmapBinRepository;
        this.ginglesResultRepository = ginglesResultRepository;
        this.ginglesTableRepository = ginglesTableRepository;
        this.eiSupportResultRepository = eiSupportResultRepository;
        this.eiPrecinctBarCiRepository = eiPrecinctBarCiRepository;
        this.eiKdeRepository = eiKdeRepository;
        this.ensembleSplitRepository = ensembleSplitRepository;
        this.boxWhiskerResultRepository = boxWhiskerResultRepository;
        this.interestingPlanRepository = interestingPlanRepository;
        this.vraImpactThresholdTableRepository = vraImpactThresholdTableRepository;
        this.minorityEffectivenessBoxWhiskerRepository = minorityEffectivenessBoxWhiskerRepository;
        this.minorityEffectivenessHistogramRepository = minorityEffectivenessHistogramRepository;
    }

    @Cacheable("states")
    public List<StateOptionResponse> getStates() {
        return stateRepository.findAllByOrderByStateIdAsc().stream()
                .map(doc -> new StateOptionResponse(
                        doc.getStateId(),
                        String.valueOf(doc.getPayload().get("stateName")),
                        Integer.parseInt(String.valueOf(doc.getPayload().get("totalDistricts")))
                ))
                .toList();
    }

    @Cacheable("stateSummary")
    public Map<String, Object> getStateSummary(String stateIdInput) {
        String stateId = normalizeState(stateIdInput);
        return payloadFrom(
                stateSummaryRepository.findByStateId(stateId),
                "State summary not found for stateId=" + stateId
        );
    }

    @Cacheable("ensembleSummary")
    public Map<String, Object> getEnsembleSummary(String stateIdInput) {
        String stateId = normalizeState(stateIdInput);
        return payloadFrom(
                ensembleSummaryRepository.findByStateId(stateId),
                "Ensemble summary not found for stateId=" + stateId
        );
    }

    @Cacheable("heatmap")
    public Map<String, Object> getHeatmap(String stateIdInput, String groupInput) {
        String stateId = normalizeState(stateIdInput);
        String group = normalizeGroup(groupInput);
        // Reject unsupported state/group combinations before Mongo lookup so callers get a clear contract
        // error instead of an ambiguous missing-document response.
        requireFeasibleGroup(stateId, group);
        return payloadFrom(
                heatmapBinRepository.findByStateIdAndGroupKey(stateId, group),
                "Heatmap not found for stateId=" + stateId + ", group=" + group
        );
    }

    @Cacheable("districtTable")
    public Map<String, Object> getDistrictTable(String stateIdInput, String electionInput) {
        String stateId = normalizeState(stateIdInput);
        String election = normalizeElection(electionInput);
        return payloadFrom(
                districtTableRepository.findByStateIdAndElectionId(stateId, election),
                "District table not found for stateId=" + stateId + ", election=" + election
        );
    }

    @Cacheable("gingles")
    public Map<String, Object> getGingles(String stateIdInput, String groupInput, String electionInput) {
        String stateId = normalizeState(stateIdInput);
        String group = normalizeGroup(groupInput);
        String election = normalizeElection(electionInput);
        // Reject unsupported state/group combinations before Mongo lookup so callers get a clear contract
        // error instead of an ambiguous missing-document response.
        requireFeasibleGroup(stateId, group);
        return payloadFrom(
                ginglesResultRepository.findByStateIdAndGroupKeyAndElectionId(stateId, group, election),
                "Gingles scatter not found for stateId=" + stateId + ", group=" + group + ", election=" + election
        );
    }

    @Cacheable("ginglesTable")
    public Map<String, Object> getGinglesTable(String stateIdInput, String groupInput, String electionInput) {
        String stateId = normalizeState(stateIdInput);
        String group = normalizeGroup(groupInput);
        String election = normalizeElection(electionInput);
        // Reject unsupported state/group combinations before Mongo lookup so callers get a clear contract
        // error instead of an ambiguous missing-document response.
        requireFeasibleGroup(stateId, group);
        return payloadFrom(
                ginglesTableRepository.findByStateIdAndGroupKeyAndElectionId(stateId, group, election),
                "Gingles table not found for stateId=" + stateId + ", group=" + group + ", election=" + election
        );
    }

    @Cacheable("eiSupport")
    public Map<String, Object> getEiSupport(String stateIdInput, String groupsInput, String electionInput, String partyInput) {
        String stateId = normalizeState(stateIdInput);
        // The frontend query parameter is plural, but the seeded backend stores one focal group per
        // document, so only the first normalized selector participates in the lookup.
        String group = normalizeGroupSelector(groupsInput);
        String election = normalizeElection(electionInput);
        String party = normalizeParty(partyInput);
        // Reject unsupported state/group combinations before Mongo lookup so callers get a clear contract
        // error instead of an ambiguous missing-document response.
        requireFeasibleGroup(stateId, group);
        return payloadFrom(
                eiSupportResultRepository.findByStateIdAndElectionIdAndGroupKeyAndPartyKey(stateId, election, group, party),
                "EI support payload not found for stateId=" + stateId + ", group=" + group + ", election=" + election + ", party=" + party
        );
    }

    @Cacheable("eiPrecinctBarCi")
    public Map<String, Object> getEiPrecinctBarCi(String stateIdInput, String groupInput, String electionInput, String partyInput) {
        String stateId = normalizeState(stateIdInput);
        String group = normalizeGroup(groupInput);
        String election = normalizeElection(electionInput);
        String party = normalizeParty(partyInput);
        // Reject unsupported state/group combinations before Mongo lookup so callers get a clear contract
        // error instead of an ambiguous missing-document response.
        requireFeasibleGroup(stateId, group);
        return payloadFrom(
                eiPrecinctBarCiRepository.findByStateIdAndGroupKeyAndElectionIdAndPartyKey(stateId, group, election, party),
                "EI precinct bar/CI payload not found for stateId=" + stateId + ", group=" + group + ", election=" + election + ", party=" + party
        );
    }

    @Cacheable("eiKde")
    public Map<String, Object> getEiKde(String stateIdInput, String groupInput, String electionInput, String metricInput, String partyInput) {
        String stateId = normalizeState(stateIdInput);
        String group = normalizeGroup(groupInput);
        String election = normalizeElection(electionInput);
        String metric = normalizeToken(metricInput, "metric");
        String party = normalizeParty(partyInput);
        // Reject unsupported state/group combinations before Mongo lookup so callers get a clear contract
        // error instead of an ambiguous missing-document response.
        requireFeasibleGroup(stateId, group);
        return payloadFrom(
                eiKdeRepository.findByStateIdAndGroupKeyAndElectionIdAndMetricKeyAndPartyKey(stateId, group, election, metric, party),
                "EI KDE payload not found for stateId=" + stateId + ", group=" + group + ", election=" + election + ", metric=" + metric + ", party=" + party
        );
    }

    @Cacheable("ensembleSplits")
    public Map<String, Object> getEnsembleSplits(String stateIdInput, String ensembleSizeInput, String electionInput) {
        String stateId = normalizeState(stateIdInput);
        String ensembleSize = normalizeToken(ensembleSizeInput, "ensembleSize");
        String election = normalizeElection(electionInput);
        return payloadFrom(
                ensembleSplitRepository.findByStateIdAndElectionIdAndMetricKey(stateId, election, ensembleSize),
                "Ensemble splits not found for stateId=" + stateId + ", election=" + election + ", ensembleSize=" + ensembleSize
        );
    }

    @Cacheable("boxWhisker")
    public Map<String, Object> getBoxWhisker(String stateIdInput, String groupInput, String ensembleTypeInput, String metricInput) {
        String stateId = normalizeState(stateIdInput);
        String group = normalizeGroup(groupInput);
        String ensembleType = normalizeToken(ensembleTypeInput, "ensembleType");
        String metric = normalizeToken(metricInput, "metric");
        // Reject unsupported state/group combinations before Mongo lookup so callers get a clear contract
        // error instead of an ambiguous missing-document response.
        requireFeasibleGroup(stateId, group);
        return payloadFrom(
                boxWhiskerResultRepository.findByStateIdAndGroupKeyAndEnsembleTypeAndMetricKey(stateId, group, ensembleType, metric),
                "Box-and-whisker payload not found for stateId=" + stateId + ", group=" + group + ", ensembleType=" + ensembleType + ", metric=" + metric
        );
    }

    @Cacheable("interestingPlanList")
    public List<Map<String, Object>> getInterestingPlanList(String stateIdInput) {
        String stateId = normalizeState(stateIdInput);
        return interestingPlanRepository.findByStateId(stateId)
                .stream()
                .filter(this::hasRenderableInterestingPlanTopology)
                .map(doc -> payloadFrom(Optional.of(doc), ""))
                .collect(Collectors.toList());
    }

    @Cacheable("interestingPlan")
    public Map<String, Object> getInterestingPlan(String stateIdInput, String planIdInput) {
        String stateId = normalizeState(stateIdInput);
        String planId = normalizePlanId(planIdInput);
        BasePayloadDocument doc = interestingPlanRepository.findByStateIdAndPlanId(stateId, planId)
                .filter(this::hasRenderableInterestingPlanTopology)
                .orElseThrow(() -> new NoSuchElementException(
                        "Interesting plan not found for stateId=" + stateId + ", planId=" + planId
                ));
        return withStoredMetadata(doc);
    }

    @Cacheable("vraImpactThresholds")
    public Map<String, Object> getVraImpactThresholds(String stateIdInput, String groupInput, String electionInput) {
        String stateId = normalizeState(stateIdInput);
        String group = normalizeGroup(groupInput);
        String election = normalizeElection(electionInput);
        requireFeasibleGroup(stateId, group);
        return payloadFrom(
                vraImpactThresholdTableRepository.findByStateIdAndGroupKeyAndElectionId(stateId, group, election),
                "VRA impact threshold payload not found for stateId=" + stateId + ", group=" + group + ", election=" + election
        );
    }

    // Spring caches each (stateId, election, ensembleType, ensembleIndex) combination independently
    // because the frontend flips between ensemble views repeatedly within a single session.
    @Cacheable("minorityEffectivenessBoxWhisker")
    public Map<String, Object> getMinorityEffectivenessBoxWhisker(
            String stateIdInput, String electionInput,
            String ensembleType, Integer ensembleIndex) {
        String stateId  = normalizeState(stateIdInput);
        String election = normalizeElection(electionInput);
        return payloadFrom(
                minorityEffectivenessBoxWhiskerRepository
                        .findByStateIdAndElectionIdAndEnsembleTypeAndEnsembleIndex(
                                stateId, election, ensembleType, ensembleIndex),
                "Minority effectiveness box-and-whisker payload not found for stateId=" + stateId
                        + ", election=" + election
                        + ", ensembleType=" + ensembleType
                        + ", ensembleIndex=" + ensembleIndex
        );
    }

    @Cacheable("minorityEffectivenessHistogram")
    public Map<String, Object> getMinorityEffectivenessHistogram(String stateIdInput, String groupInput, String electionInput) {
        String stateId = normalizeState(stateIdInput);
        String group = normalizeGroup(groupInput);
        String election = normalizeElection(electionInput);
        // Reject unsupported state/group combinations before Mongo lookup so callers get a clear contract
        // error instead of an ambiguous missing-document response.
        requireFeasibleGroup(stateId, group);
        return payloadFrom(
                minorityEffectivenessHistogramRepository.findByStateIdAndGroupKeyAndElectionId(stateId, group, election),
                "Minority effectiveness histogram payload not found for stateId=" + stateId + ", group=" + group + ", election=" + election
        );
    }

    // Derives majority-minority district ranges from already-seeded box_whisker_results (minority_share metric).
    // A rank is majority-minority when cvapShare > 0.5; min = count(ranks where every plan exceeded 0.5),
    // max = count(ranks where at least one plan exceeded 0.5).
    @Cacheable("majorityMinorityBar")
    public Map<String, Object> getMajorityMinorityBar(String stateIdInput, String electionInput) {
        String stateId = normalizeState(stateIdInput);
        String election = normalizeElection(electionInput);

        List<BoxWhiskerResultDocument> rbDocs =
                boxWhiskerResultRepository.findByStateIdAndEnsembleTypeAndMetricKey(stateId, "race_blind", "minority_share");
        List<BoxWhiskerResultDocument> vraDocs =
                boxWhiskerResultRepository.findByStateIdAndEnsembleTypeAndMetricKey(stateId, "vra_constrained", "minority_share");

        List<Map<String, Object>> groups = GroupThresholds.feasibleGroupsFor(stateId).stream().map(key -> {
            Map<String, Object> rbPayload  = payloadForGroup(rbDocs, key);
            Map<String, Object> vraPayload = payloadForGroup(vraDocs, key);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("key", key);
            entry.put("label", capitalize(key));
            entry.put("raceBlind", majorityMinorityRange(rbPayload));
            entry.put("vraConstrained", majorityMinorityRange(vraPayload));
            return entry;
        }).collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("schemaVersion", "v1");
        response.put("chartType", "majority-minority-bar");
        response.put("state", stateId);
        response.put("election", electionLabel(election));
        response.put("totalDistricts", "SC".equals(stateId) ? 7 : 6);
        response.put("groups", groups);
        return response;
    }

    private Map<String, Object> payloadForGroup(List<BoxWhiskerResultDocument> docs, String groupKey) {
        return docs.stream()
                .filter(d -> groupKey.equals(d.getGroupKey()))
                .findFirst()
                .map(BoxWhiskerResultDocument::getPayload)
                .orElseThrow(() -> new NoSuchElementException(
                        "Box-whisker result not found for groupKey=" + groupKey));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Integer> majorityMinorityRange(Map<String, Object> bwPayload) {
        List<Map<String, Object>> rankSummaries = (List<Map<String, Object>>) bwPayload.get("rankSummaries");
        int min = 0, max = 0;
        for (Map<String, Object> rs : rankSummaries) {
            if (toDouble(rs.get("min")) > 0.5) min++;
            if (toDouble(rs.get("max")) > 0.5) max++;
        }
        return Map.of("min", min, "max", max);
    }

    private double toDouble(Object value) {
        if (value instanceof Number n) return n.doubleValue();
        return Double.parseDouble(String.valueOf(value));
    }

    private String capitalize(String key) {
        if (key == null || key.isBlank()) return key;
        return Character.toUpperCase(key.charAt(0)) + key.substring(1);
    }

    private String electionLabel(String electionId) {
        return "2024_pres".equals(electionId) ? "2024 Presidential" : electionId;
    }

    private String normalizeState(String stateIdInput) {
        return StateCodeUtil.normalizeOrThrow(stateIdInput);
    }

    private String normalizeElection(String electionInput) {
        // Election is the only selector with a backend default because the seeded dataset currently treats
        // 2024_pres as the baseline slice; other selectors must be explicit to avoid accidental widening.
        if (electionInput == null || electionInput.isBlank()) {
            return DEFAULT_ELECTION_ID;
        }
        return electionInput.trim();
    }

    private String normalizeGroup(String groupInput) {
        return normalizeToken(groupInput, "group");
    }

    private String normalizeGroupSelector(String groupsInput) {
        // EI support documents are keyed by one stored focal-group token even though the request shape allows
        // a comma-separated selector list.
        String[] parts = normalizeToken(groupsInput, "groups").split(",");
        return parts[0].trim().toLowerCase(Locale.US);
    }

    private String normalizeParty(String partyInput) {
        return PartyKey.fromString(partyInput).getKey();
    }

    private String normalizePlanId(String planIdInput) {
        if (planIdInput == null || planIdInput.isBlank()) {
            throw new IllegalArgumentException("planId is required");
        }
        return planIdInput.trim();
    }

    private String normalizeToken(String input, String label) {
        if (input == null || input.isBlank()) {
            throw new IllegalArgumentException(label + " is required");
        }
        return input.trim().toLowerCase(Locale.US);
    }

    private void requireFeasibleGroup(String stateId, String group) {
        if (!GroupThresholds.isFeasible(stateId, group)) {
            throw new IllegalArgumentException("Group does not meet threshold or is unsupported for state");
        }
    }

    private Map<String, Object> payloadFrom(Optional<? extends BasePayloadDocument> docOpt, String notFoundMessage) {
        BasePayloadDocument doc = docOpt.orElseThrow(() -> new NoSuchElementException(notFoundMessage));
        return withStoredMetadata(doc);
    }

    @SuppressWarnings("unchecked")
    private boolean hasRenderableInterestingPlanTopology(BasePayloadDocument doc) {
        Map<String, Object> payload = doc.getPayload();
        if (payload == null) {
            return false;
        }
        Object topologyValue = payload.get("topology");
        if (!(topologyValue instanceof Map<?, ?> topology)) {
            return false;
        }
        Object objectsValue = topology.get("objects");
        if (!(objectsValue instanceof Map<?, ?> objects)) {
            return false;
        }
        for (Object geometryCollectionValue : objects.values()) {
            if (!(geometryCollectionValue instanceof Map<?, ?> geometryCollection)) {
                continue;
            }
            Object geometriesValue = geometryCollection.get("geometries");
            if (geometriesValue instanceof List<?> geometries && !geometries.isEmpty()) {
                return true;
            }
        }
        return false;
    }

    private Map<String, Object> withStoredMetadata(BasePayloadDocument doc) {
        // Keep the public payload shape authoritative, but backfill stored metadata when the payload omitted it
        // so callers still receive the normalized contract.
        Map<String, Object> copy = new LinkedHashMap<>(doc.getPayload());
        if (doc.getPopulationMeasure() != null && !copy.containsKey("populationMeasureUsed")) {
            copy.put("populationMeasureUsed", doc.getPopulationMeasure());
        }
        if (!copy.containsKey("schemaVersion")) {
            copy.put("schemaVersion", doc.getSchemaVersion() != null ? doc.getSchemaVersion() : "v1");
        }
        return copy;
    }
}
