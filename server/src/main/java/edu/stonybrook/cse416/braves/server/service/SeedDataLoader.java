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
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

@Component
public class SeedDataLoader implements ApplicationRunner {
    private static final Logger LOG = LoggerFactory.getLogger(SeedDataLoader.class);
    private static final String GINGLES_NOTEBOOK_NAME = "gingles_prepro_7_8.ipynb";
    private static final String GINGLES_ELECTION_ID = "2024_pres";
    private static final String GINGLES_ELECTION_LABEL = "2024 Presidential";
    private static final int GINGLES_TARGET_POINT_COUNT = 500;
    private static final int GINGLES_SAMPLE_BIN_COUNT = 40;
    private static final int GINGLES_SAMPLE_RANDOM_SEED = 42;

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
                        districtRow(1, "Suzanne Bonamici", "Democratic", "White", 37.6, 0.41, 0.38),
                        districtRow(2, "Cliff Bentz", "Republican", "White", -27.1, 0.29, 0.27),
                        districtRow(3, "Maxine Dexter", "Democratic", "White", 45.6, 0.44, 0.42),
                        districtRow(4, "Val Hoyle", "Democratic", "White", 12.0, 0.38, 0.35),
                        districtRow(5, "Janelle Bynum", "Democratic", "Black", 8.6, 0.62, 0.61),
                        districtRow(6, "Andrea Salinas", "Democratic", "Latino", 11.3, 0.67, 0.65)
                )
        )));

        districtTableRepository.save(buildDoc(new DistrictTableDocument(), "SC", "2024_pres", null, null, null, "TOTAL", Map.of(
                "schemaVersion", "v1",
                "state", "SC",
                "election", "2024_pres",
                "districts", List.of(
                        districtRow(1, "Nancy Mace", "Republican", "White", -13.0, 0.31, 0.29),
                        districtRow(2, "Joe Wilson", "Republican", "White", -13.9, 0.28, 0.26),
                        districtRow(3, "Sheri Biggs", "Republican", "White", -43.1, 0.24, 0.22),
                        districtRow(4, "William Timmons", "Republican", "White", -23.6, 0.26, 0.24),
                        districtRow(5, "Ralph Norman", "Republican", "White", -22.8, 0.27, 0.25),
                        districtRow(6, "James Clyburn", "Democratic", "Black", 22.6, 0.71, 0.69),
                        districtRow(7, "Russell Fry", "Republican", "White", -26.3, 0.25, 0.23)
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
        upsertGinglesResult(root, "OR", "latino");
        upsertGinglesResult(root, "SC", "black");
    }

    private void seedGinglesTables(Path root) throws IOException {
        upsertGinglesTable(root, "OR", "latino");
        upsertGinglesTable(root, "SC", "black");
    }

    private void upsertGinglesResult(Path root, String stateId, String groupKey) throws IOException {
        Path path = ginglesChartSourcePath(root, stateId, groupKey);
        Map<String, Object> rawPayload = readJsonMap(path);
        Map<String, Object> payload = buildLockedGinglesChartPayload(rawPayload, stateId, groupKey);
        Map<String, Object> provenance = buildGinglesProvenance(root, path);
        Map<String, Object> internal = buildGinglesChartInternal(
                rawPayload,
                payload,
                isPreprocessingOutputPath(root, path)
        );
        GinglesResultDocument doc = buildDoc(
                new GinglesResultDocument(),
                stateId,
                GINGLES_ELECTION_ID,
                groupKey,
                null,
                null,
                "CVAP",
                payload
        );
        doc.setId(ginglesDocumentId(stateId, groupKey, "chart"));
        doc.setDocumentType("gingles_chart");
        doc.setProvenance(provenance);
        doc.setInternal(internal);
        validateLockedGinglesChartDocument(doc);
        ginglesResultRepository.findByStateIdAndGroupKeyAndElectionId(stateId, groupKey, GINGLES_ELECTION_ID)
                .ifPresent(existing -> {
                    if (!Objects.equals(existing.getId(), doc.getId())) {
                        ginglesResultRepository.deleteById(existing.getId());
                    }
                });
        ginglesResultRepository.save(doc);
    }

    private void upsertGinglesTable(Path root, String stateId, String groupKey) throws IOException {
        Path path = ginglesTableSourcePath(root, stateId, groupKey);
        Map<String, Object> rawPayload = readJsonMap(path);
        Map<String, Object> payload = buildLockedGinglesTablePayload(rawPayload, stateId, groupKey);
        Map<String, Object> provenance = buildGinglesProvenance(root, path);
        GinglesTableDocument doc = buildDoc(
                new GinglesTableDocument(),
                stateId,
                GINGLES_ELECTION_ID,
                groupKey,
                null,
                null,
                "CVAP",
                payload
        );
        doc.setId(ginglesDocumentId(stateId, groupKey, "table"));
        doc.setDocumentType("gingles_table");
        doc.setProvenance(provenance);
        validateLockedGinglesTableDocument(doc);
        ginglesTableRepository.findByStateIdAndGroupKeyAndElectionId(stateId, groupKey, GINGLES_ELECTION_ID)
                .ifPresent(existing -> {
                    if (!Objects.equals(existing.getId(), doc.getId())) {
                        ginglesTableRepository.deleteById(existing.getId());
                    }
                });
        ginglesTableRepository.save(doc);
    }

    private Path ginglesChartSourcePath(Path root, String stateId, String groupKey) {
        if ("OR".equals(stateId) && "latino".equals(groupKey)) {
            return root.resolve("preprocessing/output/OR_2024_latino_gingles_scatter.json");
        }
        if ("SC".equals(stateId) && "black".equals(groupKey)) {
            return root.resolve("preprocessing/output/SC_2024_black_gingles_scatter.json");
        }
        return root.resolve("mock-data/v1/gingles-scatter/" + stateId + "_2024_" + groupKey + ".json");
    }

    private Path ginglesTableSourcePath(Path root, String stateId, String groupKey) {
        if ("OR".equals(stateId) && "latino".equals(groupKey)) {
            return root.resolve("preprocessing/output/OR_2024_latino_gingles_table.json");
        }
        if ("SC".equals(stateId) && "black".equals(groupKey)) {
            return root.resolve("preprocessing/output/SC_2024_black_gingles_table.json");
        }
        return root.resolve("mock-data/v1/gingles-table/" + stateId + "_2024_" + groupKey + ".json");
    }

    private String ginglesDocumentId(String stateId, String groupKey, String kind) {
        return "gingles:" + stateId + ":" + groupKey + ":" + GINGLES_ELECTION_ID + ":" + kind;
    }

    private boolean isPreprocessingOutputPath(Path root, Path sourcePath) {
        Path normalizedRoot = root.toAbsolutePath().normalize();
        Path normalizedSource = sourcePath.toAbsolutePath().normalize();
        Path preprocessingOutputRoot = normalizedRoot.resolve("preprocessing/output").normalize();
        return normalizedSource.startsWith(preprocessingOutputRoot);
    }

    private Map<String, Object> buildGinglesProvenance(Path root, Path sourcePath) throws IOException {
        String relativePath = root.relativize(sourcePath).toString().replace('\\', '/');
        String sourceType = relativePath.startsWith("preprocessing/output/")
                ? "preprocessing_export"
                : "mock_seed_fixture";
        String notebookName = relativePath.startsWith("preprocessing/output/")
                ? GINGLES_NOTEBOOK_NAME
                : "mock-data-v1";
        String timestamp = DateTimeFormatter.ISO_INSTANT.format(Files.getLastModifiedTime(sourcePath).toInstant().atOffset(ZoneOffset.UTC));
        return Map.of(
                "sourceType", sourceType,
                "sourcePath", relativePath,
                "notebookName", notebookName,
                "exportedAt", timestamp,
                "seededAt", Instant.now().toString(),
                "preprocessingVersion", sha256Hex(relativePath.getBytes(StandardCharsets.UTF_8)),
                "contentHash", sha256Hex(Files.readAllBytes(sourcePath))
        );
    }

    private Map<String, Object> buildLockedGinglesChartPayload(
            Map<String, Object> rawPayload,
            String stateId,
            String groupKey
    ) {
        List<Map<String, Object>> rawPoints = pointList(rawPayload.get("points"), "chart points");
        List<Map<String, Object>> sampledPoints = samplePrecinctsForPlotting(rawPoints, GINGLES_TARGET_POINT_COUNT);
        sampledPoints.sort(Comparator
                .comparingDouble(this::minorityShare)
                .thenComparing(point -> stringField(point, "precinctId")));

        List<Map<String, Object>> rawCurves = pointList(rawPayload.get("regressionCurves"), "regression curves");
        List<Map<String, Object>> curves = new ArrayList<>();
        for (Map<String, Object> rawCurve : rawCurves) {
            List<Map<String, Object>> curvePoints = pointList(rawCurve.get("points"), "regression curve points")
                    .stream()
                    .map(point -> {
                        Map<String, Object> normalizedPoint = new LinkedHashMap<>();
                        normalizedPoint.put("x", boundedShare(point, "x"));
                        normalizedPoint.put("y", boundedShare(point, "y"));
                        return normalizedPoint;
                    })
                    .sorted(Comparator.comparingDouble(point -> doubleField(point, "x")))
                    .collect(Collectors.toCollection(ArrayList::new));

            Map<String, Object> curve = new LinkedHashMap<>();
            curve.put("key", stringField(rawCurve, "key"));
            curve.put("label", stringField(rawCurve, "label"));
            curve.put("party", stringField(rawCurve, "party"));
            curve.put("curveType", Optional.ofNullable(rawCurve.get("curveType")).map(String::valueOf).orElse("nonlinear_regression"));
            curve.put("points", curvePoints);
            curves.add(curve);
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("schemaVersion", "v1");
        payload.put("chartType", "gingles-scatter");
        payload.put("state", stateId);
        payload.put("totalDistricts", intField(rawPayload, "totalDistricts"));
        payload.put("electionKey", GINGLES_ELECTION_ID);
        payload.put("electionLabel", Optional.ofNullable(rawPayload.get("election")).map(String::valueOf).orElse(GINGLES_ELECTION_LABEL));
        payload.put("selectedGroup", Optional.ofNullable(rawPayload.get("selectedGroup")).map(String::valueOf).orElse(displayGroupLabel(groupKey)));
        payload.put("units", Map.of("share", "decimal_0_to_1"));
        payload.put("sampling", Map.of(
                "isSampled", true,
                "samplingAuthority", "preprocessing",
                "samplingMethod", "minority_share_binned_random_seed_42_40_bins",
                "displayedPointCount", sampledPoints.size(),
                "fullPrecinctCount", rawPoints.size(),
                "targetPointCount", GINGLES_TARGET_POINT_COUNT
        ));
        payload.put("points", sampledPoints);
        payload.put("regressionCurves", curves);
        return payload;
    }

    private Map<String, Object> buildLockedGinglesTablePayload(
            Map<String, Object> rawPayload,
            String stateId,
            String groupKey
    ) {
        List<Map<String, Object>> rows = pointList(rawPayload.get("rows"), "table rows")
                .stream()
                .map(row -> {
                    Map<String, Object> normalized = new LinkedHashMap<>();
                    normalized.put("precinctId", stringField(row, "precinctId"));
                    normalized.put("precinctName", Optional.ofNullable(row.get("precinctName")).map(String::valueOf).orElse(stringField(row, "precinctId")));
                    normalized.put("totalPopulation", intField(row, "totalPopulation"));
                    normalized.put("minorityPopulation", intField(row, "minorityPopulation"));
                    normalized.put("republicanVotes", intField(row, "republicanVotes"));
                    normalized.put("democraticVotes", intField(row, "democraticVotes"));
                    normalized.put("minorityShare", boundedShare(row, "minorityShare"));
                    normalized.put("repVoteShare", boundedShare(row, "repVoteShare"));
                    normalized.put("demVoteShare", boundedShare(row, "demVoteShare"));
                    normalized.put("winningParty", winningPartyField(row));
                    return normalized;
                })
                .sorted(Comparator.comparing(row -> stringField(row, "precinctId")))
                .collect(Collectors.toCollection(ArrayList::new));

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("schemaVersion", "v1");
        payload.put("tableType", "gingles-precinct-table");
        payload.put("state", stateId);
        payload.put("totalDistricts", intField(rawPayload, "totalDistricts"));
        payload.put("electionKey", GINGLES_ELECTION_ID);
        payload.put("electionLabel", Optional.ofNullable(rawPayload.get("election")).map(String::valueOf).orElse(GINGLES_ELECTION_LABEL));
        payload.put("selectedGroup", Optional.ofNullable(rawPayload.get("selectedGroup")).map(String::valueOf).orElse(displayGroupLabel(groupKey)));
        payload.put("rowCount", rows.size());
        payload.put("sorting", Map.of("rowOrder", "precinctId_asc"));
        payload.put("rows", rows);
        return payload;
    }

    private Map<String, Object> buildGinglesChartInternal(
            Map<String, Object> rawPayload,
            Map<String, Object> lockedPayload,
            boolean requireExportedFitFields
    ) {
        List<Map<String, Object>> rawPoints = pointList(rawPayload.get("points"), "raw chart points");
        List<Map<String, Object>> curves = pointList(lockedPayload.get("regressionCurves"), "locked regression curves");
        List<Map<String, Object>> rawCurves = pointList(rawPayload.get("regressionCurves"), "raw regression curves");

        Map<String, Map<String, Object>> rawCurveByParty = new HashMap<>();
        for (Map<String, Object> rawCurve : rawCurves) {
            rawCurveByParty.put(stringField(rawCurve, "party"), rawCurve);
        }

        List<Map<String, Object>> regressionModels = new ArrayList<>();
        for (Map<String, Object> curve : curves) {
            String party = stringField(curve, "party");
            Map<String, Object> rawCurve = rawCurveByParty.get(party);
            String modelFamily = Optional.ofNullable(rawCurve)
                    .map(entry -> entry.get("modelForm"))
                    .map(String::valueOf)
                    .orElse(Optional.ofNullable(curve.get("curveType")).map(String::valueOf).orElse("nonlinear_regression"));
            List<Map<String, Object>> curvePoints = pointList(curve.get("points"), "curve points");
            Map<String, Object> coefficients = coefficientsFromExportedFit(rawCurve, party, requireExportedFitFields);
            double exportedR2 = exportedR2(rawCurve, party, requireExportedFitFields);
            Map<String, Object> model = new LinkedHashMap<>();
            model.put("party", party);
            model.put("modelFamily", modelFamily);
            model.put("coefficients", coefficients);
            model.put("r2", roundTo(exportedR2, 6));
            model.put("curveType", stringField(curve, "curveType"));
            model.put("xDomain", Map.of(
                    "min", doubleField(curvePoints.get(0), "x"),
                    "max", doubleField(curvePoints.get(curvePoints.size() - 1), "x")
            ));
            model.put("pointCount", curvePoints.size());
            model.put("sourceModelLabel", Optional.ofNullable(rawCurve)
                    .map(entry -> entry.get("selectionMethod"))
                    .map(String::valueOf)
                    .orElse("curve_only"));
            if (rawCurve != null && rawCurve.get("rmse") instanceof Number rmse) {
                model.put("rmse", roundTo(rmse.doubleValue(), 6));
            }
            regressionModels.add(model);
        }

        return Map.of(
                "regressionModels", regressionModels,
                "sorting", Map.of(
                        "pointOrder", "minorityShare_asc",
                        "curvePointOrder", "x_asc"
                ),
                "samplingAudit", Map.of(
                        "targetPointCount", GINGLES_TARGET_POINT_COUNT,
                        "actualPointCount", pointList(lockedPayload.get("points"), "display points").size(),
                        "fullPrecinctCount", rawPoints.size(),
                        "samplingAuthority", "preprocessing",
                        "samplingMethod", "minority_share_binned_random_seed_42_40_bins",
                        "isTruncatedBecauseDatasetSmall", rawPoints.size() < GINGLES_TARGET_POINT_COUNT
                )
        );
    }

    private void validateLockedGinglesChartDocument(GinglesResultDocument doc) {
        requireEquals(doc.getDocumentType(), "gingles_chart", "Gingles chart documentType");
        requirePresent(doc.getId(), "Gingles chart id");
        requirePresent(doc.getStateId(), "Gingles chart stateId");
        requirePresent(doc.getGroupKey(), "Gingles chart groupKey");
        requirePresent(doc.getElectionId(), "Gingles chart electionId");
        requirePresent(doc.getPopulationMeasure(), "Gingles chart populationMeasure");
        requirePresent(doc.getSchemaVersion(), "Gingles chart schemaVersion");
        requirePresent(doc.getCreatedAt(), "Gingles chart createdAt");
        requirePresent(doc.getUpdatedAt(), "Gingles chart updatedAt");
        validateGinglesProvenance(doc.getProvenance());

        Map<String, Object> payload = doc.getPayload();
        requireEquals(stringField(payload, "schemaVersion"), "v1", "Gingles chart payload schemaVersion");
        requireEquals(stringField(payload, "chartType"), "gingles-scatter", "Gingles chart payload chartType");
        requirePresent(payload.get("state"), "Gingles chart payload state");
        requirePresent(payload.get("totalDistricts"), "Gingles chart payload totalDistricts");
        requireEquals(stringField(payload, "electionKey"), GINGLES_ELECTION_ID, "Gingles chart payload electionKey");
        requirePresent(payload.get("electionLabel"), "Gingles chart payload electionLabel");
        requirePresent(payload.get("selectedGroup"), "Gingles chart payload selectedGroup");

        Map<String, Object> sampling = mapField(payload.get("sampling"), "sampling");
        requireEquals(sampling.get("isSampled"), Boolean.TRUE, "Gingles chart sampling isSampled");
        requireEquals(String.valueOf(sampling.get("samplingAuthority")), "preprocessing", "Gingles chart samplingAuthority");
        requirePresent(sampling.get("samplingMethod"), "Gingles chart samplingMethod");
        requireEquals(intNumber(sampling.get("targetPointCount"), "Gingles chart targetPointCount"), GINGLES_TARGET_POINT_COUNT, "Gingles chart targetPointCount");

        List<Map<String, Object>> points = pointList(payload.get("points"), "Gingles chart points");
        int displayedPointCount = intNumber(sampling.get("displayedPointCount"), "Gingles chart displayedPointCount");
        int fullPrecinctCount = intNumber(sampling.get("fullPrecinctCount"), "Gingles chart fullPrecinctCount");
        if (displayedPointCount != points.size()) {
            throw new IllegalStateException("Gingles chart displayedPointCount must equal points length");
        }
        if (displayedPointCount > GINGLES_TARGET_POINT_COUNT) {
            throw new IllegalStateException("Gingles chart displayedPointCount exceeds target");
        }
        if (fullPrecinctCount < displayedPointCount) {
            throw new IllegalStateException("Gingles chart fullPrecinctCount cannot be less than displayedPointCount");
        }
        if (fullPrecinctCount >= GINGLES_TARGET_POINT_COUNT && displayedPointCount != GINGLES_TARGET_POINT_COUNT) {
            throw new IllegalStateException("Gingles chart must display exactly 500 points when source has at least 500");
        }
        if (fullPrecinctCount < GINGLES_TARGET_POINT_COUNT && displayedPointCount != fullPrecinctCount) {
            throw new IllegalStateException("Gingles chart must display all points when source has fewer than 500");
        }
        validateSortedByMinorityShareAsc(points);
        for (Map<String, Object> point : points) {
            boundedShare(point, "minorityShare");
            boundedShare(point, "demVoteShare");
            boundedShare(point, "repVoteShare");
            int totalPopulation = intField(point, "totalPopulation");
            int minorityPopulation = intField(point, "minorityPopulation");
            if (minorityPopulation > totalPopulation) {
                throw new IllegalStateException("Gingles chart minorityPopulation cannot exceed totalPopulation");
            }
        }

        List<Map<String, Object>> curves = pointList(payload.get("regressionCurves"), "Gingles chart regressionCurves");
        if (curves.size() < 2) {
            throw new IllegalStateException("Gingles chart must contain at least two regression curves");
        }
        boolean hasDem = false;
        boolean hasRep = false;
        for (Map<String, Object> curve : curves) {
            String party = stringField(curve, "party");
            hasDem |= "DEM".equals(party);
            hasRep |= "REP".equals(party);
            requirePresent(curve.get("key"), "Gingles chart regression curve key");
            requirePresent(curve.get("label"), "Gingles chart regression curve label");
            requirePresent(curve.get("curveType"), "Gingles chart regression curveType");
            List<Map<String, Object>> curvePoints = pointList(curve.get("points"), "Gingles chart regression points");
            validateSortedCurvePoints(curvePoints);
        }
        if (!hasDem || !hasRep) {
            throw new IllegalStateException("Gingles chart regression curves must include DEM and REP");
        }

        Map<String, Object> internal = mapField(doc.getInternal(), "Gingles chart internal");
        List<Map<String, Object>> models = pointList(internal.get("regressionModels"), "Gingles chart internal regressionModels");
        if (models.size() != curves.size()) {
            throw new IllegalStateException("Gingles chart internal regressionModels must match returned curve count");
        }
        for (Map<String, Object> model : models) {
            requirePresent(model.get("party"), "Gingles chart internal regression model party");
            requirePresent(model.get("modelFamily"), "Gingles chart internal regression modelFamily");
            if (!(model.get("coefficients") instanceof Map<?, ?> coefficients) || coefficients.isEmpty()) {
                throw new IllegalStateException("Gingles chart internal coefficients must be a non-empty map");
            }
            if (!(model.get("r2") instanceof Number number) || !Double.isFinite(number.doubleValue())) {
                throw new IllegalStateException("Gingles chart internal r2 must be numeric");
            }
        }
    }

    private void validateLockedGinglesTableDocument(GinglesTableDocument doc) {
        requireEquals(doc.getDocumentType(), "gingles_table", "Gingles table documentType");
        requirePresent(doc.getId(), "Gingles table id");
        requirePresent(doc.getStateId(), "Gingles table stateId");
        requirePresent(doc.getGroupKey(), "Gingles table groupKey");
        requirePresent(doc.getElectionId(), "Gingles table electionId");
        requirePresent(doc.getPopulationMeasure(), "Gingles table populationMeasure");
        requirePresent(doc.getSchemaVersion(), "Gingles table schemaVersion");
        requirePresent(doc.getCreatedAt(), "Gingles table createdAt");
        requirePresent(doc.getUpdatedAt(), "Gingles table updatedAt");
        validateGinglesProvenance(doc.getProvenance());

        Map<String, Object> payload = doc.getPayload();
        requireEquals(stringField(payload, "schemaVersion"), "v1", "Gingles table payload schemaVersion");
        requireEquals(stringField(payload, "tableType"), "gingles-precinct-table", "Gingles table payload tableType");
        requirePresent(payload.get("state"), "Gingles table payload state");
        requirePresent(payload.get("totalDistricts"), "Gingles table payload totalDistricts");
        requireEquals(stringField(payload, "electionKey"), GINGLES_ELECTION_ID, "Gingles table payload electionKey");
        requirePresent(payload.get("electionLabel"), "Gingles table payload electionLabel");
        requirePresent(payload.get("selectedGroup"), "Gingles table payload selectedGroup");
        Map<String, Object> sorting = mapField(payload.get("sorting"), "sorting");
        requireEquals(String.valueOf(sorting.get("rowOrder")), "precinctId_asc", "Gingles table row order");

        List<Map<String, Object>> rows = pointList(payload.get("rows"), "Gingles table rows");
        if (intField(payload, "rowCount") != rows.size()) {
            throw new IllegalStateException("Gingles table rowCount must equal rows length");
        }
        validateSortedByPrecinctIdAsc(rows);
        for (Map<String, Object> row : rows) {
            int totalPopulation = intField(row, "totalPopulation");
            int minorityPopulation = intField(row, "minorityPopulation");
            int republicanVotes = intField(row, "republicanVotes");
            int democraticVotes = intField(row, "democraticVotes");
            if (minorityPopulation > totalPopulation) {
                throw new IllegalStateException("Gingles table minorityPopulation cannot exceed totalPopulation");
            }
            if (republicanVotes < 0 || democraticVotes < 0) {
                throw new IllegalStateException("Gingles table vote counts cannot be negative");
            }
            boundedShare(row, "minorityShare");
            boundedShare(row, "repVoteShare");
            boundedShare(row, "demVoteShare");
        }
    }

    private void validateGinglesProvenance(Map<String, Object> provenance) {
        Map<String, Object> value = mapField(provenance, "Gingles provenance");
        requirePresent(value.get("sourceType"), "Gingles provenance sourceType");
        requirePresent(value.get("sourcePath"), "Gingles provenance sourcePath");
        requirePresent(value.get("notebookName"), "Gingles provenance notebookName");
        requirePresent(value.get("exportedAt"), "Gingles provenance exportedAt");
        requirePresent(value.get("seededAt"), "Gingles provenance seededAt");
        requirePresent(value.get("preprocessingVersion"), "Gingles provenance preprocessingVersion");
        requirePresent(value.get("contentHash"), "Gingles provenance contentHash");
    }

    private void validateSortedByMinorityShareAsc(List<Map<String, Object>> points) {
        double previousShare = -1.0;
        String previousPrecinctId = "";
        for (Map<String, Object> point : points) {
            double currentShare = boundedShare(point, "minorityShare");
            String precinctId = stringField(point, "precinctId");
            if (currentShare < previousShare || (Double.compare(currentShare, previousShare) == 0 && precinctId.compareTo(previousPrecinctId) < 0)) {
                throw new IllegalStateException("Gingles chart points must be sorted by minorityShare ascending");
            }
            previousShare = currentShare;
            previousPrecinctId = precinctId;
        }
    }

    private void validateSortedByPrecinctIdAsc(List<Map<String, Object>> rows) {
        String previous = "";
        for (Map<String, Object> row : rows) {
            String current = stringField(row, "precinctId");
            if (current.compareTo(previous) < 0) {
                throw new IllegalStateException("Gingles table rows must be sorted by precinctId ascending");
            }
            previous = current;
        }
    }

    private void validateSortedCurvePoints(List<Map<String, Object>> curvePoints) {
        double previousX = -1.0;
        for (Map<String, Object> point : curvePoints) {
            double currentX = boundedShare(point, "x");
            boundedShare(point, "y");
            if (currentX < previousX) {
                throw new IllegalStateException("Regression curve points must be sorted by x ascending");
            }
            previousX = currentX;
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> pointList(Object value, String fieldName) {
        if (!(value instanceof List<?> list) || list.isEmpty()) {
            throw new IllegalStateException(fieldName + " must be a non-empty array");
        }
        List<Map<String, Object>> points = new ArrayList<>();
        for (Object item : list) {
            if (!(item instanceof Map<?, ?> map)) {
                throw new IllegalStateException(fieldName + " entries must be objects");
            }
            points.add((Map<String, Object>) map);
        }
        return points;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> mapField(Object value, String fieldName) {
        if (!(value instanceof Map<?, ?> map) || map.isEmpty()) {
            throw new IllegalStateException(fieldName + " must be a non-empty object");
        }
        return (Map<String, Object>) map;
    }

    private String stringField(Map<String, Object> map, String fieldName) {
        Object value = map.get(fieldName);
        if (value == null || String.valueOf(value).isBlank()) {
            throw new IllegalStateException(fieldName + " is required");
        }
        return String.valueOf(value);
    }

    private int intField(Map<String, Object> map, String fieldName) {
        return intNumber(map.get(fieldName), fieldName);
    }

    private int intNumber(Object value, String fieldName) {
        if (!(value instanceof Number number)) {
            throw new IllegalStateException(fieldName + " must be numeric");
        }
        return number.intValue();
    }

    private double doubleField(Map<String, Object> map, String fieldName) {
        Object value = map.get(fieldName);
        if (!(value instanceof Number number)) {
            throw new IllegalStateException(fieldName + " must be numeric");
        }
        return number.doubleValue();
    }

    private double boundedShare(Map<String, Object> map, String fieldName) {
        double value = doubleField(map, fieldName);
        if (value < 0.0 || value > 1.0) {
            throw new IllegalStateException(fieldName + " must be in [0,1]");
        }
        return roundTo(value, 6);
    }

    private List<Map<String, Object>> samplePrecinctsForPlotting(List<Map<String, Object>> points, int targetPrecincts) {
        List<Map<String, Object>> normalized = points.stream()
                .map(this::normalizeChartPoint)
                .collect(Collectors.toCollection(ArrayList::new));
        if (normalized.size() <= targetPrecincts) {
            return normalized;
        }

        Map<Integer, List<Map<String, Object>>> bins = new LinkedHashMap<>();
        for (int index = 0; index < GINGLES_SAMPLE_BIN_COUNT; index++) {
            bins.put(index, new ArrayList<>());
        }
        for (Map<String, Object> point : normalized) {
            int binIndex = Math.min((int) Math.floor(minorityShare(point) * GINGLES_SAMPLE_BIN_COUNT), GINGLES_SAMPLE_BIN_COUNT - 1);
            bins.get(binIndex).add(point);
        }

        List<Integer> nonEmptyBins = bins.entrySet().stream()
                .filter(entry -> !entry.getValue().isEmpty())
                .map(Map.Entry::getKey)
                .toList();
        Map<Integer, Integer> allocations = new LinkedHashMap<>();
        for (Integer binIndex : nonEmptyBins) {
            allocations.put(binIndex, 1);
        }

        int remainingSlots = targetPrecincts - allocations.values().stream().mapToInt(Integer::intValue).sum();
        int totalInNonEmpty = nonEmptyBins.stream().mapToInt(bin -> bins.get(bin).size()).sum();
        Map<Integer, Double> fractions = new LinkedHashMap<>();
        for (Integer binIndex : nonEmptyBins) {
            int binCount = bins.get(binIndex).size();
            double proportional = remainingSlots * ((double) binCount / (double) totalInNonEmpty);
            int integerAdd = Math.min((int) Math.floor(proportional), Math.max(0, binCount - allocations.get(binIndex)));
            allocations.put(binIndex, allocations.get(binIndex) + integerAdd);
            fractions.put(binIndex, proportional - integerAdd);
        }

        int allocated = allocations.values().stream().mapToInt(Integer::intValue).sum();
        int remainder = targetPrecincts - allocated;
        for (Integer binIndex : fractions.entrySet().stream()
                .sorted(Map.Entry.<Integer, Double>comparingByValue().reversed())
                .map(Map.Entry::getKey)
                .toList()) {
            if (remainder == 0) {
                break;
            }
            int current = allocations.get(binIndex);
            if (current < bins.get(binIndex).size()) {
                allocations.put(binIndex, current + 1);
                remainder--;
            }
        }

        List<Map<String, Object>> sampled = new ArrayList<>();
        for (Integer binIndex : nonEmptyBins) {
            List<Map<String, Object>> binPoints = new ArrayList<>(bins.get(binIndex));
            binPoints.sort(Comparator.comparing(point -> stringField(point, "precinctId")));
            java.util.Collections.shuffle(binPoints, new Random(GINGLES_SAMPLE_RANDOM_SEED + binIndex));
            sampled.addAll(binPoints.subList(0, Math.min(allocations.get(binIndex), binPoints.size())));
        }

        if (sampled.size() < targetPrecincts) {
            List<Map<String, Object>> remaining = normalized.stream()
                    .filter(point -> sampled.stream().noneMatch(sample -> stringField(sample, "precinctId").equals(stringField(point, "precinctId"))))
                    .sorted(Comparator.comparing(point -> stringField(point, "precinctId")))
                    .collect(Collectors.toCollection(ArrayList::new));
            java.util.Collections.shuffle(remaining, new Random(GINGLES_SAMPLE_RANDOM_SEED));
            sampled.addAll(remaining.subList(0, Math.min(targetPrecincts - sampled.size(), remaining.size())));
        }

        return sampled;
    }

    private Map<String, Object> normalizeChartPoint(Map<String, Object> point) {
        Map<String, Object> normalized = new LinkedHashMap<>();
        normalized.put("precinctId", stringField(point, "precinctId"));
        if (point.get("precinctName") != null) {
            normalized.put("precinctName", String.valueOf(point.get("precinctName")));
        }
        normalized.put("minorityShare", boundedShare(point, "minorityShare"));
        normalized.put("demVoteShare", boundedShare(point, "demVoteShare"));
        normalized.put("repVoteShare", boundedShare(point, "repVoteShare"));
        normalized.put("totalPopulation", intField(point, "totalPopulation"));
        normalized.put("minorityPopulation", intField(point, "minorityPopulation"));
        return normalized;
    }

    private double minorityShare(Map<String, Object> point) {
        return doubleField(point, "minorityShare");
    }

    private String winningPartyField(Map<String, Object> row) {
        Object existing = row.get("winningParty");
        if (existing != null && !String.valueOf(existing).isBlank()) {
            return String.valueOf(existing);
        }
        double repVoteShare = boundedShare(row, "repVoteShare");
        double demVoteShare = boundedShare(row, "demVoteShare");
        return repVoteShare >= demVoteShare ? "REP" : "DEM";
    }

    private Map<String, Object> coefficientsFromExportedFit(
            Map<String, Object> rawCurve,
            String party,
            boolean requireExportedFitFields
    ) {
        if (rawCurve == null) {
            if (requireExportedFitFields) {
                throw new IllegalStateException("Missing raw regression curve for party " + party);
            }
            return Map.of("p0", 0.0);
        }
        Object namesValue = rawCurve.get("fitParameterNames");
        Object paramsValue = rawCurve.get("fitParameters");
        if (namesValue == null || paramsValue == null) {
            if (requireExportedFitFields) {
                throw new IllegalStateException("fitParameterNames and fitParameters are required for preprocessing regression curve " + party);
            }
            return Map.of("p0", 0.0);
        }

        List<String> fitParameterNames = stringList(namesValue, "fitParameterNames");
        List<Double> fitParameters = numberList(paramsValue, "fitParameters");
        if (fitParameterNames.size() != fitParameters.size()) {
            throw new IllegalStateException("fitParameterNames and fitParameters length mismatch for party " + party);
        }
        Map<String, Object> coefficients = new LinkedHashMap<>();
        for (int index = 0; index < fitParameterNames.size(); index++) {
            coefficients.put(fitParameterNames.get(index), roundTo(fitParameters.get(index), 6));
        }
        return coefficients;
    }

    private double exportedR2(Map<String, Object> rawCurve, String party, boolean requireExportedFitFields) {
        if (rawCurve == null || rawCurve.get("r2") == null) {
            if (requireExportedFitFields) {
                throw new IllegalStateException("r2 is required for preprocessing regression curve " + party);
            }
            return 0.0;
        }
        Object value = rawCurve.get("r2");
        if (!(value instanceof Number number) || !Double.isFinite(number.doubleValue())) {
            throw new IllegalStateException("r2 must be numeric and finite for party " + party);
        }
        return number.doubleValue();
    }

    private List<String> stringList(Object value, String fieldName) {
        if (!(value instanceof List<?> list) || list.isEmpty()) {
            throw new IllegalStateException(fieldName + " must be a non-empty array");
        }
        List<String> values = new ArrayList<>();
        for (Object item : list) {
            if (!(item instanceof String string) || string.isBlank()) {
                throw new IllegalStateException(fieldName + " entries must be non-empty strings");
            }
            values.add(string);
        }
        return values;
    }

    private List<Double> numberList(Object value, String fieldName) {
        if (!(value instanceof List<?> list) || list.isEmpty()) {
            throw new IllegalStateException(fieldName + " must be a non-empty array");
        }
        List<Double> values = new ArrayList<>();
        for (Object item : list) {
            if (!(item instanceof Number number) || !Double.isFinite(number.doubleValue())) {
                throw new IllegalStateException(fieldName + " entries must be finite numeric values");
            }
            values.add(number.doubleValue());
        }
        return values;
    }

    private double roundTo(double value, int scale) {
        double factor = Math.pow(10, scale);
        return Math.round(value * factor) / factor;
    }

    private String displayGroupLabel(String groupKey) {
        if (groupKey == null || groupKey.isBlank()) {
            return groupKey;
        }
        return Arrays.stream(groupKey.split("_"))
                .filter(part -> !part.isBlank())
                .map(part -> part.substring(0, 1).toUpperCase(Locale.US) + part.substring(1))
                .collect(Collectors.joining(" "));
    }

    private void requirePresent(Object value, String fieldName) {
        if (value == null || (value instanceof String string && string.isBlank())) {
            throw new IllegalStateException(fieldName + " is required");
        }
    }

    private void requireEquals(Object actual, Object expected, String fieldName) {
        if (!Objects.equals(actual, expected)) {
            throw new IllegalStateException(fieldName + " must equal " + expected + " but was " + actual);
        }
    }

    private String sha256Hex(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(bytes);
            StringBuilder builder = new StringBuilder();
            for (byte item : hash) {
                builder.append(String.format("%02x", item));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
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

    private void seedInterestingPlans(Path root) throws IOException {
        interestingPlanRepository.deleteAll();
        List<String> planSeedFiles = List.of(
                "OR_plan-42.json",
                "OR_plan-43.json",
                "SC_plan-42.json",
                "SC_plan-43.json"
        );
        for (String fileName : planSeedFiles) {
            interestingPlanRepository.save(readInterestingPlanDoc(root.resolve("mock-data/v1/interesting-plans").resolve(fileName)));
        }
    }

    private InterestingPlanDocument readInterestingPlanDoc(Path file) throws IOException {
        Map<String, Object> payload = new LinkedHashMap<>(readJsonMap(file));
        String stateId = requireString(payload, "state", file);
        String planId = requireString(payload, "planId", file);
        String ensembleType = requireString(payload, "ensembleType", file);
        payload.put("topology", geometryAssetService.getDistrictTopology(stateId));

        InterestingPlanDocument doc = buildDoc(new InterestingPlanDocument(), stateId, "2024_pres", null, ensembleType, null, "TOTAL", payload);
        doc.setPlanId(planId);
        return doc;
    }

    private String requireString(Map<String, Object> payload, String fieldName, Path file) {
        Object value = payload.get(fieldName);
        if (!(value instanceof String stringValue) || stringValue.isBlank()) {
            throw new IllegalArgumentException("Interesting plan seed file " + file + " is missing required field: " + fieldName);
        }
        return stringValue;
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

    private Map<String, Object> districtRow(int districtNumber, String representative, String party, String racialEthnicGroup, double voteMargin2024, double effectivenessScore, double calibratedEffectivenessScore) {
        return Map.of(
                "districtNumber", districtNumber,
                "representative", representative,
                "party", party,
                "racialEthnicGroup", racialEthnicGroup,
                "voteMargin2024", voteMargin2024,
                "effectivenessScore", effectivenessScore,
                "calibratedEffectivenessScore", calibratedEffectivenessScore
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
        Instant now = Instant.now();
        doc.setStateId(stateId);
        doc.setElectionId(electionId);
        doc.setGroupKey(groupKey);
        doc.setEnsembleType(ensembleType);
        doc.setMetricKey(metricKey);
        doc.setPopulationMeasure(populationMeasure);
        doc.setSchemaVersion("v1");
        doc.setSourceManifestId("seed-v1");
        doc.setCreatedAt(now);
        doc.setUpdatedAt(now);
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
