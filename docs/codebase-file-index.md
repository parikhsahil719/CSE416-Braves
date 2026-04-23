# Codebase File Index

> Reference for Claude Code sessions. Contains one-line descriptions of every source file. Read this file when you need to find the right file to edit, understand project structure, or trace a use case end-to-end.

---

## Project Root

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Claude Code guidance: architecture, build commands, use case scope, domain concepts, payload validation rules |
| `AGENTS.md` | Prescriptive coding rules: security, conventions, never-do list, payload invariants |
| `package.json` | Frontend npm config; defines React 18, Vite, Leaflet, Recharts, React Router, Axios; provides dev/build/test scripts |
| `vite.config.js` | Vite build config; proxies `/api` and `/health` to backend at `localhost:8080`; jsdom test environment |

---

## docs/

| File | Purpose |
|------|---------|
| `use-case-requirements.md` | Full professor requirements for all implemented use cases (19 GUI, 10 Prepro, 12 SeaWulf) with descriptions and scoping notes |
| `seawulf-prepro-payload-schemas.md` | Frontend-first API response contracts, MongoDB collection schemas, and pipeline compute table — primary reference for backend ↔ frontend contracts |
| `schema-field-guide.md` | MongoDB collection and field reference for all 21+ collections |
| `mongo-schema-and-use-case-mapping.md` | Maps MongoDB collections to the GUI use cases they support |
| `topojson-implementation.md` | Architecture rationale for serving geometry as static classpath TopoJSON instead of MongoDB |
| `caching-architecture.md` | Two-tier caching design: TanStack Query (frontend) + Caffeine + HTTP ETag (backend); includes server-restart invalidation flow |
| `chart-specs-required-and-preferred-recharts.md` | Recharts implementation specs for GUI-9, 12, 13, 15, 16, 17, 18 |
| `chart-handoff-contracts.md` | Payload schemas and handoff contracts for integrating chart payloads into the current frontend |
| `api-test-data-catalog.md` | Catalog of test data payloads with semantic descriptions and validation procedures |
| `codebase-file-index.md` | This file — one-line descriptions of every source file for quick navigation |

---

## Backend (`server/`)

### Configuration & Build

| File | Purpose |
|------|---------|
| `pom.xml` | Maven build: Spring Boot 3.3.4, Java 22, MongoDB Spring Data, OpenAPI/Swagger |
| `server/README.md` | Backend setup guide: MongoDB prerequisites, build commands, endpoint verification, troubleshooting |
| `src/main/resources/application.properties` | Server port 8080, MongoDB URI, seed loader settings, JSON serialization, response compression |

### Entry Point

| File | Purpose |
|------|---------|
| `BravesServerApplication.java` | Spring Boot application entry point |
| `ServletInitializer.java` | WAR deployment initializer |

### `api/` — Controllers

| File | Purpose |
|------|---------|
| `HealthController.java` | `/health` and `/health/db` endpoints for service and MongoDB connectivity checks |
| `MetaController.java` | `GET /api/meta` — returns server `bootTime` (ISO-8601) for frontend TanStack Query cache invalidation on restart |
| `StateController.java` | All ~25 REST routes implementing GUI-1 through GUI-24 (state listing, topology, heatmaps, Gingles, EI, ensembles, VRA, minority effectiveness) |

### `config/`

| File | Purpose |
|------|---------|
| `ApiExceptionHandler.java` | Global exception → standardized error response translation |
| `CorsConfig.java` | CORS configuration for frontend origin |
| `MongoIndexConfig.java` | Automatic MongoDB index creation on startup |
| `OpenApiConfig.java` | OpenAPI/Swagger UI configuration |

### `dto/` — Data Transfer Objects

| File | Purpose |
|------|---------|
| `ErrorResponse.java` | Standardized error response wrapper |
| `SkeletonResponse.java` | Generic payload response wrapper |
| `StateOptionResponse.java` | State selector option DTO (name, code, description) |

### `model/` — MongoDB Documents

