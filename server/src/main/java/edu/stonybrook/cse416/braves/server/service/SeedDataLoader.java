package edu.stonybrook.cse416.braves.server.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.stonybrook.cse416.braves.server.model.*;
import edu.stonybrook.cse416.braves.server.model.enums.EnsembleSize;
import edu.stonybrook.cse416.braves.server.model.enums.EnsembleType;
import edu.stonybrook.cse416.braves.server.model.enums.PartyKey;
import edu.stonybrook.cse416.braves.server.repository.*;
import edu.stonybrook.cse416.braves.server.util.ProjectPathResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
public class SeedDataLoader implements ApplicationRunner {
    private static final Logger LOG = LoggerFactory.getLogger(SeedDataLoader.class);

    private final ObjectMapper objectMapper;
    private final GeometryAssetService geometryAssetService;
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
    private final RunManifestRepository runManifestRepository;
    private final IngestManifestRepository ingestManifestRepository;

    @Value("${app.seed.enabled:true}")
    private boolean seedEnabled;

    @Value("${app.seed.root-path:}")
    private String configuredRootPath;

    public SeedDataLoader(
            ObjectMapper objectMapper,
            GeometryAssetService geometryAssetService,
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
            RunManifestRepository runManifestRepository,
            IngestManifestRepository ingestManifestRepository
    ) {
        this.objectMapper = objectMapper;
        this.geometryAssetService = geometryAssetService;
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
        this.runManifestRepository = runManifestRepository;
        this.ingestManifestRepository = ingestManifestRepository;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!seedEnabled) {
            LOG.info("Seed loader disabled");
            return;
        }

