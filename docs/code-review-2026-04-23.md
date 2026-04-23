# Code Review Report

**Date:** 2026-04-23
**Branch:** sahil
**Reviewer:** Claude Code (`/code-review` skill)
**Scope:** Full codebase audit — GUI use case coverage, performance, error handling, tests, code quality.

---

## Executive Summary

- **12 required GUI use cases:** 10 PASS, 2 PARTIAL (GUI-3, GUI-4) — no MISSING
- **7 preferred GUI use cases:** 4 PASS, 2 PARTIAL (GUI-8, GUI-15), 1 MISSING (GUI-24)
- **Top 3 most urgent issues:**
  1. `Compare.jsx:83` — right map fetches enacted topology instead of the interesting plan; `InterestingMap` never receives interesting-plan data (affects GUI-8 and GUI-19)
  2. `SideBar.jsx:29` — trailing space in `navigate(...)` call breaks Gingles navigation for GUI-9/10
  3. `EI.jsx:91-164` — GUI-15 KDE renders only one group's density curve; requirement specifies two-group comparison

---

## GUI Use Case Coverage Matrix

| ID | Name | Priority | Status | Notes |
|----|------|----------|--------|-------|
| GUI-1 | Select state | Required | **PASS** | `/api/states` + SplashPage Leaflet click + dropdown |
| GUI-2 | Display enacted district plan | Required | **PASS** | `/districts/enacted/topology` + DistrictMap.jsx |
| GUI-3 | State data summary | Required | **PARTIAL** | See blockers |
| GUI-4 | Demographic heat map | Required | **PARTIAL** | See blockers |
| GUI-6 | Congressional representation table | Required | **PASS** | `/districts/enacted/table` + DistrictData in StatePage |
| GUI-7 | Highlight district | Preferred | **PASS** | DistrictMap.jsx `selectedDistrict` prop + table click handler |
| GUI-8 | Compare two district plans | Preferred | **PARTIAL** | Compare.jsx fetches enacted plan for both sides |
| GUI-9 | Gingles scatter plot | Required | **PASS** | `/analysis/gingles` + GinglesScatterChart — see Tier 4 nav bug |
| GUI-10 | Gingles precinct table | Preferred | **PASS** | `/analysis/gingles/table` + paginated table in Gingles.jsx |
| GUI-12 | EI support distribution | Required | **PASS** | `/analysis/ei-support` + EiSupportChart.jsx |
| GUI-13 | EI bar chart with CI | Preferred | **PASS** | `/analysis/ei-precinct-bar-ci` + inline EiBarPanel in EI.jsx |
| GUI-15 | EI KDE results | Preferred | **PARTIAL** | Shows one group only; requirement says compare two groups |
| GUI-16 | Ensemble splits bar chart | Required | **PASS** | `/ensembles/splits` + EnsembleSplits in Simulation.jsx |
| GUI-17 | Box & whisker | Required | **PASS** | `/ensembles/box-whisker` + BoxWhisker in Simulation.jsx |
| GUI-19 | Interesting district plan | Preferred | **PARTIAL** | Endpoint + seed data exist; Compare.jsx never calls the endpoint |
| GUI-20 | VRA impact threshold table | Required | **PASS** | `/analysis/vra-impact-thresholds` + VRAImpact in Simulation.jsx |
| GUI-21 | Minority effectiveness box & whisker | Required | **PASS** | `/analysis/minority-effectiveness/box-whisker` + SVG chart in Simulation.jsx |
| GUI-22 | Minority effectiveness histogram | Required | **PASS** | `/analysis/minority-effectiveness/histogram` + MinorityEffectivenessHistogram in Simulation.jsx |
| GUI-24 | Reset page | Preferred | **MISSING** | No reset button; navigating back to `/` works but is not surfaced |

---

## Blockers (Required Use Cases Not Fully Implemented)

### GUI-3: State data summary — PARTIAL

**What the professor requires:**
> "State population; state voter distribution; population of each significant racial/ethnic group in the state; party control of redistricting; summary of congressional representatives by party; summary of ensembles available (number of plans, population equality threshold)"

**What's missing:**

1. **Endpoint URL mismatch** (`StateController.java:125`): The controller exposes `GET /api/states/{stateId}/state-summary` but `docs/use-case-requirements.md` lists the contract as `GET /api/states/{stateId}/summary`. The frontend and backend agree on `/state-summary`, so this is a functional non-issue — but the spec divergence should be reconciled before demo.