| File | Purpose |
|------|---------|
| `BasePayloadDocument.java` | Base class with common metadata: `schemaVersion`, `chartType`, `state`, `election`, `units` |
| `BoxWhiskerResultDocument.java` | Box-whisker statistics (min, q1, median, q3, max) for ensemble distributions — GUI-17 |
| `DistrictTableDocument.java` | Congressional representation table data (representative, party, vote margin) — GUI-6 |
| `EiKdeDocument.java` | EI kernel density estimation comparisons across racial groups — GUI-15 |
| `EiPrecinctBarCiDocument.java` | Precinct-level EI bar charts with confidence intervals — GUI-13 |
| `EiSupportResultDocument.java` | EI probability distributions of group voting support — GUI-12 |
| `EnsembleSplitDocument.java` | Ensemble seat split outcomes (R/D wins and frequencies) — GUI-16 |
| `EnsembleSummaryDocument.java` | Summary statistics of ensemble plans |
| `GinglesResultDocument.java` | Gingles precinct scatter (minority share vs. party vote share) — GUI-9 |
| `GinglesTableDocument.java` | Tabular Gingles analysis with precinct voting cohesion — GUI-10 |
| `HeatmapBinDocument.java` | Demographic heatmap bin data (minority % by precinct) — GUI-4 |
| `IngestManifestDocument.java` | Data ingestion metadata and version tracking |
| `InterestingPlanDocument.java` | Alternative/interesting district plan with metadata and topology — GUI-19 |
| `MinorityEffectivenessBoxWhiskerDocument.java` | Box-whisker effectiveness scores across ensembles — GUI-21 |
| `MinorityEffectivenessHistogramDocument.java` | Histogram distribution of minority effectiveness across ensemble plans — GUI-22 |
| `RunManifestDocument.java` | Analytical run metadata and timestamps |
| `StateDocument.java` | State metadata and baseline information — GUI-1 |
| `StateSummaryDocument.java` | State-level summary statistics (population, voting distribution, representative counts) — GUI-3 |
| `VraImpactThresholdTableDocument.java` | VRA impact threshold table showing effectiveness metrics across minority groups — GUI-20 |

### `repository/` — Data Access Layer

Each repository provides Spring Data MongoDB CRUD + custom queries for its document type. One repository per model:

`BoxWhiskerResultRepository`, `DistrictTableRepository`, `EiKdeRepository`, `EiPrecinctBarCiRepository`, `EiSupportResultRepository`, `EnsembleSplitRepository`, `EnsembleSummaryRepository`, `GinglesResultRepository`, `GinglesTableRepository`, `HeatmapBinRepository`, `IngestManifestRepository`, `InterestingPlanRepository`, `MinorityEffectivenessBoxWhiskerRepository`, `MinorityEffectivenessHistogramRepository`, `RunManifestRepository`, `StateRepository`, `StateSummaryRepository`, `VraImpactThresholdTableRepository`

### `service/` — Business Logic Layer

| File | Purpose |
|------|---------|
| `BackendDataService.java` | Core data retrieval + aggregation; orchestrates repository queries into frontend payloads for all GUI use cases |
| `GeometryAssetService.java` | Loads static TopoJSON from classpath resources (districts, precincts, US overview) — see `topojson-implementation.md` |
| `SeedDataLoader.java` | On-startup seeder: loads JSON payloads from resources into MongoDB when `APP_SEED_ENABLED=true` |
| `DatabaseHealthService.java` | Interface defining DB health check contract |
| `MongoDatabaseHealthService.java` | MongoDB implementation of health checking; verifies connectivity, returns collection counts |

### `util/`

| File | Purpose |
|------|---------|
| `GroupThresholds.java` | Population threshold constant (200,000) for feasible demographic groups |
| `PopulationMeasure.java` | Enum: `Total`, `VAP`, `CVAP` |
| `ProjectPathResolver.java` | Resolves absolute file paths within the project for resource loading |
| `StateCodeUtil.java` | State code validation and normalization utilities |

### Geometry Resources (`src/main/resources/geometry/`)

| File | Purpose |
|------|---------|
| `precincts_or.json` | Oregon precinct boundaries with demographic fields for the precinct heatmap |
| `precincts_sc.json` | South Carolina precinct boundaries with demographic fields for the precinct heatmap |
| `us-states.json` | US state boundaries for splash page map |

### Tests

| File | Purpose |
|------|---------|
| `api/StateControllerTest.java` | Integration tests for `StateController` endpoints |
| `service/GeometryAssetServiceTest.java` | Unit tests for geometry asset loading and TopoJSON serialization |

