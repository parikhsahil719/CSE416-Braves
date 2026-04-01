package edu.stonybrook.cse416.braves.server.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.stonybrook.cse416.braves.server.model.*;
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
    private final RunManifestRepository runManifestRepository;
    private final IngestManifestRepository ingestManifestRepository;

    @Value("${app.seed.enabled:true}")
    private boolean seedEnabled;

    @Value("${app.seed.root-path:}")
    private String configuredRootPath;

    public SeedDataLoader(
            ObjectMapper objectMapper,
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
            MinorityEffectivenessHistogramRepository minorityEffectivenessHistogramRepository,
            RunManifestRepository runManifestRepository,
            IngestManifestRepository ingestManifestRepository
    ) {
        this.objectMapper = objectMapper;
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
        if (districtMapRepository.count() == 0) seedDistrictMaps(root);
        if (stateSummaryRepository.count() == 0) seedStateSummaries();
        if (districtTableRepository.count() == 0) seedDistrictTables();
        seedHeatmapBins();
        if (ginglesResultRepository.count() == 0) seedGingles(root);
        if (ginglesTableRepository.count() == 0) seedGinglesTables(root);
        if (eiSupportResultRepository.count() == 0) seedEiSupport(root);
        if (eiPrecinctBarCiRepository.count() == 0) seedEiPrecinctBarCi(root);
        if (eiKdeRepository.count() == 0) seedEiKde(root);
        if (ensembleSplitRepository.count() == 0) seedEnsembleSplits(root);
        if (boxWhiskerResultRepository.count() == 0) seedBoxWhiskers(root);
        if (interestingPlanRepository.count() == 0) seedInterestingPlans(root);
        if (vraImpactThresholdTableRepository.count() == 0) seedVraImpactThresholdTables(root);
        if (minorityEffectivenessBoxWhiskerRepository.count() == 0) seedMinorityEffectivenessBoxWhisker(root);
        if (minorityEffectivenessHistogramRepository.count() == 0) seedMinorityEffectivenessHistogram(root);
        if (runManifestRepository.count() == 0 || ingestManifestRepository.count() == 0) seedManifests();
        LOG.info("Mongo seed completed successfully");
    }

    private void validatePrecinctCounts(Path root) throws IOException {
        Path orPath = root.resolve("src/data/OR-precincts-with-results.json");
        Path scPath = root.resolve("src/data/SC-precincts-with-results.json");

        int orCount = precinctCount(orPath, "OR");
        int scCount = precinctCount(scPath, "SC");

        if (orCount < 1000 || scCount < 1000) {
            throw new IllegalStateException("Precinct realism validation failed: OR=" + orCount + ", SC=" + scCount);
        }
        LOG.info("Precinct realism check passed: OR={}, SC={}", orCount, scCount);
    }

    private void validatePopulationRealism(Path root) throws IOException {
        int orPopulation = 4_272_371;
        int scPopulation = 5_478_831;

        validateStatePopulation("OR", orPopulation, root.resolve("src/data/OR-precincts-with-results.json"), 3_500_000, 5_000_000);
        validateStatePopulation("SC", scPopulation, root.resolve("src/data/SC-precincts-with-results.json"), 4_500_000, 6_500_000);
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
        Map<String, Object> objects = (Map<String, Object>) topo.get("objects");
        Map<String, Object> stateObj = (Map<String, Object>) objects.get(stateId);
        List<Map<String, Object>> geometries = (List<Map<String, Object>>) stateObj.get("geometries");

        long totalVotes = 0L;
        for (Map<String, Object> geometry : geometries) {
            Map<String, Object> properties = (Map<String, Object>) geometry.get("properties");
            Object votesTotal = properties.get("votes_total");
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
    private int precinctCount(Path topoPath, String objectKey) throws IOException {
        Map<String, Object> topo = readJsonMap(topoPath);
        Map<String, Object> objects = (Map<String, Object>) topo.get("objects");
        Map<String, Object> stateObj = (Map<String, Object>) objects.get(objectKey);
        List<Object> geometries = (List<Object>) stateObj.get("geometries");
        return geometries.size();
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

    private void seedDistrictMaps(Path root) throws IOException {
        districtMapRepository.save(buildDoc(
                new DistrictMapDocument(),
                "OR", null, null, null, null,
                null,
                readJsonMap(root.resolve("src/data/oregon_congressional_districts.geojson"))
        ));
        districtMapRepository.save(buildDoc(
                new DistrictMapDocument(),
                "SC", null, null, null, null,
                null,
                readJsonMap(root.resolve("src/data/south_carolina_congressional_districts.geojson"))
        ));
    }

    private void seedStateSummaries() {
        Map<String, Object> orPayload = new LinkedHashMap<>();
        orPayload.put("schemaVersion", "v1");
        orPayload.put("state", "OR");
        orPayload.put("totalDistricts", 6);
        orPayload.put("population", "4,272,371");
        orPayload.put("voterDistributionDem", "1,228,410 (55.6%)");
        orPayload.put("voterDistributionRep", "910,702 (41.3%)");
        orPayload.put("partyControl", "Democrat");
        orPayload.put("democratReps", "Suzanne Bonamici, Maxine Dexter, Val Hoyle, Janelle Bynum, Andrea Salinas");
        orPayload.put("republicanReps", "Cliff Bentz");
        orPayload.put("feasibleGroups", List.of("Latino", "Asian", "White"));
        orPayload.put("ensembleSummary", Map.of("available", true, "sizes", List.of("test", "final"), "finalPlanCount", 5000));

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
        scPayload.put("ensembleSummary", Map.of("available", true, "sizes", List.of("test", "final"), "finalPlanCount", 5000));

        stateSummaryRepository.save(buildDoc(new StateSummaryDocument(), "OR", null, null, null, null, "TOTAL", orPayload));
        stateSummaryRepository.save(buildDoc(new StateSummaryDocument(), "SC", null, null, null, null, "TOTAL", scPayload));
    }

    private void seedDistrictTables() {
        districtTableRepository.save(buildDoc(new DistrictTableDocument(), "OR", "2024_pres", null, null, null, "TOTAL", Map.of(
                "schemaVersion", "v1",
                "state", "OR",
                "election", "2024_pres",
                "districts", List.of(
                        districtRow(1, "Suzanne Bonamici", "Democrat", "White", 24.1),
                        districtRow(2, "Cliff Bentz", "Republican", "White", -33.7),
                        districtRow(3, "Maxine Dexter", "Democrat", "White", 46.2),
                        districtRow(4, "Val Hoyle", "Democrat", "White", 8.9),
                        districtRow(5, "Janelle Bynum", "Democrat", "Black", 3.2),
                        districtRow(6, "Andrea Salinas", "Democrat", "Latino", 5.4)
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
                        districtRow(6, "James Clyburn", "Democrat", "Black", 15.3),
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
        ginglesResultRepository.save(buildDoc(new GinglesResultDocument(), "OR", "2024_pres", "latino", null, null, "TOTAL",
                readJsonMap(root.resolve("mock-data/v1/gingles-scatter/OR_2024_latino.json"))));
        ginglesResultRepository.save(buildDoc(new GinglesResultDocument(), "SC", "2024_pres", "black", null, null, "TOTAL",
                readJsonMap(root.resolve("mock-data/v1/gingles-scatter/SC_2024_black.json"))));
    }

    private void seedGinglesTables(Path root) throws IOException {
        ginglesTableRepository.save(buildDoc(new GinglesTableDocument(), "OR", "2024_pres", "latino", null, null, "TOTAL",
                readJsonMap(root.resolve("mock-data/v1/gingles-table/OR_2024_latino.json"))));
        ginglesTableRepository.save(buildDoc(new GinglesTableDocument(), "SC", "2024_pres", "black", null, null, "TOTAL",
                readJsonMap(root.resolve("mock-data/v1/gingles-table/SC_2024_black.json"))));
    }

    private void seedEiSupport(Path root) throws IOException {
        eiSupportResultRepository.save(buildDoc(new EiSupportResultDocument(), "OR", "2024_pres", "latino", null, null, "CVAP",
                readJsonMap(root.resolve("mock-data/v1/ei-support/OR_2024_president.json"))));
        eiSupportResultRepository.save(buildDoc(new EiSupportResultDocument(), "SC", "2024_pres", "black", null, null, "CVAP",
                readJsonMap(root.resolve("mock-data/v1/ei-support/SC_2024_president.json"))));
    }

    private void seedEiPrecinctBarCi(Path root) throws IOException {
        saveEiPrecinctBarCi("OR", "latino", "2024_pres", "DEM", root.resolve("mock-data/v1/ei-precinct-bar-ci/OR_demo.json"));
        saveEiPrecinctBarCi("OR", "latino", "2024_pres", "REP", root.resolve("mock-data/v1/ei-precinct-bar-ci/OR_demo.json"));
        saveEiPrecinctBarCi("SC", "black", "2024_pres", "DEM", root.resolve("mock-data/v1/ei-precinct-bar-ci/SC_demo.json"));
        saveEiPrecinctBarCi("SC", "black", "2024_pres", "REP", root.resolve("mock-data/v1/ei-precinct-bar-ci/SC_demo.json"));
    }

    private void saveEiPrecinctBarCi(String stateId, String groupKey, String electionId, String partyKey, Path path) throws IOException {
        EiPrecinctBarCiDocument doc = buildDoc(new EiPrecinctBarCiDocument(), stateId, electionId, groupKey, null, null, "CVAP", readJsonMap(path));
        doc.setPartyKey(partyKey);
        eiPrecinctBarCiRepository.save(doc);
    }

    private void seedEiKde(Path root) throws IOException {
        eiKdeRepository.save(buildDoc(new EiKdeDocument(), "OR", "2024_pres", "latino", null, "support_gap", "CVAP",
                readJsonMap(root.resolve("mock-data/v1/ei-kde/OR_demo.json"))));
        eiKdeRepository.save(buildDoc(new EiKdeDocument(), "SC", "2024_pres", "black", null, "support_gap", "CVAP",
                readJsonMap(root.resolve("mock-data/v1/ei-kde/SC_demo.json"))));
    }

    private void seedEnsembleSplits(Path root) throws IOException {
        ensembleSplitRepository.save(buildDoc(new EnsembleSplitDocument(), "OR", "2024_pres", null, null, "final", "TOTAL",
                readJsonMap(root.resolve("mock-data/v1/ensemble-splits/OR_compare.json"))));
        ensembleSplitRepository.save(buildDoc(new EnsembleSplitDocument(), "SC", "2024_pres", null, null, "final", "TOTAL",
                readJsonMap(root.resolve("mock-data/v1/ensemble-splits/SC_compare.json"))));
    }

    private void seedBoxWhiskers(Path root) throws IOException {
        boxWhiskerResultRepository.save(buildDoc(new BoxWhiskerResultDocument(), "OR", "2024_pres", "latino", "vra_constrained", "minority_share", "CVAP",
                readJsonMap(root.resolve("mock-data/v1/box-whisker/OR_latino_cvap_vra.json"))));
        boxWhiskerResultRepository.save(buildDoc(new BoxWhiskerResultDocument(), "OR", "2024_pres", "latino", "race_blind", "minority_share", "CVAP",
                readJsonMap(root.resolve("mock-data/v1/box-whisker/OR_latino_cvap_race_blind.json"))));
        boxWhiskerResultRepository.save(buildDoc(new BoxWhiskerResultDocument(), "SC", "2024_pres", "black", "vra_constrained", "minority_share", "CVAP",
                readJsonMap(root.resolve("mock-data/v1/box-whisker/SC_black_cvap_vra.json"))));
        boxWhiskerResultRepository.save(buildDoc(new BoxWhiskerResultDocument(), "SC", "2024_pres", "black", "race_blind", "minority_share", "CVAP",
                readJsonMap(root.resolve("mock-data/v1/box-whisker/SC_black_cvap_race_blind.json"))));
    }

    private void seedInterestingPlans(Path root) throws IOException {
        interestingPlanRepository.save(buildInterestingPlanDoc(
                "OR",
                "plan-42",
                "Oregon Opportunity Corridor",
                "race_blind",
                "High Latino opportunity with competitive statewide split",
                readJsonMap(root.resolve("src/data/oregon_congressional_districts.geojson"))
        ));
        interestingPlanRepository.save(buildInterestingPlanDoc(
                "SC",
                "plan-42",
                "South Carolina Coastal Rebalance",
                "vra_constrained",
                "Expands Black-effective district probability while keeping core coastal continuity",
                readJsonMap(root.resolve("src/data/south_carolina_congressional_districts.geojson"))
        ));
    }

    private InterestingPlanDocument buildInterestingPlanDoc(
            String stateId,
            String planId,
            String planName,
            String ensembleType,
            String reasonInteresting,
            Map<String, Object> geojson
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
        payload.put("geojson", geojson);

        InterestingPlanDocument doc = buildDoc(new InterestingPlanDocument(), stateId, "2024_pres", null, ensembleType, null, "TOTAL", payload);
        doc.setPlanId(planId);
        return doc;
    }

    private void seedVraImpactThresholdTables(Path root) throws IOException {
        vraImpactThresholdTableRepository.save(buildDoc(new VraImpactThresholdTableDocument(), "OR", "2024_pres", "latino", null, null, "CVAP",
                readJsonMap(root.resolve("mock-data/v1/vra-impact-thresholds/OR_latino_2024_pres.json"))));
        vraImpactThresholdTableRepository.save(buildDoc(new VraImpactThresholdTableDocument(), "SC", "2024_pres", "black", null, null, "CVAP",
                readJsonMap(root.resolve("mock-data/v1/vra-impact-thresholds/SC_black_2024_pres.json"))));
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
        minorityEffectivenessHistogramRepository.save(buildDoc(new MinorityEffectivenessHistogramDocument(), "SC", "2024_pres", "black", null, null, "CVAP",
                readJsonMap(root.resolve("mock-data/v1/minority-effectiveness-histogram/SC_black_2024_pres.json"))));
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
