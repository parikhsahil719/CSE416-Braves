package edu.stonybrook.cse416.braves.server.service;

import edu.stonybrook.cse416.braves.server.dto.StateOptionResponse;
import edu.stonybrook.cse416.braves.server.model.BasePayloadDocument;
import edu.stonybrook.cse416.braves.server.model.enums.PartyKey;
import edu.stonybrook.cse416.braves.server.repository.*;
import edu.stonybrook.cse416.braves.server.util.GroupThresholds;
import edu.stonybrook.cse416.braves.server.util.ProjectPathResolver;
import edu.stonybrook.cse416.braves.server.util.StateCodeUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import edu.stonybrook.cse416.braves.server.model.BoxWhiskerResultDocument;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.nio.file.Path;
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
    private final ObjectMapper objectMapper;
    @Value("${app.seed.root-path:}")
    private String configuredRootPath;

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
            MinorityEffectivenessHistogramRepository minorityEffectivenessHistogramRepository,
            ObjectMapper objectMapper
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
        this.objectMapper = objectMapper;
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
    public Map<String, Object> getBoxWhisker(
            String stateIdInput,
            String groupInput,
            String ensembleTypeInput,
            String metricInput,
            Integer ensembleIndexInput) {
        String stateId = normalizeState(stateIdInput);
        String group = normalizeGroup(groupInput);
        String ensembleType = normalizeToken(ensembleTypeInput, "ensembleType");
        String metric = normalizeToken(metricInput, "metric");
        Integer ensembleIndex = normalizeEnsembleIndex(ensembleIndexInput);
        // Reject unsupported state/group combinations before Mongo lookup so callers get a clear contract
        // error instead of an ambiguous missing-document response.
        requireFeasibleGroup(stateId, group);
        return payloadFrom(
                boxWhiskerResultRepository.findByStateIdAndGroupKeyAndEnsembleTypeAndMetricKeyAndEnsembleIndex(
                        stateId, group, ensembleType, metric, ensembleIndex),
                "Box-and-whisker payload not found for stateId=" + stateId
                        + ", group=" + group
                        + ", ensembleType=" + ensembleType
                        + ", metric=" + metric
                        + ", ensembleIndex=" + ensembleIndex
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

    // Derives majority-minority district ranges from min_eff_bw.json (SeaWulf minority-opportunity distributions).
    // For each ensemble run, the first/last non-zero histogram bins are that run's min/max opportunity counts.
    // We then aggregate runs to a single [min, max] range per ensemble/group.
    @Cacheable("majorityMinorityBar")
    public Map<String, Object> getMajorityMinorityBar(String stateIdInput, String electionInput) {
        String stateId = normalizeState(stateIdInput);
        String election = normalizeElection(electionInput);
        Map<String, Object> root = loadMinEffBw();
        String stateKey = "SC".equals(stateId) ? "south_carolina" : "oregon";
        @SuppressWarnings("unchecked")
        Map<String, Object> stateNode = (Map<String, Object>) root.get(stateKey);
        if (stateNode == null) {
            throw new NoSuchElementException("min_eff_bw.json missing state node: " + stateKey);
        }

        List<Map<String, Object>> groups = GroupThresholds.feasibleGroupsFor(stateId).stream().map(key -> {
            String minEffKey = toMinEffGroupKey(stateId, key);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("key", key);
            entry.put("label", capitalize(key));
            entry.put("raceBlind", majorityMinorityRangeFromHistograms(stateNode, "raceblind", minEffKey));
            entry.put("vraConstrained", majorityMinorityRangeFromHistograms(stateNode, "vra", minEffKey));
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

    private Map<String, Object> loadMinEffBw() {
        Path root = ProjectPathResolver.resolveRoot(configuredRootPath);
        Path source = root.resolve("preprocessing/output/kobe/min_eff_bw.json");
        try {
            return objectMapper.readValue(source.toFile(), new TypeReference<>() {});
        } catch (IOException e) {
            throw new IllegalStateException("Unable to read majority-minority source file: " + source, e);
        }
    }

    private String toMinEffGroupKey(String stateId, String groupKey) {
        // SeaWulf export uses "hispanic" for Oregon instead of "latino".
        if ("OR".equals(stateId) && "latino".equals(groupKey)) {
            return "hispanic";
        }
        return groupKey;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Integer> majorityMinorityRangeFromHistograms(
            Map<String, Object> stateNode,
            String ensembleKey,
            String groupKey) {
        Object runsRaw = stateNode.get(ensembleKey);
        if (!(runsRaw instanceof List<?> runs) || runs.isEmpty()) {
            throw new NoSuchElementException("min_eff_bw.json missing ensemble node: " + ensembleKey);
        }

        int aggregatedMin = Integer.MAX_VALUE;
        int aggregatedMax = Integer.MIN_VALUE;

        for (Object runRaw : runs) {
            if (!(runRaw instanceof Map<?, ?> runMapAny)) continue;
            Object histogramRaw = runMapAny.get(groupKey);
            if (!(histogramRaw instanceof Map<?, ?> histogramAny)) continue;
            @SuppressWarnings("unchecked")
            Map<String, Object> histogram = (Map<String, Object>) histogramAny;

            int runMin = Integer.MAX_VALUE;
            int runMax = Integer.MIN_VALUE;
            for (Map.Entry<String, Object> bucket : histogram.entrySet()) {
                int districtCount = Integer.parseInt(bucket.getKey());
                int frequency = ((Number) bucket.getValue()).intValue();
                if (frequency <= 0) continue;
                runMin = Math.min(runMin, districtCount);
                runMax = Math.max(runMax, districtCount);
            }
            if (runMin != Integer.MAX_VALUE) {
                aggregatedMin = Math.min(aggregatedMin, runMin);
                aggregatedMax = Math.max(aggregatedMax, runMax);
            }
        }

        if (aggregatedMin == Integer.MAX_VALUE) {
            throw new NoSuchElementException(
                    "min_eff_bw.json has no non-zero buckets for ensemble=" + ensembleKey + ", group=" + groupKey);
        }

        return Map.of("min", aggregatedMin, "max", aggregatedMax);
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

    private Integer normalizeEnsembleIndex(Integer ensembleIndexInput) {
        if (ensembleIndexInput == null || ensembleIndexInput < 1) {
            throw new IllegalArgumentException("ensembleIndex must be >= 1");
        }
        return ensembleIndexInput;
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
