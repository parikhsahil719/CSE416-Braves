# Code Review Report

**Date:** 2026-04-23
**Branch:** sahil
**Reviewer:** Claude (automated via /code-review skill)

---

## Presentation Prep Summary

**Recommended starting use case: GUI-9 (Gingles Scatter Plot)**
It's visually striking, directly tied to the VRA legal argument (Gingles preconditions), fully functional for both states, and has a clean end-to-end trace path:

```
Gingles.jsx → GroupSelector → useState(currentGroup) →
useGingles(stateKey, group) → stateQueries.js →
GET /api/states/{stateId}/analysis/gingles?group=&election= →
StateController.getGingles() →
BackendDataService.getGingles() → normalizeState, normalizeGroup,
requireFeasibleGroup, ginglesResultRepository
  .findByStateIdAndGroupKeyAndElectionId() → MongoDB (gingles_results) →
payloadFrom() → JSON response → GinglesScatterChart.jsx render
```

Show OR Latino first, then switch to SC Black to demonstrate both states.

**2–3 pivot-ready use cases:**
- **GUI-16 (Ensemble Splits):** `Simulation.jsx → EnsembleSplits → useEnsembleSplits → /api/states/{stateId}/ensembles/splits → BackendDataService.getEnsembleSplits → EnsembleSplitRepository → MongoDB`
- **GUI-20 (VRA Impact Table):** `Simulation.jsx → VRAImpact → useVraImpact → /api/states/{stateId}/analysis/vra-impact-thresholds → BackendDataService.getVraImpactThresholds → VraImpactThresholdTableRepository → MongoDB`
- **GUI-4 (Heatmap):** `MinorityHeatMap.jsx → usePrecinctTopology + useHeatmap → two parallel endpoints → Leaflet render with bin legend`

**AI tools to mention:** Claude Code (used for code quality review, refactoring, modularity, and TanStack Query caching architecture). Be prepared to walk through specific examples of AI-assisted improvements (e.g., the caching layer in `queryClient.js`, the `CacheBuster` component in `App.jsx`, the server-side Caffeine + ETag setup).

---

## Executive Summary

- **12 required GUI use cases: 12 PASS, 0 PARTIAL, 0 MISSING**
- **7 preferred GUI use cases: 4 PASS, 3 PARTIAL, 0 MISSING**

**Top 3 most urgent issues:**
1. **BUG** — `src/components/Compare.jsx:82–84`: Right map ("Interesting Plan") fetches the *enacted* topology instead of calling `/districts/interesting`. Both sides show the same enacted plan.
2. **BUG** — `src/components/Simulation.jsx:163`: `DistrictMap` is rendered without `onSelectDistrict` / `onChangeTab` props — clicking any district in the Simulation page will throw a runtime TypeError.
3. **SMELL** — `src/components/EI.jsx:29`: `EiBarPanel` reads `payload.categories` for EI bar data, but the test fixture uses `bars` as the field name. Verify the actual seed JSON field name matches before the review.

---

## GUI Use Case Coverage Matrix

