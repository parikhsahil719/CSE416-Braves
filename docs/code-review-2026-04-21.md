# Code Review Report

**Date:** 2026-04-21
**Branch:** sahil
**Reviewer:** Claude (automated via /code-review skill)
**Scope:** Full codebase — all 19 implemented GUI use cases, backend + frontend end-to-end

---

## Executive Summary

- **12 required GUI use cases:** 9 PASS, 3 PARTIAL
- **7 preferred GUI use cases:** 5 PASS, 2 PARTIAL
- **3 required use cases are PARTIAL → treated as BLOCKERS**

**Top 3 most urgent issues:**

1. **GUI-8 / GUI-19 — Compare.jsx fetches enacted topology for both sides** (`src/components/Compare.jsx:69-103`): the "Interesting Plan" right pane shows the enacted map, not an interesting plan. The `/api/states/{stateId}/districts/interesting` endpoint is never called from this component.
2. **GUI-9 — Gingles group selector is broken** (`src/components/Gingles.jsx:11`): `options` is computed as a single-element array containing only the currently-loaded `payload.selectedGroup`. The `<select>` always has one option; the user cannot switch groups.
3. **GUI-3 — Missing feasible minority populations on State summary panel** (`src/components/StatePage.jsx:103-106`): for both OR and SC, the State tab renders only one minority population row (Asian for OR, Black for SC). Latino population is never shown in either state, and the display is not driven by the `feasibleGroups` list from the API.

---

## GUI Use Case Coverage Matrix

| ID | Name | Priority | Status | Notes |
|----|------|----------|--------|-------|
| GUI-1 | Select state | Required | **PASS** | `GET /api/states` + SplashPage US map click. Both OR + SC seeded. |
| GUI-2 | Display enacted district plan | Required | **PASS** | `GET /api/states/{stateId}/districts/enacted/topology` + DistrictMap + Leaflet. ETag + Cache-Control correct. |
| GUI-3 | State data summary | Required | **PARTIAL** | Population, voter dist., party control, reps all shown. Missing: Latino population not rendered in either state; display is hardcoded to Asian (OR) / Black (SC) rather than driven by `feasibleGroups`. API URL in docs says `/summary` but backend exposes `/state-summary`. |
| GUI-4 | Demographic heat map by precinct | Required | **PASS** | Precinct topology + heatmap bins served. MinorityHeatMap renders with legend. Feasible groups selectable for OR and SC. |
| GUI-6 | Congressional representation table | Required | **PASS** | All 5 required fields (districtNumber, representative, party, racialEthnicGroup, voteMargin2024) present. Loading + error states exist. |
| GUI-7 | Highlight district | Preferred | **PASS** | Click on table row or map district syncs `selectedDistrict` state, applies highlight style. Client-only, correct. |
| GUI-8 | Compare two district plans | Preferred | **PARTIAL** | Both left and right panes call `GET .../districts/enacted/topology`. The right pane labeled "Interesting Plan" never calls `/api/states/{stateId}/districts/interesting`. Both maps show enacted data. |
| GUI-9 | Gingles scatter plot | Required | **PARTIAL** | Scatter chart renders correctly for both states. Group selector `<select>` is broken: `options` array is always length-1 (see Gingles.jsx:11), preventing group switching. |
| GUI-10 | Gingles precinct table | Preferred | **PASS** | Tabulated rows from `/analysis/gingles/table`, paginated by height. All required fields present. |
| GUI-12 | EI support distribution | Required | **PARTIAL** | EI density curves render. Group selector works. Party is hardcoded to `"DEM"` (EI.jsx:243) — no UI control to view Republican candidate results. Requirement says "for each candidate" with user-selectable display. |
| GUI-13 | EI precinct bar + CI | Preferred | **PASS** | BarChart with ErrorBar CI whiskers. Loading + error states present. |
| GUI-15 | EI KDE comparison | Preferred | **PASS** | Density curve with threshold ReferenceLine. Single series support-gap KDE correct per spec. |
| GUI-16 | Ensemble splits bar charts | Required | **PASS** | Two Recharts BarCharts on shared y-axis domain for race-blind vs VRA-constrained. Both OR and SC. |
| GUI-17 | Box & whisker ensemble summary | Required | **PASS** | Both ensemble types fetched in parallel for selected group. Renders via BoxWhiskerChart. Group selector works. |
| GUI-19 | Interesting district plan | Preferred | **PARTIAL** | Backend endpoint exists and is seeded. InterestingMap component exists and renders. But Compare.jsx passes enacted topology to the right pane — the interesting plan endpoint is never called. |
| GUI-20 | VRA impact threshold table | Required | **PASS** | 3-row table with race-blind vs VRA-constrained shares. Renders in Simulation.jsx. Fallback to 3 placeholder labels when loading or failed. |
| GUI-21 | Minority effectiveness box & whisker | Required | **PASS** | Custom SVG rendering of paired boxes per feasible group. Both OR and SC. Legend present. |
| GUI-22 | Minority effectiveness histogram | Required | **PASS** | Grouped BarChart for raceBlind vs vraConstrained. Both OR and SC, group selector works. |
| GUI-24 | Reset page | Preferred | **PASS** | Clicking the site name in CountryHeaderBar navigates to `/` and resets to splash. Acceptable for preferred use case. |