---

## Frontend (`src/`)

### Entry & Routing

| File | Purpose |
|------|---------|
| `main.jsx` | React entry point; mounts root inside `QueryClientProvider` + `BrowserRouter` |
| `App.jsx` | Route definitions + `CacheBuster` component that detects server restarts and clears TanStack Query cache |

### `components/`

| File | Purpose |
|------|---------|
| `SplashPage.jsx` | Landing page with interactive Leaflet US map and state selector — GUI-1 |
| `StatePage.jsx` | Main state view: district map + sidebar navigation wrapper — GUI-2, GUI-3 |
| `StateHeaderBar.jsx` | Per-state navigation tab bar |
| `CountryHeaderBar.jsx` | Global header with site title and top-level navigation |
| `SideBar.jsx` | Analysis category selector; minority group and EI metric controls |
| `DistrictMap.jsx` | Leaflet map rendering enacted district boundaries from TopoJSON — GUI-2 |
| `MinorityHeatMap.jsx` | Leaflet heatmap with bin-based color legend for precinct-level minority % — GUI-4 |
| `InterestingMap.jsx` | Map rendering alternative/interesting district plans — GUI-19 |
| `DistrictTable.jsx` | Congressional representation table by district — GUI-6 |
| `EI.jsx` | Ecological inference container with group/metric selectors — GUI-12, 13, 15 |
| `EiSupportChart.jsx` | Recharts area chart for EI support probability distributions — GUI-12 |
| `GinglesScatterChart.jsx` | Recharts scatter plot: minority % vs. party vote share by precinct — GUI-9 |
| `BoxWhiskerChart.jsx` | Custom SVG box-whisker for ensemble distribution summaries — GUI-17 |
| `SingleEnsembleSplitsChart.jsx` | Bar chart comparing race-blind vs. VRA-constrained ensemble splits — GUI-16 |
| `StateMinorityAnalysis.jsx` | Container for minority effectiveness views — GUI-21, GUI-22 |
| `StateCustomAnalysis.jsx` | Container for custom analysis workflows |
| `StateSimulationMinorityData.jsx` | Simulation and ensemble comparison view container |
| `CrossStateAnalysis.jsx` | Multi-state comparative analysis container |
| `VRAAnalysis.jsx` | VRA impact analysis view container — GUI-20 |
| `Compare.jsx` | Side-by-side district plan comparison — GUI-8 |

### `lib/` & `queries/`

| File | Purpose |
|------|---------|
| `lib/queryClient.js` | TanStack QueryClient with defaults: 5-min staleTime, 30-min gcTime, no window-focus refetch |
| `lib/queryKeys.js` | Centralized query key factory — all `useQuery` calls reference these keys for consistent invalidation |
| `queries/stateQueries.js` | One `useQuery` hook per API endpoint (20 hooks); topology hooks use `staleTime: Infinity` |

### `data/` & `utils/`

| File | Purpose |
|------|---------|
| `data/chartPayloads.js` | Mock/test data payloads for frontend development and testing |
| `data/oregon.js` | Oregon reference data: name, district count, feasible minority groups |
| `data/oregonCongressionalDistricts.js` | Oregon district definitions and metadata |
| `data/sc.js` | South Carolina reference data |
| `data/scCongressionalDistricts.js` | South Carolina district definitions and metadata |
| `data/us-states.json` | US state boundaries TopoJSON (splash page) |
| `data/precincts_or.json` | Oregon precinct TopoJSON source used for backend precinct heatmap geometry |
| `data/precincts_sc.json` | South Carolina precinct TopoJSON source used for backend precinct heatmap geometry |
| `utils/chartFormat.js` | Chart formatting: `pct()` percentage formatter, share-to-percentage conversion, axis label helpers |
| `utils/topology.js` | TopoJSON → GeoJSON FeatureCollection conversion for Leaflet rendering |
| `utils/stateUtils.js` | Shared helpers: `toStateCode`, `toGroupKey`, `defaultGroup`, `groupOptionsForState` — used across all analysis components |

### Tests

| File | Purpose |
|------|---------|
| `src/test/setupTests.js` | Vitest environment setup with testing-library/jsdom |

## Mock Data (`mock-data/v1/`)