| ID | Name | Priority | Status | Notes |
|----|------|----------|--------|-------|
| GUI-1 | Select state | Required | **PASS** | `/api/states`, SplashPage Leaflet click + navigation |
| GUI-2 | Display enacted district map | Required | **PASS** | `/api/states/{stateId}/districts/enacted/topology`, DistrictMap.jsx |
| GUI-3 | State data summary | Required | **PASS** | `/api/states/{stateId}/state-summary`, StatePage sidebar |
| GUI-4 | Precinct demographic heatmap | Required | **PASS** | Geometry + bins endpoints, MinorityHeatMap.jsx, group dropdown |
| GUI-6 | Congressional representation table | Required | **PASS** | `/districts/enacted/table`, DistrictData table in StatePage |
| GUI-7 | Highlight district | Preferred | **PASS** | Table row click → `onSelectDistrict` → DistrictMap.jsx `applySelection` effect |
| GUI-8 | Compare two district plans | Preferred | **PARTIAL** | Compare.jsx renders two maps side-by-side, but right map fetches enacted topology again — not the interesting plan |
| GUI-9 | Gingles scatter plot | Required | **PASS** | `/analysis/gingles`, Gingles.jsx + GinglesScatterChart, OR and SC both seeded |
| GUI-10 | Gingles precinct table | Preferred | **PASS** | `/analysis/gingles/table`, PrecinctTable in Gingles.jsx, paginated |
| GUI-12 | EI support distributions | Required | **PASS** | `/analysis/ei-support`, EiAnalysisPanel in EI.jsx |
| GUI-13 | EI bar chart with CIs | Preferred | **PARTIAL** | EiBarPanel reads `payload.categories` — verify actual seed JSON field; may be a silent empty render |
| GUI-15 | EI KDE | Preferred | **PASS** | `/analysis/ei-kde`, EiKdePanel with support-gap density curve |
| GUI-16 | Ensemble splits bar chart | Required | **PASS** | `/ensembles/splits`, EnsembleSplits + VRAAnalysis, both ensembles compared |
| GUI-17 | Box & whisker | Required | **PASS** | `/ensembles/box-whisker`, BoxWhiskerChart, race-blind and VRA both |
| GUI-19 | Interesting district plan | Preferred | **PARTIAL** | Endpoint exists and seeded; InterestingMap component exists, but party coloring is fully commented out — all districts render gray |
| GUI-20 | VRA impact threshold table | Required | **PASS** | `/analysis/vra-impact-thresholds`, VRAImpact in Simulation.jsx, 3 rows |
| GUI-21 | Minority effectiveness box & whisker | Required | **PASS** | `/analysis/minority-effectiveness/box-whisker`, custom SVG render |
| GUI-22 | Minority effectiveness histogram | Required | **PASS** | `/analysis/minority-effectiveness/histogram`, MinorityEffectivenessHistogram |
| GUI-24 | Reset page | Preferred | **PARTIAL** | No dedicated Reset button; navigation to `/` via header bar resets state implicitly |

---

## Blockers

**No blockers.** All 12 required GUI use cases are fully implemented and functional for both OR and SC. The 3 PARTIAL items are all preferred use cases.

---

## Performance Findings

**Backend:**

- **INFO** — `server/.../SeedDataLoader.java`: Individual `repository.save()` calls (not bulk inserts). For current document count (<50), startup time is negligible. If volume grows, switch to `saveAll()`.
- **GOOD** — `GeometryAssetService.java`: All TopoJSON files cached via `@Cacheable`. Disk I/O happens only once per application lifetime.
- **GOOD** — `MongoIndexConfig.java`: Compound indexes cover every query field combination used by repositories. No missing indexes.
- **GOOD** — `BackendDataService.java`: Every public method is `@Cacheable`. No N+1 patterns. All queries are single-document lookups by indexed keys.
- **GOOD** — HTTP `Cache-Control: max-age=604800, public` + ETag on all geometry endpoints. Frontend `staleTime: Infinity` on topology queries — no unnecessary refetches.
- **GOOD** — Large geometry files served from backend classpath, not bundled into the Vite build.

**Frontend:**

- **SMELL** — `src/components/Simulation.jsx:21`: `toChartData` uses `src.find(d => d.splitLabel === label)` inside `allLabels.map()` — O(n²). Same pattern at line 106 in `MinorityEffectivenessHistogram`. Not critical at n=6–7 but convert to a `Map` lookup for correctness.
- **GOOD** — TanStack Query used consistently for all API calls across the app.
- **SMELL** — `src/components/Compare.jsx:45–63, 69–103`: Two `useEffect` hooks with raw `axios.get` instead of the `useDistrictTopology` / `useInterestingPlan` hooks from `stateQueries.js`. Bypasses the cache entirely on the Compare page.