---

## Blockers (Required use cases not fully implemented)

### BLOCKER — GUI-3: Missing feasible minority populations in State summary

**Requirement (from use-case-requirements.md):** "Population of each significant racial/ethnic group in the state."

**What the code does** (`src/components/StatePage.jsx:98-106`):
```jsx
<p className="statePageDataBubbleLabel">White Population:</p>
<p className="statePageData statePageDataNum">{stateData.WhitePopulation}</p>
...
<p className="statePageDataBubbleLabel">{stateName === "Oregon" ? "Asian" : "Black"} Population:</p>
<p className="statePageData statePageDataNum">{stateName === "Oregon" ? stateData.AsianPopulation : stateData.BlackPopulation}</p>
```

This hardcodes exactly two populations per state. For Oregon (feasible groups: Latino, Asian, White) Latino population is never displayed. For South Carolina (feasible groups: Black, Latino, White) Latino population is never displayed.

**Fix:** Drive the population bubbles from `summaryData.feasibleGroups` returned by the API, read per-group population from the local data file, and render one bubble per group.

---

### BLOCKER — GUI-9: Gingles group selector is non-functional

**Requirement:** "Any of the feasible racial/ethnic groups in the state should be selectable for display."

**What the code does** (`src/components/Gingles.jsx:11`):
```js
const options = useMemo(
  () => [payload?.selectedGroup ?? currentGroup].filter(Boolean),
  [currentGroup, payload?.selectedGroup]
);
```

`options` is always an array of exactly one string. The `<select>` always renders a single `<option>`. The user cannot switch to a different group.

**Fix:** Replace `options` with the full feasible group list for the state (analogous to how `EI.jsx` and `Simulation.jsx` use `OregonGroups`/`SCGroups` arrays) and initialize `currentGroup` to the default group for the state.

---

### BLOCKER — GUI-12: No party/candidate selector in EI Analysis

**Requirement:** "The user shall have the ability to select the racial/language groups to compare. The results will be shown in a display for each candidate."

**What the code does** (`src/components/EI.jsx:243`):
```js
params: { groups: groupKey, election: "2024_pres", party: "DEM" },
```

The `party` parameter is hardcoded to `"DEM"` in all three EI requests (lines 243, 264, 288). There is no party/candidate selector in the UI. Only the Democratic candidate's distribution is ever shown.

**Fix:** Add a party selector (DEM / REP) to the EI panel header. Wire it to re-fetch all three EI endpoints when changed.

---

## Performance Findings

| Severity | Location | Issue | Suggested Fix |
|----------|----------|-------|---------------|
| INFO | `server/.../service/GeometryAssetService.java:37-66` | Geometry files cached in memory via `@Cacheable` after first load. | Already correct — no issue. |
| INFO | `server/.../service/BackendDataService.java:77-255` | All service methods annotated `@Cacheable`. | Already correct — no issue. |
| INFO | `server/.../config/MongoIndexConfig.java` | Compound indexes created for all query patterns on startup via `@PostConstruct`. | Already correct — no issue. |
| WARNING | `src/components/Simulation.jsx:364-485` | All 6 data requests fire on component mount regardless of which `currSimData` panel is active. Splits, box-whisker (×2), VRA impact, effectiveness box-whisker, and effectiveness histogram all load simultaneously even if the user is only viewing one panel. | Gate each `useEffect` on `currSimData` matching its panel, or lazy-load on first panel activation. |
| WARNING | `src/components/EI.jsx:234-298` | All 4 requests (topology + 3 EI endpoints) fire on mount regardless of `currEI` panel. | Same pattern — gate EI-specific requests on `currEI` selection, or lazy-load. |
| INFO | `server/.../service/SeedDataLoader.java:109-125` | Individual `save()` calls per document, not batch inserts. Acceptable for startup seed volume (< 30 documents). | No change needed; this only runs once. |

---

## Error Handling Findings