JSON payloads organized by chart type and state (OR/SC). Used by `SeedDataLoader` to populate MongoDB on startup.

| Directory | Use Case | Description |
|-----------|----------|-------------|
| `box-whisker/` | GUI-17 | Box-whisker ensemble distribution payloads (race-blind + VRA variants) |
| `ei-kde/` | GUI-15 | EI kernel density estimation comparison payloads |
| `ei-precinct-bar-ci/` | GUI-13 | EI precinct bar with confidence interval payloads |
| `ei-support/` | GUI-12 | EI support probability distribution payloads |
| `ensemble-splits/` | GUI-16 | Ensemble seat split comparison payloads |
| `gingles-scatter/` | GUI-9 | Gingles precinct scatter analysis payloads |
| `gingles-table/` | GUI-10 | Gingles tabular analysis payloads |
| `minority-effectiveness-box-whisker/` | GUI-21 | Minority effectiveness box-whisker payloads |
| `minority-effectiveness-histogram/` | GUI-22 | Minority effectiveness histogram payloads |
| `vote-share-seat-share/` | GUI-18 | Vote share vs. seat share curve payloads (not implemented) |
| `vra-impact-thresholds/` | GUI-20 | VRA impact threshold table payloads |

---

## JSON Schemas (`schemas/v1/`)

JSON Schema definitions for payload validation (one per chart type):

`box-whisker.schema.json`, `ei-kde.schema.json`, `ei-precinct-bar-ci.schema.json`, `ei-support.schema.json`, `ensemble-splits.schema.json`, `gingles-scatter.schema.json`, `vote-share-seat-share.schema.json`

---

## Quick Use Case → File Lookup

| Use Case | Backend Endpoint | Backend Service | Frontend Component |
|----------|-----------------|-----------------|-------------------|
| GUI-1 State list | `StateController` → `GET /api/states` | `BackendDataService` | `SplashPage.jsx` |
| GUI-2 District topology | `StateController` → `GET .../districts/enacted/topology` | `GeometryAssetService` | `DistrictMap.jsx` |
| GUI-3 State summary | `StateController` → `GET .../summary` | `BackendDataService` | `StatePage.jsx` |
| GUI-4 Heatmap | `StateController` → `GET .../precincts/topology` + `/heatmap/precincts` | `GeometryAssetService` + `BackendDataService` | `MinorityHeatMap.jsx` |
| GUI-6 District table | `StateController` → `GET .../districts/enacted/table` | `BackendDataService` | `DistrictTable.jsx` |
| GUI-9 Gingles scatter | `StateController` → `GET .../analysis/gingles` | `BackendDataService` | `GinglesScatterChart.jsx` |
| GUI-10 Gingles table | `StateController` → `GET .../analysis/gingles/table` | `BackendDataService` | *(table component)* |
| GUI-12 EI support | `StateController` → `GET .../analysis/ei-support` | `BackendDataService` | `EiSupportChart.jsx` |
| GUI-13 EI bar+CI | `StateController` → `GET .../analysis/ei-precinct-bar-ci` | `BackendDataService` | `EiPrecinctBarCIChart.jsx` |
| GUI-15 EI KDE | `StateController` → `GET .../analysis/ei-kde` | `BackendDataService` | `EiKdeChart.jsx` |
| GUI-16 Ensemble splits | `StateController` → `GET .../ensembles/splits` | `BackendDataService` | `SingleEnsembleSplitsChart.jsx` |
| GUI-17 Box & whisker | `StateController` → `GET .../ensembles/box-whisker` | `BackendDataService` | `BoxWhiskerChart.jsx` |
| GUI-19 Interesting plan | `StateController` → `GET .../districts/interesting` | `BackendDataService` | `InterestingMap.jsx` |
| GUI-20 VRA thresholds | `StateController` → `GET .../analysis/vra-impact-thresholds` | `BackendDataService` | `VRAAnalysis.jsx` |
| GUI-21 Effectiveness B&W | `StateController` → `GET .../analysis/minority-effectiveness/box-whisker` | `BackendDataService` | `StateMinorityAnalysis.jsx` |
| GUI-22 Effectiveness hist. | `StateController` → `GET .../analysis/minority-effectiveness/histogram` | `BackendDataService` | `StateMinorityAnalysis.jsx` |