---

## Error Handling Findings

**Backend:**

- **GOOD** — `ApiExceptionHandler.java` handles all error cases: `MissingServletRequestParameterException` → 400, `IllegalArgumentException` → 422, `NoSuchElementException` → 404, `UnsupportedOperationException` → 501, all others → 500 with sanitized message. No stack traces exposed.
- **GOOD** — `@NotBlank` on all required path variables and request params. `StateCodeUtil.normalizeOrThrow` rejects invalid state IDs before any DB call.
- **GOOD** — `SeedDataLoader` validates precinct count (≥1000) and population realism at startup and fails fast if data is suspect.
- **INFO** — `BackendDataService.getEiSupport` validates and normalizes the `party` parameter via `normalizeParty()` but does NOT pass party to the repository query — `findByStateIdAndElectionIdAndGroupKey` ignores it. Passing `party=REP` silently returns the same result as `party=DEM`. Verify whether EI support is intentionally party-independent or if this is an oversight.

**Frontend:**

- **BUG** — `src/components/Simulation.jsx:163`: `<DistrictMap stateName={stateName} data={mapData} />` passes no `onSelectDistrict` or `onChangeTab`. In `DistrictMap.jsx:73–74`, `handleMapClick` calls both unconditionally — clicking a district in the Simulation page will throw `TypeError: onSelectDistrict is not a function`.
- **GOOD** — Most components consistently check `isLoading` and `isError` before rendering. Loading and error states are user-visible and meaningful.
- **SMELL** — `src/components/VRAAnalysis.jsx:11`: Destructures only `data` from `useEnsembleSplits`, ignoring `isLoading` and `isError`. If the fetch is loading or fails, the component silently renders only the label with no chart or feedback.
- **SMELL** — `src/components/EI.jsx:29`: If `payload.categories` is the wrong field name, the `?? []` fallback renders an empty chart silently. Confirm field name against the seeded JSON files.

---

## Test Coverage Findings

**Backend:**

- **COVERED** — `StateControllerTest.java`: All 17 endpoints have at least one happy-path assertion. Geometry ETag/cache headers tested. Unsupported state ID correctly rejected with 422.
- **PARTIAL** — Only OR is tested in the integration test. SC is not exercised. Add at least one SC test to catch state-specific data or path issues.
- **PARTIAL** — `GeometryAssetServiceTest.java` and `HealthControllerTest.java` exist.
- **UNTESTED** — `BackendDataService.java`: No unit tests for service-layer logic (normalization helpers, `requireFeasibleGroup`, `payloadFrom`, `withStoredMetadata`).
- **UNTESTED** — Payload invariant enforcement: no tests verify `repWins + demWins = totalDistricts`, `min ≤ q1 ≤ median ≤ q3 ≤ max`, or histogram frequencies summing to `ensembleSize`.
- **UNTESTED** — No integration test runs against real MongoDB.

**Frontend:**

- **UNTESTED** — `src/test/setupTests.js` exists but no component test files found. Zero React component tests. Add at minimum: `StatePage`, `Simulation`, `EI`, and `Gingles` with mocked query responses for loading, error, and data states.

---

## Code Quality & Coding Conventions Findings

### A. Modularity & Screen Readability