| Severity | Location | Issue | Suggested Fix |
|----------|----------|-------|---------------|
| INFO | `server/.../config/ApiExceptionHandler.java` | Global `@RestControllerAdvice` handles `IllegalArgumentException` (422), `NoSuchElementException` (404), `MissingServletRequestParameterException` (400), and generic `Exception` (500). Stack traces are never exposed. | Correct — no issue. |
| INFO | `src/components/StatePage.jsx:87-127` | State tab shows loading state, falls back to local data on backend failure with a visible notice. | Correct — no issue. |
| INFO | `src/components/StatePage.jsx:135-207` | District tab shows loading + error states. | Correct — no issue. |
| WARNING | `src/components/MinorityHeatMap.jsx:202-211` | If geometry load fails early (before topology has been tried), component renders "Unable to load precinct topology" before the topology request even completes. The `geometryLoadFailed` is set to `true` in the guard clause at line 162 when `!stateCode || !group`, even on valid initial render if `currMinority` is empty. The user may see a brief error flash. | Guard the error state with a "has attempted at least one fetch" flag. |
| WARNING | `src/components/EI.jsx:305-307` | Cleanup `useEffect` at line 305 has `switchEI` as a side-effect but `[]` as the deps array. This is incorrect — `switchEI` identity could change across renders (though in practice it doesn't because it's a `useState` setter). | Add `switchEI` to deps, or confirm by React lint. |
| INFO | `src/components/Simulation.jsx` | All data-fetching useEffects have `isActive` guards preventing setState after unmount. | Correct — no issue. |
| BUG | `server/.../service/SeedDataLoader.java:377-384` | `seedEiPrecinctBarCi` saves REP data by reading from the same DEM JSON file for every state/group combo. E.g., `OR/latino/REP` and `OR/latino/DEM` both read `OR_demo.json`. Republican EI bar chart data will be identical to Democratic data. | Provide separate `*_rep.json` files, or at minimum document that REP data is a stub placeholder. |

---

## Test Coverage Findings

### Backend Tests

| Area | Status | Notes |
|------|--------|-------|
| `StateController` happy-path coverage | PARTIAL | `implementedEndpointsReturnHealthyPayloads...` test hits every endpoint — but only with OR. No test for any SC endpoint. |
| `StateController` error cases | PARTIAL | `getEnsembleSummaryRejectsUnsupportedStateIds` covers invalid stateId. Missing: blank `group`, invalid `party`, blank `planId`, missing required params for every other endpoint. |
| `GeometryAssetService` | COVERED | `GeometryAssetServiceTest.java` exists (not read in detail but present). |
| `BackendDataService` | UNTESTED | No unit tests for service-layer normalization, `requireFeasibleGroup`, `withStoredMetadata`, or caching behavior. |
| Payload invariant tests | UNTESTED | No tests enforcing: box-whisker ordering (`min ≤ q1 ≤ median ≤ q3 ≤ max`), ensemble splits summing to `ensembleSize`, histogram frequencies summing to `ensembleSize`, VRA table exactly 3 rows. |
| Integration tests (real MongoDB) | UNTESTED | All tests use mocked `BackendDataService`. No test hits MongoDB directly to validate seed data integrity end-to-end. |

**Priority additions:**
1. SC-equivalent assertions inside `implementedEndpointsReturnHealthyPayloads...`
2. `BackendDataServiceTest` covering: `normalizeState` rejects unknown codes, `requireFeasibleGroup` rejects non-feasible groups, `normalizeParty` rejects bad values.
3. Payload invariant tests reading the actual mock-data JSON files and asserting the structural contracts.

### Frontend Tests

| Area | Status | Notes |
|------|--------|-------|
| Component tests | UNTESTED | `src/test/` contains only `setupTests.js` — no test files. Not a single React component is tested. |
| Chart rendering | UNTESTED | No tests for `BoxWhiskerChart`, `GinglesScatterChart`, `EiSupportChart`, `SingleEnsembleSplitsChart` with mock payloads. |
| Loading / error / empty states | UNTESTED | None of the empty-data or error-state branches in `Simulation.jsx`, `EI.jsx`, etc. are covered. |

**Priority additions:**
1. Smoke test for `DistrictMap` — renders placeholder when `data=null`, renders map container when data present.
2. Smoke test for `Simulation` — each `currSimData` renders the correct sub-component.
3. `GinglesScatterChart` renders expected number of dots from fixture data.

---

## Code Quality Findings

