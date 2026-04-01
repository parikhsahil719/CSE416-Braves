package edu.stonybrook.cse416.braves.server.service;

import edu.stonybrook.cse416.braves.server.dto.StateOptionResponse;
import edu.stonybrook.cse416.braves.server.model.BasePayloadDocument;
import edu.stonybrook.cse416.braves.server.model.DistrictMapDocument;
import edu.stonybrook.cse416.braves.server.repository.*;
import edu.stonybrook.cse416.braves.server.util.GroupThresholds;
import edu.stonybrook.cse416.braves.server.util.StateCodeUtil;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;

@Service
public class BackendDataService {
    private static final String DEFAULT_ELECTION_ID = "2024_pres";
    private static final Set<String> PARTY_KEYS = Set.of("DEM", "REP");

    private final StateRepository stateRepository;
    private final DistrictMapRepository districtMapRepository;
    private final StateSummaryRepository stateSummaryRepository;
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
            DistrictMapRepository districtMapRepository,
            StateSummaryRepository stateSummaryRepository,
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
        this.districtMapRepository = districtMapRepository;
        this.stateSummaryRepository = stateSummaryRepository;
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
        String stateId = normalizeState(stateIdInput);
        DistrictMapDocument doc = districtMapRepository.findByStateId(stateId)
                .orElseThrow(() -> new NoSuchElementException("District map not found for stateId=" + stateId));
        return withStoredMetadata(doc);
    }

    public Map<String, Object> getStateSummary(String stateIdInput) {
        String stateId = normalizeState(stateIdInput);
        return payloadFrom(
                stateSummaryRepository.findByStateId(stateId),
                "State summary not found for stateId=" + stateId
        );
    }

    public Map<String, Object> getHeatmap(String stateIdInput, String groupInput) {
        String stateId = normalizeState(stateIdInput);
        String group = normalizeGroup(groupInput);
        requireFeasibleGroup(stateId, group);
        return payloadFrom(
                heatmapBinRepository.findByStateIdAndGroupKey(stateId, group),
                "Heatmap not found for stateId=" + stateId + ", group=" + group
        );
    }

    public Map<String, Object> getDistrictTable(String stateIdInput, String electionInput) {
        String stateId = normalizeState(stateIdInput);
        String election = normalizeElection(electionInput);
        return payloadFrom(
                districtTableRepository.findByStateIdAndElectionId(stateId, election),
                "District table not found for stateId=" + stateId + ", election=" + election
        );
    }

    public Map<String, Object> getGingles(String stateIdInput, String groupInput, String electionInput) {
        String stateId = normalizeState(stateIdInput);
        String group = normalizeGroup(groupInput);
        String election = normalizeElection(electionInput);
        requireFeasibleGroup(stateId, group);
        return payloadFrom(
                ginglesResultRepository.findByStateIdAndGroupKeyAndElectionId(stateId, group, election),
                "Gingles scatter not found for stateId=" + stateId + ", group=" + group + ", election=" + election
        );
    }

    public Map<String, Object> getGinglesTable(String stateIdInput, String groupInput, String electionInput) {
        String stateId = normalizeState(stateIdInput);
        String group = normalizeGroup(groupInput);
        String election = normalizeElection(electionInput);
        requireFeasibleGroup(stateId, group);
        return payloadFrom(
                ginglesTableRepository.findByStateIdAndGroupKeyAndElectionId(stateId, group, election),
                "Gingles table not found for stateId=" + stateId + ", group=" + group + ", election=" + election
        );
    }

    public Map<String, Object> getEiSupport(String stateIdInput, String groupsInput, String electionInput, String partyInput) {
        String stateId = normalizeState(stateIdInput);
        String group = normalizeGroupSelector(groupsInput);
        String election = normalizeElection(electionInput);
        normalizeParty(partyInput);
        requireFeasibleGroup(stateId, group);
        return payloadFrom(
                eiSupportResultRepository.findByStateIdAndElectionIdAndGroupKey(stateId, election, group),
                "EI support payload not found for stateId=" + stateId + ", group=" + group + ", election=" + election
        );
    }

    public Map<String, Object> getEiPrecinctBarCi(String stateIdInput, String groupInput, String electionInput, String partyInput) {
        String stateId = normalizeState(stateIdInput);
        String group = normalizeGroup(groupInput);
        String election = normalizeElection(electionInput);
        String party = normalizeParty(partyInput);
        requireFeasibleGroup(stateId, group);
        return payloadFrom(
                eiPrecinctBarCiRepository.findByStateIdAndGroupKeyAndElectionIdAndPartyKey(stateId, group, election, party),
                "EI precinct bar/CI payload not found for stateId=" + stateId + ", group=" + group + ", election=" + election + ", party=" + party
        );
    }

    public Map<String, Object> getEiKde(String stateIdInput, String groupInput, String electionInput, String metricInput) {
        String stateId = normalizeState(stateIdInput);
        String group = normalizeGroup(groupInput);
        String election = normalizeElection(electionInput);
        String metric = normalizeToken(metricInput, "metric");
        requireFeasibleGroup(stateId, group);
        return payloadFrom(
                eiKdeRepository.findByStateIdAndGroupKeyAndElectionIdAndMetricKey(stateId, group, election, metric),
                "EI KDE payload not found for stateId=" + stateId + ", group=" + group + ", election=" + election + ", metric=" + metric
        );
    }

    public Map<String, Object> getEnsembleSplits(String stateIdInput, String ensembleSizeInput, String electionInput) {
        String stateId = normalizeState(stateIdInput);
        String ensembleSize = normalizeToken(ensembleSizeInput, "ensembleSize");
        String election = normalizeElection(electionInput);
        return payloadFrom(
                ensembleSplitRepository.findByStateIdAndElectionIdAndMetricKey(stateId, election, ensembleSize),
                "Ensemble splits not found for stateId=" + stateId + ", election=" + election + ", ensembleSize=" + ensembleSize
        );
    }

    public Map<String, Object> getBoxWhisker(String stateIdInput, String groupInput, String ensembleTypeInput, String metricInput) {
        String stateId = normalizeState(stateIdInput);
        String group = normalizeGroup(groupInput);
        String ensembleType = normalizeToken(ensembleTypeInput, "ensembleType");
        String metric = normalizeToken(metricInput, "metric");
        requireFeasibleGroup(stateId, group);
        return payloadFrom(
                boxWhiskerResultRepository.findByStateIdAndGroupKeyAndEnsembleTypeAndMetricKey(stateId, group, ensembleType, metric),
                "Box-and-whisker payload not found for stateId=" + stateId + ", group=" + group + ", ensembleType=" + ensembleType + ", metric=" + metric
        );
    }

    public Map<String, Object> getInterestingPlan(String stateIdInput, String planIdInput) {
        String stateId = normalizeState(stateIdInput);
        String planId = normalizePlanId(planIdInput);
        return payloadFrom(
                interestingPlanRepository.findByStateIdAndPlanId(stateId, planId),
                "Interesting plan not found for stateId=" + stateId + ", planId=" + planId
        );
    }

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

    public Map<String, Object> getMinorityEffectivenessBoxWhisker(String stateIdInput, String electionInput) {
        String stateId = normalizeState(stateIdInput);
        String election = normalizeElection(electionInput);
        return payloadFrom(
                minorityEffectivenessBoxWhiskerRepository.findByStateIdAndElectionId(stateId, election),
                "Minority effectiveness box-and-whisker payload not found for stateId=" + stateId + ", election=" + election
        );
    }

    public Map<String, Object> getMinorityEffectivenessHistogram(String stateIdInput, String groupInput, String electionInput) {
        String stateId = normalizeState(stateIdInput);
        String group = normalizeGroup(groupInput);
        String election = normalizeElection(electionInput);
        requireFeasibleGroup(stateId, group);
        return payloadFrom(
                minorityEffectivenessHistogramRepository.findByStateIdAndGroupKeyAndElectionId(stateId, group, election),
                "Minority effectiveness histogram payload not found for stateId=" + stateId + ", group=" + group + ", election=" + election
        );
    }

    private String normalizeState(String stateIdInput) {
        return StateCodeUtil.normalizeOrThrow(stateIdInput);
    }

    private String normalizeElection(String electionInput) {
        if (electionInput == null || electionInput.isBlank()) {
            return DEFAULT_ELECTION_ID;
        }
        return electionInput.trim();
    }

    private String normalizeGroup(String groupInput) {
        return normalizeToken(groupInput, "group");
    }

    private String normalizeGroupSelector(String groupsInput) {
        String[] parts = normalizeToken(groupsInput, "groups").split(",");
        return parts[0].trim().toLowerCase(Locale.US);
    }

    private String normalizeParty(String partyInput) {
        if (partyInput == null || partyInput.isBlank()) {
            throw new IllegalArgumentException("party is required");
        }
        String normalized = partyInput.trim().toUpperCase(Locale.US);
        if (!PARTY_KEYS.contains(normalized)) {
            throw new IllegalArgumentException("party must be DEM or REP");
        }
        return normalized;
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

    private Map<String, Object> withStoredMetadata(BasePayloadDocument doc) {
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