- **SMELL** — `src/components/Simulation.jsx:26–28`: The entire `<BarChart>` JSX tree (CartesianGrid, XAxis, YAxis, Tooltip, Bar) is collapsed into a single line inside `<ResponsiveContainer>`. Unreadable without horizontal scrolling. Split across multiple lines.
- **SMELL** — `src/components/Simulation.jsx:153–155`: The three `renderPanel()` conditional returns are each a single very long line with inline component trees. Extract each panel case into a named sub-component (e.g., `BoxWhiskerPanel`, `EffectivenessPanel`).
- **SMELL** — `server/.../SeedDataLoader.java`: 567 lines, mixes startup orchestration, data validation, seed payload construction, document building, and JSON reading. Consider extracting validation into `SeedDataValidator` and keeping `SeedDataLoader` focused on orchestration.
- **GOOD** — `BackendDataService.java`: Every service method is ≤12 lines. All normalize helpers ≤8 lines. `payloadFrom` and `withStoredMetadata` fit comfortably on one screen. Excellent modularity.
- **GOOD** — `StateController.java`: Each endpoint method is 5–15 lines. Zero business logic in the controller. Clean delegation to service.
- **GOOD** — `GeometryAssetService.java`: Private helpers (`sanitizeTopology`, `sanitizeGeometryCollection`, `sanitizeGeometry`, `computeEtag`, `readJsonMap`) are each ≤25 lines and do exactly one thing.
- **GOOD** — `src/components/Gingles.jsx`: `StateSection`, `PrecinctTable`, and `GroupSelector` are separate, well-sized sub-components.

### B. Data Structures

- **SMELL** — `src/components/Simulation.jsx:21, 106`: `allLabels.map(label => ({ ..., frequency: src.find(d => d.splitLabel === label)?.frequency ?? 0 }))` — O(n²). Convert `src` to a `Map<splitLabel, frequency>` before mapping over labels. Same pattern in the histogram merge.
- **GOOD** — `BackendDataService.java` uses `LinkedHashMap` (preserves insertion order) for `withStoredMetadata`. Correct for JSON serialization where field order matters.
- **GOOD** — `GroupThresholds.java` uses `Map.of()` for O(1) feasibility lookup. Correct structure choice.
- **GOOD** — `GeometryAssetService.java` uses `Set<String>` for `propertyKeysToKeep` — O(1) lookup in `sanitizeGeometry`. Correct.

### C. Naming Conventions

**Java — GOOD overall:**
- Packages lowercase: `edu.stonybrook.cse416.braves.server.api` — correct.
- Classes UpperCamelCase nouns: `StateController`, `BackendDataService`, `SeedDataLoader`, `GeometryAssetService` — correct.
- Methods lowerCamelCase verbs: `getGingles`, `normalizeState`, `requireFeasibleGroup`, `payloadFrom` — correct.
- Constants ALL_CAPS: `DEFAULT_ELECTION_ID`, `PARTY_KEYS`, `MIN_GROUP_POPULATION`, `STATIC_GEOMETRY_CACHE` — correct.
- No default package. Correct.

**JavaScript/React — GOOD overall:**
- Components PascalCase: `StatePage`, `DistrictMap`, `MinorityHeatMap`, `EnsembleSplits` — correct.
- Custom hooks `useCamelCase`: `useGingles`, `useBoxWhisker`, `useMeHistogram` — correct.
- Variables/functions camelCase: `currPage`, `switchMap`, `openStatePage`, `buildMapStyle` — correct.

**MINOR** — `src/components/Compare.jsx:11–21` defines a local `toStateCode` function that is an exact duplicate of `src/utils/stateUtils.js:toStateCode`. Import from the utility instead.

### D. Comments — Only When Needed

- **SMELL** — `src/App.jsx:41–49`: Four consecutive state variable comments (`// State variable for switching between views`, etc.) just restate the variable names. The names `currPage`, `currMap`, `currMinority`, `currEI` are self-explanatory. Remove all four.
- **SMELL** — `src/App.jsx:52–56`: Comment `// Store relevant data that will ALMOST ALWAYS be used here` is stale — data is now API-driven. Remove.
- **SMELL** — `src/App.jsx` lines 62, 98, 107, 112, 118, 123, 127: Commented-out dead code (`// const stateTabs`, `// Probably not ensemble data`, five `// <StateHeaderBar>` lines). Remove entirely.
- **SMELL** — `src/components/InterestingMap.jsx:8–12`: `getColor` function has its real logic commented out and replaced by a gray hardcode. This masks a bug and confuses any reader. Restore the logic.
- **SMELL** — `src/components/InterestingMap.jsx:113–114, 121–122`: Commented-out legend HTML in the `Legend` component. Restore or remove.
- **GOOD** — `src/App.jsx:11–13`: The `CacheBuster` comment explains the non-obvious WHY of the bootTime comparison mechanism. Correct and appropriate.
- **GOOD** — Java files: No worthless Javadoc detected. `@Operation` annotations serve as API documentation, not code restatements.