| Severity | Location | Issue |
|----------|----------|-------|
| BUG | `src/components/SideBar.jsx:29` | `navigate('/state/${stateName}/Gingles ')` — trailing space in the path string. The registered route in `App.jsx:54` is `/state/:stateName/Gingles` (no space). This navigate call will produce a URL that doesn't match any route, likely rendering a blank page. Remove the trailing space. |
| BUG | `src/components/Compare.jsx:69-103` | Second `useEffect` fetches `/api/states/${stateCode}/districts/enacted/topology` and assigns to `rightMapData`. This is identical to the first useEffect that populates `leftMapData`. The right pane should fetch `/api/states/${stateCode}/districts/interesting?planId=plan-42` and pass the `topology` field to `InterestingMap`. |
| SMELL | `src/components/MinorityHeatMap.jsx:158` | `console.log(currMinority)` — debug log left in production code. Remove. |
| SMELL | `src/components/StatePage.jsx:161-163` | `useEffect` inside `DistrictData` calls `onSelectDistrict(0)` on `currMap` changes but `onSelectDistrict` is not in the dependency array. React will warn (or in Strict Mode, behave unexpectedly). Add `onSelectDistrict` to the deps array. |
| SMELL | `src/components/InterestingMap.jsx:80` | Uses `L.control(...)` via the implicit Leaflet global without importing `L`. Works today because `leaflet/dist/leaflet.css` import loads Leaflet as a side effect, but is fragile compared to how `SplashPage.jsx` explicitly imports `L from "leaflet"`. Add the import. |
| MINOR | `docs/seawulf-prepro-payload-schemas.md` | Primary endpoint contract doc — replaces the deleted `client-server-interface.md`. GUI-3 URL is correctly listed as `/api/states/{stateId}/state-summary` in this doc. |
| MINOR | `src/components/App.jsx:33-40` | `minorityData` hardcodes `'Black'` in Oregon's list (`minorityList: ['Latino', 'Asian', 'Black']`). Black is not a feasible group for Oregon (threshold < 200,000). This is passed only to `CrossStateAnalysis` / `StateMinorityAnalysis` which are legacy routes, so it's not a live bug, but it's misleading. |
| MINOR | `server/.../service/SeedDataLoader.java:293-299` | `seedHeatmapBins` calls `heatmapBinRepository.deleteAll()` before re-inserting on every startup, unlike all other seed methods which check `count() == 0` first. This causes an unnecessary delete+insert cycle on every server restart. Apply the same guard pattern used for other collections. |

---

## Recommended Action Items

Ordered by urgency (blockers first, then by tier):

1. **(BLOCKER — GUI-9)** Fix Gingles group selector: replace single-element `options` array with the full feasible group list per state. `src/components/Gingles.jsx:11`.
2. **(BLOCKER — GUI-3)** Render all feasible minority populations on State tab. Drive from `summaryData.feasibleGroups` returned by the API rather than hardcoded per-state keys. `src/components/StatePage.jsx:98-106`.
3. **(BLOCKER — GUI-12)** Add party/candidate selector to EI page. Wire it to re-fetch EI endpoints with `party: "DEM"` or `party: "REP"`. `src/components/EI.jsx:243, 264, 288`.
4. **(BUG — GUI-8/GUI-19)** Fix Compare.jsx to fetch the interesting plan for the right pane: call `/api/states/${stateCode}/districts/interesting?planId=plan-42`, extract `response.data.topology`, convert with `topologyToFeatureCollection`, and pass to `InterestingMap`. `src/components/Compare.jsx:69-103`.
5. **(BUG — Routing)** Remove trailing space from `navigate('/state/${stateName}/Gingles ')` in `src/components/SideBar.jsx:29`.
6. **(BUG — Seed data)** Fix `seedEiPrecinctBarCi` so REP party uses different JSON source files (or create stub REP files) rather than reading the DEM file for both parties. `server/.../service/SeedDataLoader.java:377-384`.
7. **(Performance — Simulation)** Lazy-load Simulation panel data: only fire each `useEffect` when the matching `currSimData` has been activated. `src/components/Simulation.jsx:364-485`.
8. **(Performance — EI)** Same pattern for EI: gate EI-specific requests on `currEI` selection. `src/components/EI.jsx:234-298`.
9. **(Smell)** Remove `console.log(currMinority)` from MinorityHeatMap. `src/components/MinorityHeatMap.jsx:158`.
10. **(Tests — Backend)** Add SC-state assertions to `StateControllerTest`. Add `BackendDataService` unit tests for input normalization and `requireFeasibleGroup` guard.
11. **(Tests — Backend)** Add payload invariant tests: read mock-data JSON files and assert `min ≤ q1 ≤ median ≤ q3 ≤ max`, histogram sums, VRA table 3-row rule.
12. **(Tests — Frontend)** Add at least 3 React component smoke tests: `DistrictMap` null-data placeholder, `Simulation` panel routing, `GinglesScatterChart` dot count from fixture.
13. **(Minor)** Fix `useEffect` deps array in `DistrictData` component to include `onSelectDistrict`. `src/components/StatePage.jsx:161-163`.
14. **(Minor)** Fix `SeedDataLoader.seedHeatmapBins` to use the same `count() == 0` guard as every other seed method to avoid redundant delete+insert on startup. `server/.../service/SeedDataLoader.java:293`.
