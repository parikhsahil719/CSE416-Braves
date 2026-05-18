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
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.UncheckedIOException;
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
    private static final long EXPECTED_GUI17_BOX_WHISKER_DOC_COUNT = 16L;
    private static final long EXPECTED_GUI21_ME_BOX_WHISKER_DOC_COUNT = 15L;

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
    private final CacheManager cacheManager;

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
            IngestManifestRepository ingestManifestRepository,
            CacheManager cacheManager
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
        this.cacheManager = cacheManager;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!seedEnabled) {
            LOG.info("Seed loader disabled");
            return;
        }

        // Resolve the repo layout first, validate that the checked-in geometry still looks realistic, then
        // refresh canonical snapshot collections while leaving larger static seed sets alone unless absent.
        Path root = ProjectPathResolver.resolveRoot(configuredRootPath);
        validatePrecinctCounts(root);
        validatePopulationRealism(root);
        if (stateRepository.count() == 0) seedStates();
        seedStateSummaries(root);
        seedEnsembleSummaries(root);
        seedDistrictTables(root);
        seedHeatmapBins();
        seedGingles(root);
        seedGinglesTables(root);
        eiSupportResultRepository.deleteAll(); seedEiSupport(root);
        eiPrecinctBarCiRepository.deleteAll(); seedEiPrecinctBarCi(root);
        eiKdeRepository.deleteAll(); seedEiKde(root);
        if (ensembleSplitRepository.count() == 0) seedEnsembleSplits(root);
        if (boxWhiskerResultRepository.count() != EXPECTED_GUI17_BOX_WHISKER_DOC_COUNT) {
            boxWhiskerResultRepository.deleteAll();
            seedBoxWhiskers(root);
        }
        seedInterestingPlans(root);
        // Expect 2 docs: OR/latino + SC/black (only primary minority per state).
        if (vraImpactThresholdTableRepository.count() < 2) { vraImpactThresholdTableRepository.deleteAll(); seedVraImpactThresholdTables(root); }
        if (minorityEffectivenessBoxWhiskerRepository.count() != EXPECTED_GUI21_ME_BOX_WHISKER_DOC_COUNT) {
            seedMinorityEffectivenessBoxWhisker(root);
        }
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
        // Each checked-in topology is expected to expose one primary geometry collection, so the seeder reads
        // the first object instead of baking collection names into this validation path.
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

    private void seedStateSummaries(Path root) throws IOException {
        stateSummaryRepository.deleteAll();
        stateSummaryRepository.save(buildDoc(new StateSummaryDocument(), "OR", null, null, null, null, "TOTAL",
                readJsonMap(root.resolve("preprocessing/output/OR_state_summary.json"))));
        stateSummaryRepository.save(buildDoc(new StateSummaryDocument(), "SC", null, null, null, null, "TOTAL",
                readJsonMap(root.resolve("preprocessing/output/SC_state_summary.json"))));
    }

    private void seedEnsembleSummaries(Path root) throws IOException {
        ensembleSummaryRepository.deleteAll();
        ensembleSummaryRepository.save(buildDoc(new EnsembleSummaryDocument(), "OR", null, null, null, null, "TOTAL",
                readJsonMap(root.resolve("preprocessing/output/OR_ensemble_summary.json"))));
        ensembleSummaryRepository.save(buildDoc(new EnsembleSummaryDocument(), "SC", null, null, null, null, "TOTAL",
                readJsonMap(root.resolve("preprocessing/output/SC_ensemble_summary.json"))));
    }

    private void seedDistrictTables(Path root) throws IOException {
        districtTableRepository.deleteAll();
        districtTableRepository.save(buildDoc(new DistrictTableDocument(), "OR", "2024_pres", null, null, null, "TOTAL",
                mergeEffectivenessScores(
                        readJsonMap(root.resolve("preprocessing/output/OR_district_table_2024_pres.json")),
                        readJsonMap(root.resolve("preprocessing/output/GUI_6_or.json")),
                        "hispanic")));
        districtTableRepository.save(buildDoc(new DistrictTableDocument(), "SC", "2024_pres", null, null, null, "TOTAL",
                mergeEffectivenessScores(
                        readJsonMap(root.resolve("preprocessing/output/SC_district_table_2024_pres.json")),
                        readJsonMap(root.resolve("preprocessing/output/GUI_6_sc.json")),
                        "black")));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> mergeEffectivenessScores(
            Map<String, Object> tablePayload, Map<String, Object> gui6Payload, String groupKey) {
        Map<String, Object> scores = (Map<String, Object>)
                ((Map<String, Object>) gui6Payload.get("effective_district_score")).get(groupKey);
        List<Map<String, Object>> districts = (List<Map<String, Object>>) tablePayload.get("districts");
        for (Map<String, Object> district : districts) {
            int distNum = ((Number) district.get("districtNumber")).intValue();
            Object score = scores.get(String.valueOf(distNum));
            if (score != null) {
                district.put("effectivenessScore", score);
            }
        }
        return tablePayload;
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
        // Prefer real notebook output when this state/group has been preprocessed, and fall back to checked-in
        // mock fixtures for slices that still do not have a notebook export.
        if ("OR".equals(stateId) && "latino".equals(groupKey)) {
            return root.resolve("preprocessing/output/OR_2024_latino_gingles_scatter.json");
        }
        if ("SC".equals(stateId) && "black".equals(groupKey)) {
            return root.resolve("preprocessing/output/SC_2024_black_gingles_scatter.json");
        }
        return root.resolve("mock-data/v1/gingles-scatter/" + stateId + "_2024_" + groupKey + ".json");
    }

    private Path ginglesTableSourcePath(Path root, String stateId, String groupKey) {
        // Prefer real notebook output when this state/group has been preprocessed, and fall back to checked-in
        // mock fixtures for slices that still do not have a notebook export.
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
        // Store enough provenance to explain whether a payload came from the notebook export path or a fixture,
        // and to reproduce the exact artifact that was loaded during seeding.
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
        // Normalize and re-sort points here so the stored API payload has one consistent ordering regardless of
        // how the notebook happened to emit the raw export.
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
        // Sampling metadata stays public so the chart contract can explain why it returns 500 display points
        // instead of the full precinct universe.
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
        // Unlike the chart payload, the table keeps full precinct coverage and sorts by precinctId so the UI
        // can provide a stable, exhaustive tabular view of the analysis slice.
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
        // Keep reproducibility details like coefficients, fit metrics, and sampling audit under internal so the
        // backend can retain the full regression story without expanding the public chart response.
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

        // Bin-aware allocation keeps sparse minority-share tails visible; naive random sampling tends to
        // overrepresent the densest middle bins and flatten the chart's most informative edges.
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

        // After guaranteeing representation in each non-empty bin, distribute the remaining slots
        // proportionally and then use a deterministic remainder pass to fill leftovers.
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
        // Some exports omit the winner field, so reconstruct it from the normalized shares rather than failing
        // the entire table import.
        double repVoteShare = boundedShare(row, "repVoteShare");
        double demVoteShare = boundedShare(row, "demVoteShare");
        return repVoteShare >= demVoteShare ? "REP" : "DEM";
    }

    private Map<String, Object> coefficientsFromExportedFit(
            Map<String, Object> rawCurve,
            String party,
            boolean requireExportedFitFields
    ) {
        // Notebook-produced curves are expected to carry named fit parameters so the backend can preserve
        // reproducible regression metadata instead of relying on positional guesswork later.
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
        saveEiSupport("OR", "latino", "2024_pres", "DEM", root.resolve("preprocessing/output/ei/ei-support/OR_latino_2024_president_DEM.json"));
        saveEiSupport("OR", "latino", "2024_pres", "REP", root.resolve("preprocessing/output/ei/ei-support/OR_latino_2024_president_REP.json"));
        saveEiSupport("OR", "white",  "2024_pres", "DEM", root.resolve("preprocessing/output/ei/ei-support/OR_white_2024_president_DEM.json"));
        saveEiSupport("OR", "white",  "2024_pres", "REP", root.resolve("preprocessing/output/ei/ei-support/OR_white_2024_president_REP.json"));
        saveEiSupport("SC", "black",  "2024_pres", "DEM", root.resolve("preprocessing/output/ei/ei-support/SC_black_2024_president_DEM.json"));
        saveEiSupport("SC", "black",  "2024_pres", "REP", root.resolve("preprocessing/output/ei/ei-support/SC_black_2024_president_REP.json"));
        saveEiSupport("SC", "white",  "2024_pres", "DEM", root.resolve("preprocessing/output/ei/ei-support/SC_white_2024_president_DEM.json"));
        saveEiSupport("SC", "white",  "2024_pres", "REP", root.resolve("preprocessing/output/ei/ei-support/SC_white_2024_president_REP.json"));
    }

    private void saveEiSupport(String stateId, String groupKey, String electionId, String partyKey, Path path) throws IOException {
        EiSupportResultDocument doc = buildDoc(new EiSupportResultDocument(), stateId, electionId, groupKey, null, null, "CVAP", readJsonMap(path));
        doc.setPartyKey(partyKey);
        eiSupportResultRepository.save(doc);
    }

    private void seedEiPrecinctBarCi(Path root) throws IOException {
        saveEiPrecinctBarCi("OR", "latino", "2024_pres", PartyKey.DEM, root.resolve("preprocessing/output/ei/ei-precinct-bar-ci/OR_latino_2024_pres_DEM.json"));
        saveEiPrecinctBarCi("OR", "latino", "2024_pres", PartyKey.REP, root.resolve("preprocessing/output/ei/ei-precinct-bar-ci/OR_latino_2024_pres_REP.json"));
        saveEiPrecinctBarCi("OR", "white",  "2024_pres", PartyKey.DEM, root.resolve("preprocessing/output/ei/ei-precinct-bar-ci/OR_white_2024_pres_DEM.json"));
        saveEiPrecinctBarCi("OR", "white",  "2024_pres", PartyKey.REP, root.resolve("preprocessing/output/ei/ei-precinct-bar-ci/OR_white_2024_pres_REP.json"));
        saveEiPrecinctBarCi("SC", "black",  "2024_pres", PartyKey.DEM, root.resolve("preprocessing/output/ei/ei-precinct-bar-ci/SC_black_2024_pres_DEM.json"));
        saveEiPrecinctBarCi("SC", "black",  "2024_pres", PartyKey.REP, root.resolve("preprocessing/output/ei/ei-precinct-bar-ci/SC_black_2024_pres_REP.json"));
        saveEiPrecinctBarCi("SC", "white",  "2024_pres", PartyKey.DEM, root.resolve("preprocessing/output/ei/ei-precinct-bar-ci/SC_white_2024_pres_DEM.json"));
        saveEiPrecinctBarCi("SC", "white",  "2024_pres", PartyKey.REP, root.resolve("preprocessing/output/ei/ei-precinct-bar-ci/SC_white_2024_pres_REP.json"));
    }

    private void saveEiPrecinctBarCi(String stateId, String groupKey, String electionId, PartyKey partyKey, Path path) throws IOException {
        EiPrecinctBarCiDocument doc = buildDoc(new EiPrecinctBarCiDocument(), stateId, electionId, groupKey, null, null, "CVAP", readJsonMap(path));
        doc.setPartyKey(partyKey.getKey());
        eiPrecinctBarCiRepository.save(doc);
    }

    private void seedEiKde(Path root) throws IOException {
        saveEiKde("OR", "latino", "2024_pres", "support_gap", "DEM", root.resolve("preprocessing/output/ei/ei-kde/OR_latino_2024_pres_support_gap_DEM.json"));
        saveEiKde("OR", "latino", "2024_pres", "support_gap", "REP", root.resolve("preprocessing/output/ei/ei-kde/OR_latino_2024_pres_support_gap_REP.json"));
        saveEiKde("OR", "white",  "2024_pres", "support_gap", "DEM", root.resolve("preprocessing/output/ei/ei-kde/OR_white_2024_pres_support_gap_DEM.json"));
        saveEiKde("OR", "white",  "2024_pres", "support_gap", "REP", root.resolve("preprocessing/output/ei/ei-kde/OR_white_2024_pres_support_gap_REP.json"));
        saveEiKde("SC", "black",  "2024_pres", "support_gap", "DEM", root.resolve("preprocessing/output/ei/ei-kde/SC_black_2024_pres_support_gap_DEM.json"));
        saveEiKde("SC", "black",  "2024_pres", "support_gap", "REP", root.resolve("preprocessing/output/ei/ei-kde/SC_black_2024_pres_support_gap_REP.json"));
        saveEiKde("SC", "white",  "2024_pres", "support_gap", "DEM", root.resolve("preprocessing/output/ei/ei-kde/SC_white_2024_pres_support_gap_DEM.json"));
        saveEiKde("SC", "white",  "2024_pres", "support_gap", "REP", root.resolve("preprocessing/output/ei/ei-kde/SC_white_2024_pres_support_gap_REP.json"));
    }

    private void saveEiKde(String stateId, String groupKey, String electionId, String metricKey, String partyKey, Path path) throws IOException {
        EiKdeDocument doc = buildDoc(new EiKdeDocument(), stateId, electionId, groupKey, null, metricKey, "CVAP", readJsonMap(path));
        doc.setPartyKey(partyKey);
        eiKdeRepository.save(doc);
    }

    private void seedEnsembleSplits(Path root) throws IOException {
        ensembleSplitRepository.save(buildDoc(new EnsembleSplitDocument(), "OR", "2024_pres", null, null, EnsembleSize.FINAL.getKey(), "TOTAL",
                readJsonMap(root.resolve("preprocessing/output/OR_FINAL_OUT_ensemble_splits-2.json"))));
        ensembleSplitRepository.save(buildDoc(new EnsembleSplitDocument(), "SC", "2024_pres", null, null, EnsembleSize.FINAL.getKey(), "TOTAL",
                readJsonMap(root.resolve("preprocessing/output/SC_FINAL_OUT_ensemble_splits-2.json"))));
    }

    private void seedBoxWhiskers(Path root) throws IOException {
        Path gui17 = root.resolve("preprocessing/output/kobe/GUI17");
        seedGui17BoxWhiskerSeries(gui17, "OR", "latino", "Latino", 6, "rb", EnsembleType.RACE_BLIND.getKey());
        seedGui17BoxWhiskerSeries(gui17, "OR", "latino", "Latino", 6, "vra", EnsembleType.VRA_CONSTRAINED.getKey());
        seedGui17BoxWhiskerSeries(gui17, "SC", "black", "Black", 7, "rb", EnsembleType.RACE_BLIND.getKey());
        seedGui17BoxWhiskerSeries(gui17, "SC", "black", "Black", 7, "vra", EnsembleType.VRA_CONSTRAINED.getKey());
    }

    private void seedGui17BoxWhiskerSeries(
            Path gui17Root,
            String stateId,
            String groupKey,
            String groupLabel,
            int totalDistricts,
            String sourceType,
            String ensembleTypeKey) throws IOException {
        String stateLC = stateId.toLowerCase(Locale.US);
        for (int sourceIndex = 0; sourceIndex < 4; sourceIndex++) {
            BoxWhiskerResultDocument doc = buildDoc(
                    new BoxWhiskerResultDocument(),
                    stateId,
                    "2024_pres",
                    groupKey,
                    ensembleTypeKey,
                    "minority_share",
                    "CVAP",
                    buildBoxWhiskerPayload(
                            gui17Root.resolve(String.format("GUI17_%s_%s%d_5000plans.json", stateLC, sourceType, sourceIndex)),
                            stateId,
                            groupLabel,
                            ensembleTypeKey,
                            totalDistricts
                    ));
            doc.setEnsembleIndex(sourceIndex + 1);
            boxWhiskerResultRepository.save(doc);
        }
    }

    private Map<String, Object> buildBoxWhiskerPayload(
            Path file, String state, String groupLabel, String ensembleType, int totalDistricts) throws IOException {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("schemaVersion", "v1");
        payload.put("chartType", "box-whisker");
        payload.put("state", state);
        payload.put("totalDistricts", totalDistricts);
        payload.put("election", "2024 Presidential");
        payload.put("ensembleType", ensembleType);
        payload.put("selectedGroup", groupLabel);
        payload.put("metricLabel", groupLabel + " CVAP share");
        payload.put("units", Map.of("share", "decimal_0_to_1"));
        payload.put("rankSummaries", readJsonList(file));
        return payload;
    }

    private void seedInterestingPlans(Path root) throws IOException {
        // Interesting plans are treated as a curated showcase set, so reseed them from files on every startup
        // instead of preserving potentially stale Mongo copies.
        interestingPlanRepository.deleteAll();
        Path aydenRoot = root.resolve("preprocessing/output/Ayden");
        Map<String, Map<String, List<Integer>>> effectiveDistrictsByState =
                readEffectiveDistrictMappings(aydenRoot.resolve("effective_districts.json"));
        seedStateInterestingPlans(aydenRoot.resolve("SC_Interesting_Plans"), "SC", effectiveDistrictsByState.getOrDefault("SC", Map.of()));
        seedStateInterestingPlans(aydenRoot.resolve("OR_Interesting_Plans"), "OR", effectiveDistrictsByState.getOrDefault("OR", Map.of()));
        clearInterestingPlanCaches();
    }

    private Map<String, Map<String, List<Integer>>> readEffectiveDistrictMappings(Path source) throws IOException {
        Map<String, Object> root = readJsonMap(source);
        Map<String, Map<String, List<Integer>>> byState = new LinkedHashMap<>();
        for (Map.Entry<String, Object> stateEntry : root.entrySet()) {
            String stateId = stateEntry.getKey();
            if (!(stateEntry.getValue() instanceof Map<?, ?> plansRaw)) {
                byState.put(stateId, Map.of());
                continue;
            }
            Map<String, List<Integer>> byPlan = new LinkedHashMap<>();
            for (Map.Entry<?, ?> planEntry : plansRaw.entrySet()) {
                String planId = String.valueOf(planEntry.getKey());
                byPlan.put(planId, toIntegerList(planEntry.getValue()));
            }
            byState.put(stateId, byPlan);
        }
        return byState;
    }

    private List<Integer> toIntegerList(Object value) {
        if (!(value instanceof List<?> list)) {
            return List.of();
        }
        List<Integer> result = new ArrayList<>();
        for (Object element : list) {
            if (element instanceof Number number) {
                result.add(number.intValue());
            }
        }
        return List.copyOf(result);
    }

    private void seedStateInterestingPlans(Path dir, String stateId, Map<String, List<Integer>> effectiveDistrictsByPlanId) throws IOException {
        try (var stream = Files.list(dir)) {
            stream.filter(file -> file.toString().endsWith(".topojson"))
                    .filter(file -> file.getFileName().toString().startsWith("vra_"))
                    .sorted()
                    .forEach(file -> {
                        try {
                            InterestingPlanDocument doc = buildInterestingPlanDoc(file, stateId, effectiveDistrictsByPlanId);
                            if (hasRenderableInterestingPlanTopology(doc.getPayload())) {
                                interestingPlanRepository.save(doc);
                            }
                        } catch (IOException exception) {
                            throw new UncheckedIOException(exception);
                        }
                    });
        } catch (UncheckedIOException exception) {
            throw exception.getCause();
        }
    }

    private InterestingPlanDocument buildInterestingPlanDoc(Path file, String stateId, Map<String, List<Integer>> effectiveDistrictsByPlanId) throws IOException {
        String fileName = file.getFileName().toString();
        String planId = fileName.endsWith(".topojson")
                ? fileName.substring(0, fileName.length() - ".topojson".length())
                : fileName;
        String ensembleType = planId.startsWith("vra_") ? "vra_constrained" : "race_blind";

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("state", stateId);
        payload.put("planId", planId);
        payload.put("planName", toHumanPlanName(planId));
        payload.put("ensembleType", ensembleType);
        payload.put("effectiveDistrictIds", effectiveDistrictsByPlanId.getOrDefault(planId, List.of()));
        payload.put("reasonInteresting", "Imported from Ayden preprocessing output");
        payload.put("summary", new LinkedHashMap<>());
        payload.put("topology", readJsonMap(file));

        InterestingPlanDocument doc = buildDoc(new InterestingPlanDocument(), stateId, "2024_pres", null, ensembleType, null, "TOTAL", payload);
        doc.setPlanId(planId);
        return doc;
    }

    @SuppressWarnings("unchecked")
    private boolean hasRenderableInterestingPlanTopology(Map<String, Object> payload) {
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

    private String toHumanPlanName(String planId) {
        String body = planId.replaceFirst("^(race_blind|vra)_", "").replace('_', ' ');
        if (body.isEmpty()) return planId;
        return Character.toUpperCase(body.charAt(0)) + body.substring(1);
    }

    private void clearInterestingPlanCaches() {
        Objects.requireNonNull(cacheManager.getCache("interestingPlanList")).clear();
        Objects.requireNonNull(cacheManager.getCache("interestingPlan")).clear();
    }

    private void seedVraImpactThresholdTables(Path root) throws IOException {
        vraImpactThresholdTableRepository.save(buildDoc(new VraImpactThresholdTableDocument(), "OR", "2024_pres", "latino", null, null, "CVAP",
                readJsonMap(root.resolve("preprocessing/output/oregon_hispanic_2024_pres.json"))));
        vraImpactThresholdTableRepository.save(buildDoc(new VraImpactThresholdTableDocument(), "SC", "2024_pres", "black",  null, null, "CVAP",
                readJsonMap(root.resolve("preprocessing/output/south_carolina_black_2024_pres.json"))));
    }

    private void seedMinorityEffectivenessBoxWhisker(Path root) throws IOException {
        minorityEffectivenessBoxWhiskerRepository.deleteAll();
        seedMeBoxWhiskerEnsembles(root, "OR", "rb", 6, new int[]{0, 1, 2}, "250plans", "5000plans", new String[]{"hispanic", "white"});
        seedMeBoxWhiskerEnsembles(root, "OR", "vra", 6, new int[]{0, 1, 2, 3}, "5000plans", "5000plans", new String[]{"hispanic", "white"});
        seedMeBoxWhiskerEnsembles(root, "SC", "rb", 7, new int[]{0, 1, 2, 3}, "5000plans", "250plans", new String[]{"black", "white"});
        seedMeBoxWhiskerEnsembles(root, "SC", "vra", 7, new int[]{0, 1, 2, 3}, "5000plans", "250plans", new String[]{"black", "white"});
    }

    private void seedMeBoxWhiskerEnsembles(
            Path root, String state, String type, int totalDistricts,
            int[] srcIndices, String defaultPlanSuffix, String highIndexPlanSuffix, String[] races) throws IOException {
        Path prepro = root.resolve("preprocessing/output/kobe/GUI21");
        String stateLC = state.toLowerCase(Locale.US);
        for (int srcIdx : srcIndices) {
            int selectorIndex = srcIdx + 1;
            List<Map<String, Object>> groupSummaries = new ArrayList<>();
            String plansSuffix = srcIdx >= 2 ? highIndexPlanSuffix : defaultPlanSuffix;
            for (String race : races) {
                Path sourceFile = resolveGui21SeedFile(prepro, stateLC, type, srcIdx, race, plansSuffix);
                groupSummaries.add(readJsonMap(sourceFile));
            }
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("schemaVersion", "v1");
            payload.put("chartType", "minority-effectiveness-box-whisker");
            payload.put("state", state);
            payload.put("election", "2024 Presidential");
            payload.put("totalDistricts", totalDistricts);
            payload.put("units", Map.of("count", "districts"));
            payload.put("groupSummaries", groupSummaries);
            MinorityEffectivenessBoxWhiskerDocument doc = buildDoc(
                new MinorityEffectivenessBoxWhiskerDocument(),
                state, "2024_pres", null, type, null, "CVAP", payload);
            doc.setEnsembleIndex(selectorIndex);
            minorityEffectivenessBoxWhiskerRepository.save(doc);
        }
    }

    private Path resolveGui21SeedFile(
            Path gui21Dir, String stateLC, String type, int srcIdx, String race, String preferredSuffix) throws IOException {
        String preferredFilename = String.format("GUI21_%s_%s%d_%s_%s.json", stateLC, type, srcIdx, race, preferredSuffix);
        Path preferredPath = gui21Dir.resolve(preferredFilename);
        if (Files.exists(preferredPath)) {
            return preferredPath;
        }

        String filenamePrefix = String.format("GUI21_%s_%s%d_%s_", stateLC, type, srcIdx, race);
        try (var paths = Files.list(gui21Dir)) {
            List<Path> matches = paths
                    .filter(Files::isRegularFile)
                    .filter(path -> {
                        String name = path.getFileName().toString();
                        return name.startsWith(filenamePrefix) && name.endsWith(".json");
                    })
                    .sorted(Comparator.comparing(path -> path.getFileName().toString()))
                    .toList();
            if (!matches.isEmpty()) {
                LOG.warn(
                        "Preferred GUI21 seed file missing ({}); falling back to {}",
                        preferredPath.getFileName(),
                        matches.get(0).getFileName());
                return matches.get(0);
            }
        }

        throw new IllegalStateException(
                "Required seed file not found. Preferred path: " + preferredPath
                        + "; searched directory: " + gui21Dir
                        + "; searched prefix: " + filenamePrefix + "*.json");
    }

    private void seedMinorityEffectivenessHistogram(Path root) throws IOException {
        Path gui22 = root.resolve("preprocessing/output/GUI_22_updated.json");
        Map<String, Object> gui22Payload = readJsonMap(gui22);

        minorityEffectivenessHistogramRepository.save(buildDoc(new MinorityEffectivenessHistogramDocument(), "OR", "2024_pres", "latino", null, null, "CVAP",
                buildGui22HistogramPayload(gui22Payload, "oregon", "hispanic", "OR", "Latino", 6, 2)));
        minorityEffectivenessHistogramRepository.save(buildDoc(new MinorityEffectivenessHistogramDocument(), "SC", "2024_pres", "black",  null, null, "CVAP",
                buildGui22HistogramPayload(gui22Payload, "south_carolina", "black", "SC", "Black", 7, 2)));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> buildGui22HistogramPayload(
            Map<String, Object> gui22Payload,
            String stateKey,
            String groupKey,
            String stateId,
            String selectedGroup,
            int totalDistricts,
            int runIndex) {
        Object stateRaw = gui22Payload.get(stateKey);
        if (!(stateRaw instanceof Map<?, ?> stateMapAny)) {
            throw new IllegalStateException("GUI_22_updated missing state section: " + stateKey);
        }
        Map<String, Object> stateMap = (Map<String, Object>) stateMapAny;

        List<Map<String, Object>> rbRuns = castRunList(stateMap.get("raceblind"), stateKey + ".raceblind");
        List<Map<String, Object>> vraRuns = castRunList(stateMap.get("vra"), stateKey + ".vra");
        if (runIndex < 0 || runIndex >= rbRuns.size() || runIndex >= vraRuns.size()) {
            throw new IllegalStateException("Invalid GUI_22_updated run index " + runIndex + " for state " + stateKey);
        }

        Map<String, Integer> rbBins = castBinMap(rbRuns.get(runIndex).get(groupKey), stateKey + ".raceblind[" + runIndex + "]." + groupKey);
        Map<String, Integer> vraBins = castBinMap(vraRuns.get(runIndex).get(groupKey), stateKey + ".vra[" + runIndex + "]." + groupKey);
        int ensembleSize = Math.max(sumBins(rbBins), sumBins(vraBins));

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("schemaVersion", "v1");
        payload.put("chartType", "minority-effectiveness-histogram");
        payload.put("state", stateId);
        payload.put("election", "2024 Presidential");
        payload.put("totalDistricts", totalDistricts);
        payload.put("selectedGroup", selectedGroup);
        payload.put("ensembleSize", ensembleSize);
        payload.put("units", Map.of("count", "plans"));
        payload.put("series", Map.of(
                "vraConstrained", binsToSeries(vraBins, ensembleSize),
                "raceBlind", binsToSeries(rbBins, ensembleSize)));
        return payload;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> castRunList(Object value, String fieldName) {
        if (!(value instanceof List<?> list) || list.isEmpty()) {
            throw new IllegalStateException("GUI_22_updated field must be a non-empty array: " + fieldName);
        }
        List<Map<String, Object>> runs = new ArrayList<>();
        for (Object item : list) {
            if (!(item instanceof Map<?, ?> mapAny)) {
                throw new IllegalStateException("GUI_22_updated run entry must be an object: " + fieldName);
            }
            runs.add((Map<String, Object>) mapAny);
        }
        return runs;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Integer> castBinMap(Object value, String fieldName) {
        if (!(value instanceof Map<?, ?> mapAny) || mapAny.isEmpty()) {
            throw new IllegalStateException("GUI_22_updated histogram bins missing for " + fieldName);
        }
        Map<String, Integer> bins = new LinkedHashMap<>();
        for (Map.Entry<?, ?> entry : mapAny.entrySet()) {
            String key = String.valueOf(entry.getKey());
            Object raw = entry.getValue();
            if (!(raw instanceof Number number)) {
                throw new IllegalStateException("GUI_22_updated bin frequency must be numeric at " + fieldName + "." + key);
            }
            bins.put(key, number.intValue());
        }
        return bins;
    }

    private int sumBins(Map<String, Integer> bins) {
        return bins.values().stream().mapToInt(Integer::intValue).sum();
    }

    private List<Map<String, Object>> binsToSeries(Map<String, Integer> bins, int ensembleSize) {
        return bins.entrySet().stream()
                .sorted(Comparator.comparingInt(entry -> Integer.parseInt(entry.getKey())))
                .map(entry -> {
                    int frequency = entry.getValue();
                    double share = ensembleSize <= 0 ? 0.0 : (double) frequency / ensembleSize;
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("effectiveDistricts", Integer.parseInt(entry.getKey()));
                    row.put("frequency", frequency);
                    row.put("shareOfEnsemble", roundTo(share, 4));
                    return row;
                })
                .toList();
    }

    private void seedManifests() {
        // These manifests are lightweight provenance markers for the seeded dataset version, not a full ingest
        // audit trail.
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
        // Centralize shared envelope metadata here so every seeded collection carries the same baseline
        // schema/version/timestamp fields even when the payload bodies differ.
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
        return objectMapper.readValue(path.toFile(), new TypeReference<>() {});
    }

    private List<Map<String, Object>> readJsonList(Path path) throws IOException {
        if (!Files.exists(path)) {
            throw new IllegalStateException("Required seed file not found: " + path);
        }
        return objectMapper.readValue(path.toFile(), new TypeReference<>() {});
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> normalizeHistogramPayload(Map<String, Object> payload) {
        Map<String, Object> series = (Map<String, Object>) payload.get("series");
        if (series == null) return payload;
        for (Object seriesValue : series.values()) {
            List<Map<String, Object>> bins = (List<Map<String, Object>>) seriesValue;
            for (Map<String, Object> bin : bins) {
                Object ed = bin.get("effectiveDistricts");
                if (ed instanceof String s) {
                    bin.put("effectiveDistricts", Integer.parseInt(s));
                }
            }
        }
        return payload;
    }
}