### E. Magic Numbers

- **SMELL** — `server/.../SeedDataLoader.java:136–137`: `orCount < 1000 || scCount < 1000` — extract `private static final int MIN_PRECINCT_COUNT = 1000`.
- **SMELL** — `server/.../SeedDataLoader.java:181–182`: `popToVotesRatio < 1.2 || popToVotesRatio > 3.0` — extract `MIN_POP_VOTE_RATIO = 1.2` and `MAX_POP_VOTE_RATIO = 3.0`.
- **SMELL** — `server/.../SeedDataLoader.java:146–147`: `3_500_000`, `5_000_000`, `4_500_000`, `6_500_000` — population range bounds not named. Extract as constants or pass with descriptive parameter names.
- **MINOR** — `src/components/EI.jsx:34, 62`: `height: "320px"` appears twice as inline style. Extract as a CSS class.
- **MINOR** — `src/components/DistrictMap.jsx:161, 163`: Hardcoded center coordinates and zoom levels. Acceptable as geo constants but could live in `stateUtils.js` alongside `toStateCode`.
- **GOOD** — `server/.../GroupThresholds.java`: `MIN_GROUP_POPULATION = 200_000` is properly named. Population counts in the map are data constants, not logic, so inline is acceptable.
- **GOOD** — `server/.../BackendDataService.java`: `DEFAULT_ELECTION_ID = "2024_pres"` and `PARTY_KEYS = Set.of("DEM", "REP")` are named constants. No magic strings in logic.

### F. Java-Specific Formatting

- **GOOD** — All `{` at end of line throughout the codebase.
- **GOOD** — Each annotation on its own line (`@Override`, `@Cacheable`, `@GetMapping`, `@RestController` all on separate lines).
- **GOOD** — Declarations at beginning of blocks in all service and controller classes.
- **GOOD** — `{}` used for empty bodies.
- **MINOR** — `server/.../SeedDataLoader.java:100–127` `run()` method: blank-line grouping between `if (count == 0) seedX()` calls is inconsistent in spacing. Standardize to one blank line between each logical group.

### G. Intra-Language Consistency

**Java — Excellent consistency:**
- All classes use constructor injection (no `@Autowired` field injection anywhere).
- All `StateController` endpoints follow the identical pattern: `@Operation` → `@ApiResponses` → `@GetMapping` → parameter annotations → delegate to service.
- All service methods follow: normalize inputs → validate → fetch → return. Identical flow throughout.
- Consistent `@Cacheable` with named caches on every service method.

**JavaScript/React — Two consistency violations:**
- **INCONSISTENCY** — `src/components/VRAAnalysis.jsx:11` destructures only `data` from `useEnsembleSplits`, ignoring `isLoading` and `isError`. Every other component checks both. This file appears to follow the pre-TanStack-Query pattern.
- **INCONSISTENCY** — `src/components/Compare.jsx` uses raw `axios.get` inside `useEffect` while all other components use the TanStack Query hooks from `stateQueries.js`. It is the only component doing this and is visibly out of place.
- **GOOD** — Import ordering consistent across all JSX files: React first, then library imports, then local imports.
- **GOOD** — All components use the same `curr*` / `switch*` prop naming convention.
- **GOOD** — All data-fetching components follow the same loading/error/render structure (except VRAAnalysis, noted above).

### H. Configuration & Test Data