2. **Partial racial group display** (`StatePage.jsx:103-104`): The State tab shows exactly one minority group per state (hardcoded to `stateData.AsianPopulation` for Oregon, `stateData.BlackPopulation` for SC). The requirement says "population of **each** significant racial/ethnic group." The backend seeds `feasibleGroups: ["Latino", "Asian", "White"]` for OR and `["Black", "Latino", "White"]` for SC, but the frontend only surfaces one. Latino population is not shown for either state.

   ```jsx
   // StatePage.jsx:103
   <p className="statePageDataBubbleLabel">
     {stateName === "Oregon" ? "Asian" : "Black"} Population:
   </p>
   <p className="statePageData statePageDataNum">
     {stateName === "Oregon" ? stateData.AsianPopulation : stateData.BlackPopulation}
   </p>
   ```

**Fix:** Update the State tab to dynamically render population figures for all feasible groups listed in the API response's `feasibleGroups` field, instead of the hardcoded single-group display.

---

### GUI-4: Demographic heat map — PARTIAL

**What the professor requires:**
> "When the user selects a feasible minority group from a drop-down menu, a heat map for the demographic group in the state will be displayed."

**What's missing:**

`GroupThresholds.java` declares `white` as a feasible group for both states (OR: 3,627,243; SC: 3,780,393 — both well above the 200,000 threshold). The requirement says all feasible groups should be selectable.

- `SeedDataLoader.java` seeds heatmap bins for: OR (latino, asian), SC (black, latino). White is not seeded for either state.
- `MinorityHeatMap.jsx` shows only `["Latino", "Asian"]` for OR and `["Black", "Latino"]` for SC. White is never offered.

If this is an intentional design decision (white is excluded from VRA minority analysis), then `GroupThresholds.java` should not mark white as feasible, or the heatmap selector should explicitly document the exclusion. As-is, the code is self-contradictory.

**Fix (option A):** Seed white heatmap data and add "White" to the MinorityHeatMap dropdown.
**Fix (option B):** Remove `white` from `GroupThresholds.java` maps so it is not considered feasible and update the CLAUDE.md scope note accordingly.

---

## Performance Findings

| Sev | Location | Finding |
|-----|----------|---------|
| WARNING | `MinorityHeatMap.jsx:172` | Hardcoded 1500ms `window.setTimeout` delay before Leaflet map creation. There is no retry logic or comment explaining the delay. If the DOM is ready sooner, the user waits unnecessarily; if the DOM is not ready in 1500ms, the map still may not render. Replace with a ref-based readiness check or a `useLayoutEffect`. |
| WARNING | `Compare.jsx:33-103` | Two `useEffect` hooks both call `GET /api/states/{stateCode}/districts/enacted/topology`. Both produce identical requests. Even with HTTP caching these are two round trips on first load. Consolidate into a single fetch. |
| INFO | `EI.jsx:211-231` | District topology is fetched on every mount of the EI component, even when the map panel is not displayed (`currMap === "Precinct Heat Map"`). Since the topology is cached by the browser after the first hit (7-day `max-age` + ETag), this is low cost but still unnecessary work on mount. |
| INFO | `SeedDataLoader.java:117-118` | `seedHeatmapBins()` calls `heatmapBinRepository.deleteAll()` on every startup, wiping and re-inserting all heatmap records. This is safe because the data is immediately re-seeded, but if the seed crashes midway (e.g., missing Archive.zip), the collection is left empty. All other seed methods use count-guarded upserts instead. Align heatmap seeding with the upsert pattern used for Gingles. |
| INFO | `GeometryAssetService.java:159-173` | `computeEtag()` serializes the full topology payload to bytes to compute SHA-256. For large files this is done on first load only and cached via `@Cacheable`. Not a concern in production but worth noting this is O(n) in topology size. |

---

## Error Handling Findings