        Path root = ProjectPathResolver.resolveRoot(configuredRootPath);
        validatePrecinctCounts(root);
        validatePopulationRealism(root);
        if (stateRepository.count() == 0) seedStates();
        seedStateSummaries();
        seedEnsembleSummaries();
        seedDistrictTables();
        seedHeatmapBins();
        seedGingles(root);
        seedGinglesTables(root);
        if (eiSupportResultRepository.count() == 0) seedEiSupport(root);
        if (eiPrecinctBarCiRepository.count() == 0) seedEiPrecinctBarCi(root);
        if (eiKdeRepository.count() == 0) seedEiKde(root);
        if (ensembleSplitRepository.count() == 0) seedEnsembleSplits(root);
        if (boxWhiskerResultRepository.count() == 0) seedBoxWhiskers(root);
        seedInterestingPlans(root);
        if (vraImpactThresholdTableRepository.count() == 0) seedVraImpactThresholdTables(root);
        if (minorityEffectivenessBoxWhiskerRepository.count() == 0) seedMinorityEffectivenessBoxWhisker(root);
        if (minorityEffectivenessHistogramRepository.count() == 0) seedMinorityEffectivenessHistogram(root);
        if (runManifestRepository.count() == 0 || ingestManifestRepository.count() == 0) seedManifests();
        LOG.info("Mongo seed completed successfully");
    }

    private void validatePrecinctCounts(Path root) throws IOException {
        Path orPath = root.resolve("src/data/precincts_or.json");
        Path scPath = root.resolve("src/data/precincts_sc.json");

        int orCount = precinctCount(orPath);
        int scCount = precinctCount(scPath);

        if (orCount < 1000 || scCount < 1000) {
            throw new IllegalStateException("Precinct realism validation failed: OR=" + orCount + ", SC=" + scCount);
        }
        LOG.info("Precinct realism check passed: OR={}, SC={}", orCount, scCount);
    }

    private void validatePopulationRealism(Path root) throws IOException {
        int orPopulation = 4_272_371;
        int scPopulation = 5_478_831;

        validateStatePopulation("OR", orPopulation, root.resolve("src/data/precincts_or.json"), 3_500_000, 5_000_000);
        validateStatePopulation("SC", scPopulation, root.resolve("src/data/precincts_sc.json"), 4_500_000, 6_500_000);
    }

    @SuppressWarnings("unchecked")
    private void validateStatePopulation(
            String stateId,
            int population,
            Path precinctPath,
            int minExpectedPopulation,
            int maxExpectedPopulation
    ) throws IOException {
        Map<String, Object> topo = readJsonMap(precinctPath);
        List<Map<String, Object>> geometries = topologyGeometries(topo);

        long totalVotes = 0L;
        for (Map<String, Object> geometry : geometries) {
            Map<String, Object> properties = (Map<String, Object>) geometry.get("properties");
            Object votesTotal = properties.get("total_votes");
            if (votesTotal instanceof Number number) {
                totalVotes += number.longValue();
            }
        }

        if (population < minExpectedPopulation || population > maxExpectedPopulation) {
            throw new IllegalStateException("Population realism validation failed for " + stateId
                    + ": population=" + population + ", expectedRange=[" + minExpectedPopulation + "," + maxExpectedPopulation + "]");
        }

        if (totalVotes <= 0L || population <= totalVotes) {
            throw new IllegalStateException("Population realism validation failed for " + stateId
                    + ": population=" + population + ", totalVotes=" + totalVotes);
        }

        double popToVotesRatio = (double) population / (double) totalVotes;
        if (popToVotesRatio < 1.2 || popToVotesRatio > 3.0) {
            throw new IllegalStateException("Population realism validation failed for " + stateId
                    + ": populationToVotesRatio=" + popToVotesRatio);
        }

        LOG.info("{} population realism check passed: population={}, totalVotes={}, ratio={}",
                stateId, population, totalVotes, String.format(Locale.US, "%.3f", popToVotesRatio));
    }

    @SuppressWarnings("unchecked")
    private int precinctCount(Path topoPath) throws IOException {
        Map<String, Object> topo = readJsonMap(topoPath);
        List<Map<String, Object>> geometries = topologyGeometries(topo);
        return geometries.size();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> topologyGeometries(Map<String, Object> topo) {
        Map<String, Object> objects = (Map<String, Object>) topo.get("objects");
        if (objects == null || objects.isEmpty()) {
            throw new IllegalStateException("Topology is missing objects collection");
        }
        Map<String, Object> geometryCollection = (Map<String, Object>) objects.values().iterator().next();
        return (List<Map<String, Object>>) geometryCollection.get("geometries");
    }

    private void seedStates() {
        stateRepository.save(buildDoc(new StateDocument(), "OR", null, null, null, null, "TOTAL", Map.of(
                "stateId", "OR",
                "stateName", "Oregon",
                "totalDistricts", 6
        )));

        stateRepository.save(buildDoc(new StateDocument(), "SC", null, null, null, null, "TOTAL", Map.of(
                "stateId", "SC",
                "stateName", "South Carolina",
                "totalDistricts", 7
        )));
    }

    private void seedStateSummaries() {
        stateSummaryRepository.deleteAll();
        Map<String, Object> orPayload = new LinkedHashMap<>();
        orPayload.put("schemaVersion", "v1");
        orPayload.put("state", "OR");
        orPayload.put("totalDistricts", 6);
        orPayload.put("population", "4,272,371");
        orPayload.put("voterDistributionDem", "1,228,410 (55.6%)");
        orPayload.put("voterDistributionRep", "910,702 (41.3%)");
        orPayload.put("partyControl", "Democratic");
        orPayload.put("democratReps", "Suzanne Bonamici, Maxine Dexter, Val Hoyle, Janelle Bynum, Andrea Salinas");
        orPayload.put("republicanReps", "Cliff Bentz");
        orPayload.put("feasibleGroups", List.of("Latino", "Asian", "White"));
        orPayload.put("ensembleSummary", Map.of("available", true, "sizes", List.of(EnsembleSize.TEST.getKey(), EnsembleSize.FINAL.getKey()), "finalPlanCount", "5,000"));

        Map<String, Object> scPayload = new LinkedHashMap<>();
        scPayload.put("schemaVersion", "v1");
        scPayload.put("state", "SC");
        scPayload.put("totalDistricts", 7);
        scPayload.put("population", "5,478,831");
        scPayload.put("voterDistributionDem", "1,417,196 (41.03%)");
        scPayload.put("voterDistributionRep", "1,696,935 (49.13%)");
        scPayload.put("partyControl", "Republican");
        scPayload.put("democratReps", "James Clyburn");
        scPayload.put("republicanReps", "Nancy Mace, Joe Wilson, Sheri Biggs, William Timmons, Ralph Norman, Russell Fry");
        scPayload.put("feasibleGroups", List.of("Black", "Latino", "White"));
        scPayload.put("ensembleSummary", Map.of("available", true, "sizes", List.of(EnsembleSize.TEST.getKey(), EnsembleSize.FINAL.getKey()), "finalPlanCount", "5,000"));

        stateSummaryRepository.save(buildDoc(new StateSummaryDocument(), "OR", null, null, null, null, "TOTAL", orPayload));
        stateSummaryRepository.save(buildDoc(new StateSummaryDocument(), "SC", null, null, null, null, "TOTAL", scPayload));
    }

    private void seedEnsembleSummaries() {
        ensembleSummaryRepository.deleteAll();
        ensembleSummaryRepository.save(buildDoc(new EnsembleSummaryDocument(), "OR", null, null, null, null, "TOTAL", Map.of(
                "schemaVersion", "v1",
                "state", "OR",
                "finalPlanCount", "5,000",
                "populationEqualityThreshold", "0.50%"
        )));

        ensembleSummaryRepository.save(buildDoc(new EnsembleSummaryDocument(), "SC", null, null, null, null, "TOTAL", Map.of(
                "schemaVersion", "v1",
                "state", "SC",
                "finalPlanCount", "5,000",
                "populationEqualityThreshold", "0.50%"
        )));
    }

    private void seedDistrictTables() {
        districtTableRepository.deleteAll();
        districtTableRepository.save(buildDoc(new DistrictTableDocument(), "OR", "2024_pres", null, null, null, "TOTAL", Map.of(
                "schemaVersion", "v1",
                "state", "OR",
                "election", "2024_pres",
                "districts", List.of(
                        districtRow(1, "Suzanne Bonamici", "Democratic", "White", 24.1),
                        districtRow(2, "Cliff Bentz", "Republican", "White", -33.7),
                        districtRow(3, "Maxine Dexter", "Democratic", "White", 46.2),
                        districtRow(4, "Val Hoyle", "Democratic", "White", 8.9),
                        districtRow(5, "Janelle Bynum", "Democratic", "Black", 3.2),
                        districtRow(6, "Andrea Salinas", "Democratic", "Latino", 5.4)
                )
        )));

        districtTableRepository.save(buildDoc(new DistrictTableDocument(), "SC", "2024_pres", null, null, null, "TOTAL", Map.of(
                "schemaVersion", "v1",
                "state", "SC",
                "election", "2024_pres",
                "districts", List.of(
                        districtRow(1, "Nancy Mace", "Republican", "White", -13.8),
                        districtRow(2, "Joe Wilson", "Republican", "White", -22.4),
                        districtRow(3, "Sheri Biggs", "Republican", "White", -31.5),
                        districtRow(4, "William Timmons", "Republican", "White", -28.6),
                        districtRow(5, "Ralph Norman", "Republican", "White", -26.1),
                        districtRow(6, "James Clyburn", "Democratic", "Black", 15.3),
                        districtRow(7, "Russell Fry", "Republican", "White", -24.9)
                )
        )));
    }

    private void seedHeatmapBins() {
        heatmapBinRepository.deleteAll();
        heatmapBinRepository.save(buildDoc(new HeatmapBinDocument(), "OR", null, "latino", null, null, "TOTAL", heatmapPayload("OR", "Latino")));
        heatmapBinRepository.save(buildDoc(new HeatmapBinDocument(), "OR", null, "asian", null, null, "TOTAL", heatmapPayload("OR", "Asian")));
        heatmapBinRepository.save(buildDoc(new HeatmapBinDocument(), "SC", null, "black", null, null, "TOTAL", heatmapPayload("SC", "Black")));
        heatmapBinRepository.save(buildDoc(new HeatmapBinDocument(), "SC", null, "latino", null, null, "TOTAL", heatmapPayload("SC", "Latino")));
    }

    private Map<String, Object> heatmapPayload(String state, String group) {
        return Map.of(
                "schemaVersion", "v1",
                "state", state,
                "group", group,
                "binUnit", "percent",
                "bins", List.of(
                        Map.of("min", 0, "max", 10, "color", "#f7fcb9"),
                        Map.of("min", 10, "max", 20, "color", "#d9f0a3"),
                        Map.of("min", 20, "max", 30, "color", "#addd8e"),
                        Map.of("min", 30, "max", 40, "color", "#78c679"),
                        Map.of("min", 40, "max", 50, "color", "#41ab5d"),
                        Map.of("min", 50, "max", 100, "color", "#006837")
                ),
                "precomputed", true
        );
    }

    private void seedGingles(Path root) throws IOException {
        upsertGinglesResult("OR", "latino", root.resolve("mock-data/v1/gingles-scatter/OR_2024_latino.json"));
        upsertGinglesResult("OR", "asian", root.resolve("mock-data/v1/gingles-scatter/OR_2024_asian.json"));
        upsertGinglesResult("SC", "black", root.resolve("mock-data/v1/gingles-scatter/SC_2024_black.json"));
        upsertGinglesResult("SC", "latino", root.resolve("mock-data/v1/gingles-scatter/SC_2024_latino.json"));
    }

    private void seedGinglesTables(Path root) throws IOException {
        upsertGinglesTable("OR", "latino", root.resolve("mock-data/v1/gingles-table/OR_2024_latino.json"));
        upsertGinglesTable("OR", "asian", root.resolve("mock-data/v1/gingles-table/OR_2024_asian.json"));
        upsertGinglesTable("SC", "black", root.resolve("mock-data/v1/gingles-table/SC_2024_black.json"));
        upsertGinglesTable("SC", "latino", root.resolve("mock-data/v1/gingles-table/SC_2024_latino.json"));
    }

    private void upsertGinglesResult(String stateId, String groupKey, Path path) throws IOException {
        GinglesResultDocument doc = buildDoc(
                new GinglesResultDocument(),
                stateId,
                "2024_pres",
                groupKey,
                null,
                null,
                "TOTAL",
                readJsonMap(path)
        );
        ginglesResultRepository.findByStateIdAndGroupKeyAndElectionId(stateId, groupKey, "2024_pres")
                .ifPresent(existing -> doc.setId(existing.getId()));
        ginglesResultRepository.save(doc);
    }

    private void upsertGinglesTable(String stateId, String groupKey, Path path) throws IOException {
        GinglesTableDocument doc = buildDoc(
                new GinglesTableDocument(),
                stateId,
                "2024_pres",
                groupKey,
                null,
                null,
                "TOTAL",
                readJsonMap(path)
        );
        ginglesTableRepository.findByStateIdAndGroupKeyAndElectionId(stateId, groupKey, "2024_pres")
                .ifPresent(existing -> doc.setId(existing.getId()));
        ginglesTableRepository.save(doc);
    }

    private void seedEiSupport(Path root) throws IOException {
        eiSupportResultRepository.save(buildDoc(new EiSupportResultDocument(), "OR", "2024_pres", "latino", null, null, "CVAP",
                readJsonMap(root.resolve("mock-data/v1/ei-support/OR_2024_president.json"))));
        eiSupportResultRepository.save(buildDoc(new EiSupportResultDocument(), "OR", "2024_pres", "asian", null, null, "CVAP",
                readJsonMap(root.resolve("mock-data/v1/ei-support/OR_asian_2024_president.json"))));
        eiSupportResultRepository.save(buildDoc(new EiSupportResultDocument(), "SC", "2024_pres", "black", null, null, "CVAP",
                readJsonMap(root.resolve("mock-data/v1/ei-support/SC_2024_president.json"))));
        eiSupportResultRepository.save(buildDoc(new EiSupportResultDocument(), "SC", "2024_pres", "latino", null, null, "CVAP",
                readJsonMap(root.resolve("mock-data/v1/ei-support/SC_latino_2024_president.json"))));
    }

    private void seedEiPrecinctBarCi(Path root) throws IOException {
        saveEiPrecinctBarCi("OR", "latino", "2024_pres", PartyKey.DEM, root.resolve("mock-data/v1/ei-precinct-bar-ci/OR_demo.json"));
        saveEiPrecinctBarCi("OR", "latino", "2024_pres", PartyKey.REP, root.resolve("mock-data/v1/ei-precinct-bar-ci/OR_demo.json"));
        saveEiPrecinctBarCi("OR", "asian",  "2024_pres", PartyKey.DEM, root.resolve("mock-data/v1/ei-precinct-bar-ci/OR_asian_demo.json"));
        saveEiPrecinctBarCi("OR", "asian",  "2024_pres", PartyKey.REP, root.resolve("mock-data/v1/ei-precinct-bar-ci/OR_asian_demo.json"));
        saveEiPrecinctBarCi("SC", "black",  "2024_pres", PartyKey.DEM, root.resolve("mock-data/v1/ei-precinct-bar-ci/SC_demo.json"));
        saveEiPrecinctBarCi("SC", "black",  "2024_pres", PartyKey.REP, root.resolve("mock-data/v1/ei-precinct-bar-ci/SC_demo.json"));
        saveEiPrecinctBarCi("SC", "latino", "2024_pres", PartyKey.DEM, root.resolve("mock-data/v1/ei-precinct-bar-ci/SC_latino_demo.json"));
        saveEiPrecinctBarCi("SC", "latino", "2024_pres", PartyKey.REP, root.resolve("mock-data/v1/ei-precinct-bar-ci/SC_latino_demo.json"));
    }

    private void saveEiPrecinctBarCi(String stateId, String groupKey, String electionId, PartyKey partyKey, Path path) throws IOException {
        EiPrecinctBarCiDocument doc = buildDoc(new EiPrecinctBarCiDocument(), stateId, electionId, groupKey, null, null, "CVAP", readJsonMap(path));
        doc.setPartyKey(partyKey.getKey());
        eiPrecinctBarCiRepository.save(doc);
    }

    private void seedEiKde(Path root) throws IOException {
        eiKdeRepository.save(buildDoc(new EiKdeDocument(), "OR", "2024_pres", "latino", null, "support_gap", "CVAP",
                readJsonMap(root.resolve("mock-data/v1/ei-kde/OR_demo.json"))));
        eiKdeRepository.save(buildDoc(new EiKdeDocument(), "OR", "2024_pres", "asian",  null, "support_gap", "CVAP",
                readJsonMap(root.resolve("mock-data/v1/ei-kde/OR_asian_demo.json"))));
        eiKdeRepository.save(buildDoc(new EiKdeDocument(), "SC", "2024_pres", "black",  null, "support_gap", "CVAP",
                readJsonMap(root.resolve("mock-data/v1/ei-kde/SC_demo.json"))));
        eiKdeRepository.save(buildDoc(new EiKdeDocument(), "SC", "2024_pres", "latino", null, "support_gap", "CVAP",
                readJsonMap(root.resolve("mock-data/v1/ei-kde/SC_latino_demo.json"))));
    }

    private void seedEnsembleSplits(Path root) throws IOException {
        ensembleSplitRepository.save(buildDoc(new EnsembleSplitDocument(), "OR", "2024_pres", null, null, EnsembleSize.FINAL.getKey(), "TOTAL",
                readJsonMap(root.resolve("mock-data/v1/ensemble-splits/OR_compare.json"))));
        ensembleSplitRepository.save(buildDoc(new EnsembleSplitDocument(), "SC", "2024_pres", null, null, EnsembleSize.FINAL.getKey(), "TOTAL",
                readJsonMap(root.resolve("mock-data/v1/ensemble-splits/SC_compare.json"))));
    }

    private void seedBoxWhiskers(Path root) throws IOException {
        boxWhiskerResultRepository.save(buildDoc(new BoxWhiskerResultDocument(), "OR", "2024_pres", "latino", EnsembleType.VRA_CONSTRAINED.getKey(), "minority_share", "CVAP",
                readJsonMap(root.resolve("mock-data/v1/box-whisker/OR_latino_cvap_vra.json"))));
        boxWhiskerResultRepository.save(buildDoc(new BoxWhiskerResultDocument(), "OR", "2024_pres", "latino", EnsembleType.RACE_BLIND.getKey(),      "minority_share", "CVAP",
                readJsonMap(root.resolve("mock-data/v1/box-whisker/OR_latino_cvap_race_blind.json"))));
        boxWhiskerResultRepository.save(buildDoc(new BoxWhiskerResultDocument(), "OR", "2024_pres", "asian",  EnsembleType.VRA_CONSTRAINED.getKey(), "minority_share", "CVAP",
                readJsonMap(root.resolve("mock-data/v1/box-whisker/OR_asian_cvap_vra.json"))));
        boxWhiskerResultRepository.save(buildDoc(new BoxWhiskerResultDocument(), "OR", "2024_pres", "asian",  EnsembleType.RACE_BLIND.getKey(),      "minority_share", "CVAP",
                readJsonMap(root.resolve("mock-data/v1/box-whisker/OR_asian_cvap_race_blind.json"))));
        boxWhiskerResultRepository.save(buildDoc(new BoxWhiskerResultDocument(), "SC", "2024_pres", "black",  EnsembleType.VRA_CONSTRAINED.getKey(), "minority_share", "CVAP",
                readJsonMap(root.resolve("mock-data/v1/box-whisker/SC_black_cvap_vra.json"))));
        boxWhiskerResultRepository.save(buildDoc(new BoxWhiskerResultDocument(), "SC", "2024_pres", "black",  EnsembleType.RACE_BLIND.getKey(),      "minority_share", "CVAP",
                readJsonMap(root.resolve("mock-data/v1/box-whisker/SC_black_cvap_race_blind.json"))));
        boxWhiskerResultRepository.save(buildDoc(new BoxWhiskerResultDocument(), "SC", "2024_pres", "latino", EnsembleType.VRA_CONSTRAINED.getKey(), "minority_share", "CVAP",
                readJsonMap(root.resolve("mock-data/v1/box-whisker/SC_latino_cvap_vra.json"))));
        boxWhiskerResultRepository.save(buildDoc(new BoxWhiskerResultDocument(), "SC", "2024_pres", "latino", EnsembleType.RACE_BLIND.getKey(),      "minority_share", "CVAP",
                readJsonMap(root.resolve("mock-data/v1/box-whisker/SC_latino_cvap_race_blind.json"))));
    }

    private void seedInterestingPlans(Path root) {
        interestingPlanRepository.deleteAll();
        interestingPlanRepository.save(buildInterestingPlanDoc(
                "OR",
                "plan-42",
                "Oregon Opportunity Corridor",
                EnsembleType.RACE_BLIND.getKey(),
                "High Latino opportunity with competitive statewide split",
                geometryAssetService.getDistrictTopology("OR")
        ));
        interestingPlanRepository.save(buildInterestingPlanDoc(
                "SC",
                "plan-42",
                "South Carolina Coastal Rebalance",
                EnsembleType.VRA_CONSTRAINED.getKey(),
                "Expands Black-effective district probability while keeping core coastal continuity",
                geometryAssetService.getDistrictTopology("SC")
        ));
        interestingPlanRepository.save(buildInterestingPlanDoc(
                "OR",
                "plan-43",
                "Oregon Race-Blind Baseline",
                EnsembleType.RACE_BLIND.getKey(),
                "Representative race-blind plan showing Latino representation without VRA constraints",
                geometryAssetService.getDistrictTopology("OR")
        ));
        interestingPlanRepository.save(buildInterestingPlanDoc(
                "SC",
                "plan-43",
                "South Carolina Race-Blind Baseline",
                EnsembleType.RACE_BLIND.getKey(),
                "Representative race-blind plan showing Black representation under unconstrained redistricting",
                geometryAssetService.getDistrictTopology("SC")
        ));
    }

    private InterestingPlanDocument buildInterestingPlanDoc(
            String stateId,
            String planId,
            String planName,
            String ensembleType,
            String reasonInteresting,
            Map<String, Object> topology
    ) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("schemaVersion", "v1");
        payload.put("state", stateId);
        payload.put("planId", planId);
        payload.put("planName", planName);
        payload.put("ensembleType", ensembleType);
        payload.put("reasonInteresting", reasonInteresting);
        payload.put("summary", Map.of(
                "repWins", "OR".equals(stateId) ? 2 : 5,
                "demWins", "OR".equals(stateId) ? 4 : 2,
                "effectiveMinorityDistricts", "OR".equals(stateId) ? 2 : 3
        ));
        payload.put("topology", topology);

        InterestingPlanDocument doc = buildDoc(new InterestingPlanDocument(), stateId, "2024_pres", null, ensembleType, null, "TOTAL", payload);
        doc.setPlanId(planId);
        return doc;
    }

    private void seedVraImpactThresholdTables(Path root) throws IOException {
        vraImpactThresholdTableRepository.save(buildDoc(new VraImpactThresholdTableDocument(), "OR", "2024_pres", "latino", null, null, "CVAP",
                readJsonMap(root.resolve("mock-data/v1/vra-impact-thresholds/OR_latino_2024_pres.json"))));
        vraImpactThresholdTableRepository.save(buildDoc(new VraImpactThresholdTableDocument(), "OR", "2024_pres", "asian",  null, null, "CVAP",
                readJsonMap(root.resolve("mock-data/v1/vra-impact-thresholds/OR_asian_2024_pres.json"))));
        vraImpactThresholdTableRepository.save(buildDoc(new VraImpactThresholdTableDocument(), "SC", "2024_pres", "black",  null, null, "CVAP",
                readJsonMap(root.resolve("mock-data/v1/vra-impact-thresholds/SC_black_2024_pres.json"))));
        vraImpactThresholdTableRepository.save(buildDoc(new VraImpactThresholdTableDocument(), "SC", "2024_pres", "latino", null, null, "CVAP",
                readJsonMap(root.resolve("mock-data/v1/vra-impact-thresholds/SC_latino_2024_pres.json"))));
    }

    private void seedMinorityEffectivenessBoxWhisker(Path root) throws IOException {
        minorityEffectivenessBoxWhiskerRepository.save(buildDoc(new MinorityEffectivenessBoxWhiskerDocument(), "OR", "2024_pres", null, null, null, "CVAP",
                readJsonMap(root.resolve("mock-data/v1/minority-effectiveness-box-whisker/OR_2024_pres.json"))));
        minorityEffectivenessBoxWhiskerRepository.save(buildDoc(new MinorityEffectivenessBoxWhiskerDocument(), "SC", "2024_pres", null, null, null, "CVAP",
                readJsonMap(root.resolve("mock-data/v1/minority-effectiveness-box-whisker/SC_2024_pres.json"))));
    }

    private void seedMinorityEffectivenessHistogram(Path root) throws IOException {
        minorityEffectivenessHistogramRepository.save(buildDoc(new MinorityEffectivenessHistogramDocument(), "OR", "2024_pres", "latino", null, null, "CVAP",
                readJsonMap(root.resolve("mock-data/v1/minority-effectiveness-histogram/OR_latino_2024_pres.json"))));
        minorityEffectivenessHistogramRepository.save(buildDoc(new MinorityEffectivenessHistogramDocument(), "OR", "2024_pres", "asian",  null, null, "CVAP",
                readJsonMap(root.resolve("mock-data/v1/minority-effectiveness-histogram/OR_asian_2024_pres.json"))));
        minorityEffectivenessHistogramRepository.save(buildDoc(new MinorityEffectivenessHistogramDocument(), "SC", "2024_pres", "black",  null, null, "CVAP",
                readJsonMap(root.resolve("mock-data/v1/minority-effectiveness-histogram/SC_black_2024_pres.json"))));
        minorityEffectivenessHistogramRepository.save(buildDoc(new MinorityEffectivenessHistogramDocument(), "SC", "2024_pres", "latino", null, null, "CVAP",
                readJsonMap(root.resolve("mock-data/v1/minority-effectiveness-histogram/SC_latino_2024_pres.json"))));
    }

    private void seedManifests() {
        runManifestRepository.save(buildDoc(new RunManifestDocument(), null, "2024_pres", null, null, null, null, Map.of(
                "schemaVersion", "v1",
                "notes", "Seeded from local repository mock-data",
                "timestamp", Instant.now().toString()
        )));

        ingestManifestRepository.save(buildDoc(new IngestManifestDocument(), null, "2024_pres", null, null, null, null, Map.of(
                "schemaVersion", "v1",
                "source", "local-mock-data",
                "timestamp", Instant.now().toString()
        )));
    }

    private Map<String, Object> districtRow(int districtNumber, String representative, String party, String racialEthnicGroup, double voteMargin2024) {
        return Map.of(
                "districtNumber", districtNumber,
                "representative", representative,
                "party", party,
                "racialEthnicGroup", racialEthnicGroup,
                "voteMargin2024", voteMargin2024
        );
    }

    private <T extends BasePayloadDocument> T buildDoc(
            T doc,
            String stateId,
            String electionId,
            String groupKey,
            String ensembleType,
            String metricKey,
            String populationMeasure,
            Map<String, Object> payload
    ) {
        doc.setStateId(stateId);
        doc.setElectionId(electionId);
        doc.setGroupKey(groupKey);
        doc.setEnsembleType(ensembleType);
        doc.setMetricKey(metricKey);
        doc.setPopulationMeasure(populationMeasure);
        doc.setSchemaVersion("v1");
        doc.setSourceManifestId("seed-v1");
        doc.setCreatedAt(Instant.now());
        doc.setPayload(payload);
        return doc;
    }

    private Map<String, Object> readJsonMap(Path path) throws IOException {
        if (!Files.exists(path)) {
            throw new IllegalStateException("Required seed file not found: " + path);
        }
        return objectMapper.readValue(path.toFile(), new TypeReference<>() {
        });
    }
}