- **GOOD** — `APP_SEED_ENABLED` and `APP_SEED_ROOT_PATH` externalized via `@Value` with defaults.
- **GOOD** — MongoDB URI externalized via `MONGODB_URI` env var.
- **GOOD** — All 21+ MongoDB collections seeded for both OR and SC with realistic data.
- **GOOD** — Population realism validation at startup ensures data quality before serving any requests.
- **GOOD** — Heatmap and Gingles data are upserted on every startup, ensuring fresh data after file changes.

---

## Recommended Action Items

### Priority 1 — Fix before the review (runtime bugs that will crash during demo)

1. **`src/components/Simulation.jsx:163`** — Pass `onSelectDistrict` and `onChangeTab` to `DistrictMap`, or guard `handleMapClick` in `DistrictMap.jsx:72` with null-checks. Clicking any district in the Simulation page currently throws.
2. **`src/components/Compare.jsx:82–84`** — Replace the second `useEffect`'s `axios.get('/districts/enacted/topology')` with a call to `/api/states/${stateCode}/districts/interesting?planId=plan-42`. The right panel is labeled "Interesting Plan" but currently shows the enacted plan again. (Affects GUI-8 and GUI-19.)
3. **`src/components/EI.jsx:29`** — Open `mock-data/v1/ei-precinct-bar-ci/OR_demo.json` and confirm whether the array field is `categories` or `bars`. If `bars`, update line 29 to `(payload.bars ?? []).map(cat => ...)`.

### Priority 2 — Fix for code quality (professor will examine code directly)

4. **`src/components/InterestingMap.jsx:8–12`** — Restore party coloring: uncomment the `DEMOCRATIC`/`REPUBLICAN` color branches in `getColor`. Also uncomment the `Legend` HTML (lines 113–114, 121–122). The interesting plan map currently renders all districts gray.
5. **`src/components/Compare.jsx:11–21`** — Remove the local `toStateCode` duplicate. Import from `../utils/stateUtils.js`.
6. **`src/components/Compare.jsx`** — Replace both raw `axios.get` + `useEffect` fetches with `useDistrictTopology(stateCode)` and `useInterestingPlan(stateCode, 'plan-42')` from `stateQueries.js`. This also fixes the cache bypass.
7. **`src/components/VRAAnalysis.jsx:11`** — Destructure `isLoading` and `isError` from `useEnsembleSplits` and add loading/error state renders to match all other components.
8. **`src/App.jsx`** — Remove all commented-out dead code: the 4 state variable comments (lines 41–49), the stale minority-data comment (52–56), and all 5 commented-out `<StateHeaderBar>` lines.
9. **`src/components/InterestingMap.jsx`** — Remove remaining commented-out code blocks.

### Priority 3 — Coding convention fixes (L18 rubric)

10. **`src/components/Simulation.jsx`** — Break up compressed BarChart JSX on lines 26–28 across multiple lines. Extract `renderPanel()` branches into named sub-components (each is currently a single 200+ character line).
11. **`server/.../SeedDataLoader.java`** — Extract magic numbers: `MIN_PRECINCT_COUNT = 1000`, `MIN_POP_VOTE_RATIO = 1.2`, `MAX_POP_VOTE_RATIO = 3.0`, and the OR/SC population range bounds.
12. **`src/components/Simulation.jsx:21, 106`** — Replace O(n²) `.find()` inside `.map()` with a `Map` lookup for the chart data merge.
13. **`server/.../BackendDataService.getEiSupport`** — Investigate whether the `party` parameter should filter the repository query. Currently validated but ignored in the query call.

### Priority 4 — Tests (add before final submission)

14. Add at least one SC-state test to `StateControllerTest.java`.
15. Add service-layer unit tests for `BackendDataService` normalization helpers and `requireFeasibleGroup` edge cases.
16. Add payload invariant tests: ensemble splits sum, box-whisker ordering, VRA table 3-row invariant.
17. Add basic React component tests for `StatePage`, `Simulation`, `EI`, and `Gingles` (loading, error, and data render paths).