| Sev | Location | Finding |
|-----|----------|---------|
| WARNING | `BackendDataService.java:274` | `normalizeGroupSelector()` silently takes `parts[0]` when multiple comma-separated groups are passed (e.g., `groups=black,latino`). No 400 is returned; the extra groups are dropped. The parameter is named `groups` (plural) but only one is used. This creates a misleading API surface. Either rename to `group`, enforce single-value validation, or implement multi-group support. |
| WARNING | `Compare.jsx` (entire file) | No error state is shown for the right ("Interesting Plan") map when it fails to load. `rightMapLoadFailed` is tracked in state but only triggers the status message for the right map — which is the enacted plan, not the interesting plan. Once the interesting plan fetch is correctly wired, error handling needs to be added for that call specifically. |
| INFO | `ApiExceptionHandler.java` | Global handler is complete and correct: 400 for missing params, 422 for IllegalArgumentException, 404 for NoSuchElementException, catch-all 500 with generic message (no stack trace). No issues. |
| INFO | `SeedDataLoader.java:104-131` | Seed failures throw `IllegalStateException` which will crash the application at startup. This is the correct fail-fast behavior — seeding bad data is worse than not starting. |
| INFO | `StateController.java` | All required params validated with `@NotBlank` + `@Validated`; missing params produce a clean 400 via `ApiExceptionHandler`. |

---

## Test Coverage Findings

### Backend

| Area | Status | Notes |
|------|--------|-------|
| `StateController` endpoints (geometry) | **COVERED** | `StateControllerTest` covers district topology, precinct topology, US states topology with ETag and cache-control assertions |
| `StateController` endpoints (data) | **COVERED** | Mega-test method covers all 16 data endpoints in a single test with mock service overrides |
| Error handling (bad state ID) | **COVERED** | `getEnsembleSummaryRejectsUnsupportedStateIds` asserts 422 + error body |
| SC state endpoints | **UNTESTED** | All controller tests use OR only; no assertions for SC state responses |
| `BackendDataService` business logic | **UNTESTED** | `normalizeGroupSelector` silent truncation, `requireFeasibleGroup`, `normalizeParty` validation not tested independently |
| Payload invariants | **UNTESTED** | No tests assert ensemble splits sum, box-whisker ordering (`min ≤ q1 ≤ median ≤ q3 ≤ max`), VRA impact 3-row count, histogram frequency sum |
| `GeometryAssetService` | **COVERED** (unit test file exists per file index) | |

**Priority tests to add:**
1. A controller test using SC state to verify both states return valid payloads
2. Service-layer unit tests for `normalizeGroupSelector` (single group, comma-separated, blank), `normalizeParty` (DEM, REP, invalid), `requireFeasibleGroup` (feasible, infeasible, unknown state)
3. Payload invariant tests loading actual mock-data fixtures and asserting structural constraints

### Frontend

| Area | Status | Notes |
|------|--------|-------|
| `utils/minorityHeatMap.js` | **COVERED** | `minorityHeatMap.test.js` covers `normalizeMinorityGroup`, `getFeaturePercentage`, `getHeatmapColor` |
| All React components | **UNTESTED** | No component tests exist for any component |
| Chart components (EiSupportChart, BoxWhiskerChart, GinglesScatterChart, etc.) | **UNTESTED** | No rendering tests with realistic mock data |
| Loading / error / empty states | **UNTESTED** | None of the conditional renders are tested |

**Priority tests to add:**
1. `GinglesScatterChart` renders scatter points and regression curves from a realistic payload
2. `Simulation.jsx` shows loading state, renders splits/box-whisker/histogram/VRA table panels correctly
3. `StatePage.jsx` shows fallback data when `/state-summary` fails

---

## Code Quality Findings

### Bugs

| Sev | Location | Finding |
|-----|----------|---------|
| BUG | `SideBar.jsx:29` | `navigate(\`/state/${stateName}/Gingles \`)` — trailing space in the path. The route is defined as `/state/:stateName/Gingles` (no space). React Router will not match this route, causing navigation to silently fail or render nothing. Remove the trailing space. |
| BUG | `Compare.jsx:83-101` | The right map `useEffect` calls `GET /api/states/${stateCode}/districts/enacted/topology` — the same endpoint as the left map. `InterestingMap` is passed enacted-plan data and renders the enacted plan in gray. The interesting plan endpoint (`/districts/interesting?planId=plan-42`) is never called. Fix: replace lines 83–101 with a fetch to `/districts/interesting`. |

### Smells

| Sev | Location | Finding |
|-----|----------|---------|
| SMELL | `StatePage.jsx:103-104` | Racial group population display is hardcoded per state name (Asian for Oregon, Black for SC). If the feasible groups change, this silently shows the wrong data. Use the `feasibleGroups` array from the API response to render all groups dynamically. |
| SMELL | `EI.jsx:90-164` | GUI-15 (`EiKdePanel`) renders only the first series in `payload.series`. The requirement states: "compare support for a candidate between two racial/ethnic groups." The current implementation shows a single group's KDE, not a comparison. The backend payload supports multiple series but only `series[0]` is rendered. |
| SMELL | `SeedDataLoader.java:482-489` | `seedEiPrecinctBarCi` saves the same JSON file for both DEM and REP party keys for all groups (e.g., `OR_demo.json` → DEM and `OR_demo.json` → REP). The party selector in the frontend is hardcoded to `party: "DEM"` so REP data is never shown. Either add distinct REP payloads or remove the REP variant seeding to avoid confusion. |
| SMELL | Multiple components | `toStateCode()` is copy-pasted into `SplashPage.jsx`, `StatePage.jsx`, `Compare.jsx`, `EI.jsx`, `Simulation.jsx`, and `Gingles.jsx`. Extract to `utils/stateCode.js`. |
| SMELL | `App.jsx:84-113` | Routes for `/Minority Analysis`, `/Custom State Analysis`, `/Simulation Minority Data`, and `/Voting Rights Analysis` are still registered but their sidebar links are commented out. These are dead routes that add confusion. Remove them or re-link them. |
| MINOR | `InterestingMap.jsx:8-13` | `getColor()` always returns `"#666666"` with the actual result-based logic commented out. The interesting plan map renders all districts in the same gray color. If party coloring is intentionally disabled for interesting plans, add a brief inline comment; otherwise restore the conditional logic. |
| MINOR | `EI.jsx:320-322` | Cleanup effect `useEffect(() => { return () => switchEI(''); }, [])` is missing `switchEI` in its dependency array. React will lint-warn about this; while functionally acceptable here (cleanup-only effect), adding `switchEI` to the dep array removes the warning cleanly. |

---

## Recommended Action Items

Ordered by priority:

1. **[BLOCKER – GUI-9/10]** Fix trailing space in `SideBar.jsx:29` — `navigate(\`/state/${stateName}/Gingles\`)` (remove the space). This currently prevents Gingles Charts navigation from working.

2. **[BLOCKER – GUI-8/19]** Fix `Compare.jsx`: replace the second `useEffect` (lines 69–103) to call `GET /api/states/${stateCode}/districts/interesting?planId=plan-42` and pass the result to `InterestingMap`. Add error handling for the interesting-plan fetch.

3. **[BLOCKER – GUI-3]** Update `StatePage.jsx` State tab to display all feasible groups from the API (not just one hardcoded group). The `feasibleGroups` array is already in the summary payload.

4. **[BLOCKER – GUI-4]** Resolve the white-group inconsistency: either seed white heatmap data and add "White" to the `MinorityHeatMap` dropdown, or remove white from `GroupThresholds.java` and update documentation.

5. **[GUI-15]** Update `EiKdePanel` in `EI.jsx` to render multiple density series from `payload.series` (not just `series[0]`), so two groups are compared on the same chart as required.

6. **[GUI-24]** Add a reset button (e.g., in `CountryHeaderBar`) that navigates to `/` and calls `switchPage('Country')`.

7. **[Performance]** Remove the hardcoded 1500ms delay in `MinorityHeatMap.jsx:172`. Replace with a proper DOM-readiness or `useLayoutEffect` pattern.

8. **[Error Handling]** Rename `groups` param in `GET /api/states/{stateId}/analysis/ei-support` to `group` (singular) in `StateController.java` and `BackendDataService.java` to match the single-value behavior of `normalizeGroupSelector()`.

9. **[Tests – Backend]** Add SC-state controller tests. Add service unit tests for the normalization and validation helpers. Add payload invariant tests for ensemble splits, box-whisker, and histogram.

10. **[Tests – Frontend]** Add component tests for the chart components (EiSupportChart, BoxWhiskerChart, GinglesScatterChart) with realistic payloads. Add loading/error state tests for Simulation.jsx.

11. **[Code Quality]** Extract `toStateCode()` into `src/utils/stateCode.js` and import it across all components.

12. **[Code Quality]** Remove or re-enable the dead routes in `App.jsx` (Minority Analysis, Custom State Analysis, Simulation Minority Data, Voting Rights Analysis old route).
