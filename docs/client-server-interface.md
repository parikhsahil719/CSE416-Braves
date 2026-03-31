# Client/Server Interface Packet

## Purpose

This document is the professor-facing reference for the Braves project client/server interface. It shows:

- the use case number tied to each endpoint
- the exact URL pattern requested by the client
- the parameters passed to the server
- the JSON or GeoJSON form returned by the backend
- the MongoDB collection that stores the returned payload
- whether the route is `Live` or a `Seeded contract`

Status labels used throughout this packet:

- `Live`: implemented and returned by the running backend now
- `Seeded contract`: route exists and the backend has seeded Mongo payloads or mock JSON for it, but service logic is still marked planned
- `Planned`: use case exists in UI/docs but does not yet have a server-backed contract worth presenting as an active interface

## Project Context

- Client: React frontend served by Vite
- Server: Spring Boot backend mounted under `/api`
- Database: MongoDB storing precomputed payload documents
- Supporting live API reference:
  - Swagger UI: `http://localhost:8080/swagger-ui.html`
  - OpenAPI JSON: `http://localhost:8080/api-docs`

## Base Request Model

- In local frontend development, the browser calls `/api/...` through the Vite proxy configured in `vite.config.js`.
- The backend server runs locally at `http://localhost:8080`.
- The frontend currently mixes live backend requests and local mock payload imports:
  - live backend request now: `GUI-2`
  - local mock payloads currently back several chart and summary screens while the seeded contracts are being formalized
- The server returns:
  - JSON for summary and analytical payloads
  - GeoJSON for enacted district maps

## Interface Summary

| Use Case | Purpose | Method | URL | Parameters | Response JSON | Status | Mongo collection |
| --- | --- | --- | --- | --- | --- | --- | --- |
| OPS-1 | Service health | `GET` | `/health` | None | `{ status, service }` | `Live` | N/A |
| OPS-2 | Database health | `GET` | `/health/db` | None | `{ status, service, database, mongoStatus, collections, availableCollections }` | `Live` | Mongo metadata |
| GUI-1 | List supported states | `GET` | `/api/states` | None | `StateOptionResponse[]` | `Live` | `states` |
| GUI-2 | Enacted district map | `GET` | `/api/states/{stateId}/districts/enacted/geojson` | `stateId` | GeoJSON `FeatureCollection` | `Live` | `district_maps` |
| GUI-3 | State summary | `GET` | `/api/states/{stateId}/summary` | `stateId` | state summary object | `Seeded contract` | `state_summaries` |
| GUI-4 | Precinct heatmap bins | `GET` | `/api/states/{stateId}/heatmap/precincts?group=...` | `stateId`, `group` | heatmap config object | `Seeded contract` | `heatmap_bins` |
| GUI-6 | Congressional representation table | `GET` | `/api/states/{stateId}/districts/enacted/table?election=2024_pres` | `stateId`, `election` | district table object | `Seeded contract` | `district_tables` |
| GUI-9 | Gingles analysis | `GET` | `/api/states/{stateId}/analysis/gingles?group=...&election=2024_pres` | `stateId`, `group`, `election` | Gingles scatter payload | `Seeded contract` | `gingles_results` |
| GUI-12 | EI support distribution | `GET` | `/api/states/{stateId}/analysis/ei-support?groups=...&election=2024_pres&party=DEM|REP` | `stateId`, `groups`, `election`, `party` | EI support payload | `Seeded contract` | `ei_support_results` |
| GUI-16 | Ensemble splits | `GET` | `/api/states/{stateId}/ensembles/splits?ensembleSize=final&election=2024_pres` | `stateId`, `ensembleSize`, `election` | ensemble split payload | `Seeded contract` | `ensemble_splits` |
| GUI-17 | Box-and-whisker ensemble summary | `GET` | `/api/states/{stateId}/ensembles/box-whisker?group=...&ensembleType=...&metric=...` | `stateId`, `group`, `ensembleType`, `metric` | box-and-whisker payload | `Seeded contract` | `box_whisker_results` |

## Operational Endpoints

### OPS-1 Service Health

- Purpose: confirm the Spring Boot service is up
- URL pattern: `GET /health`
- Example request URL: `http://localhost:8080/health`
- Parameters: none
- Response form:

```json
{
  "status": "ok",
  "service": "braves-server"
}
```

- Mongo collection: none
- Frontend usage today: operational only
- Status: `Live`

### OPS-2 Database Health

- Purpose: confirm MongoDB is reachable and report available collections
- URL pattern: `GET /health/db`
- Example request URL: `http://localhost:8080/health/db`
- Parameters: none
- Response form:

```json
{
  "status": "ok",
  "service": "braves-server",
  "database": "cse416_braves",
  "mongoStatus": "ok",
  "collections": {
    "district_maps": 2
  },
  "availableCollections": [
    "box_whisker_results",
    "district_maps",
    "district_tables",
    "ei_support_results",
    "ensemble_splits",
    "gingles_results",
    "heatmap_bins",
    "ingest_manifests",
    "run_manifests",
    "state_summaries",
    "states"
  ]
}
```

- Mongo collection: metadata query against the active database
- Frontend usage today: operational only
- Status: `Live`

## Use Case Detail

### GUI-1 List Supported States

- URL pattern: `GET /api/states`
- Example request URL: `http://localhost:8080/api/states`
- Parameters: none
- Response JSON summary:
  - array of objects with `stateId`, `stateName`, and `totalDistricts`
- Example JSON:

```json
[
  {
    "stateId": "OR",
    "stateName": "Oregon",
    "totalDistricts": 6
  },
  {
    "stateId": "SC",
    "stateName": "South Carolina",
    "totalDistricts": 7
  }
]
```

- Mongo collection: `states`
- Frontend usage today: defines the list of supported states exposed by the backend
- Status: `Live`

### GUI-2 Enacted District Map for a State

- URL pattern: `GET /api/states/{stateId}/districts/enacted/geojson`
- Example request URLs:
  - `http://localhost:8080/api/states/OR/districts/enacted/geojson`
  - `http://localhost:8080/api/states/SC/districts/enacted/geojson`
- Parameters:
  - path `stateId`: normalized state code, currently `OR` or `SC`
- Response JSON summary:
  - GeoJSON `FeatureCollection`
  - top-level fields include `type`, `features`, and district geometry/properties entries
- Example JSON snippet:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "district_number": 1
      },
      "geometry": {
        "type": "MultiPolygon"
      }
    }
  ]
}
```

- Full sample files:
  - `src/data/oregon_congressional_districts.geojson`
  - `src/data/south_carolina_congressional_districts.geojson`
- Mongo collection: `district_maps`
- Frontend usage today:
  - actively fetched by `StatePage.jsx`
  - current fetch call: `fetch(/api/states/${stateCode}/districts/enacted/geojson)`
- Status: `Live`

### GUI-3 State Summary

- URL pattern: `GET /api/states/{stateId}/summary`
- Example request URLs:
  - `http://localhost:8080/api/states/OR/summary`
  - `http://localhost:8080/api/states/SC/summary`
- Parameters:
  - path `stateId`: `OR` or `SC`
- Response JSON summary:
  - `schemaVersion`
  - `state`
  - `totalDistricts`
  - statewide population and vote-share summary
  - current party control and list of representatives
  - `feasibleGroups`
  - `ensembleSummary`
- Example JSON snippet:

```json
{
  "schemaVersion": "v1",
  "state": "OR",
  "totalDistricts": 6,
  "population": "4,272,371",
  "voterDistributionDem": "1,228,410 (55.6%)",
  "voterDistributionRep": "910,702 (41.3%)",
  "partyControl": "Democrat",
  "feasibleGroups": ["Latino", "Asian", "White"],
  "ensembleSummary": {
    "available": true,
    "sizes": ["test", "final"],
    "finalPlanCount": 5000
  }
}
```

- Mongo collection: `state_summaries`
- Frontend usage today:
  - the custom-analysis summary card still uses local static state data, not the backend route yet
- Status: `Seeded contract`

### GUI-4 Precomputed Precinct Heatmap Bins

- URL pattern: `GET /api/states/{stateId}/heatmap/precincts?group=...`
- Example request URLs:
  - `http://localhost:8080/api/states/OR/heatmap/precincts?group=latino`
  - `http://localhost:8080/api/states/SC/heatmap/precincts?group=black`
- Parameters:
  - path `stateId`: `OR` or `SC`
  - query `group`: normalized minority group key such as `latino`, `asian`, or `black`
- Response JSON summary:
  - `schemaVersion`
  - `state`
  - `group`
  - `binUnit`
  - `bins[]` with `min`, `max`, and `color`
  - `precomputed`
- Example JSON snippet:

```json
{
  "schemaVersion": "v1",
  "state": "SC",
  "group": "Black",
  "binUnit": "percent",
  "bins": [
    { "min": 0, "max": 10, "color": "#f7fbff" },
    { "min": 10, "max": 20, "color": "#deebf7" },
    { "min": 20, "max": 30, "color": "#c6dbef" }
  ],
  "precomputed": true
}
```

- Mongo collection: `heatmap_bins`
- Frontend usage today:
  - `MinorityHeatMap` renders the current view from local project data rather than this route
  - custom analysis marks the map integration as not yet connected
- Status: `Seeded contract`

### GUI-6 Congressional Representation Table

- URL pattern: `GET /api/states/{stateId}/districts/enacted/table?election=2024_pres`
- Example request URLs:
  - `http://localhost:8080/api/states/OR/districts/enacted/table?election=2024_pres`
  - `http://localhost:8080/api/states/SC/districts/enacted/table?election=2024_pres`
- Parameters:
  - path `stateId`: `OR` or `SC`
  - query `election`: election identifier, currently seeded as `2024_pres`
- Response JSON summary:
  - `schemaVersion`
  - `state`
  - `election`
  - `districts[]` with `districtNumber`, `representative`, `party`, `racialEthnicGroup`, `voteMargin2024`
- Example JSON snippet:

```json
{
  "schemaVersion": "v1",
  "state": "OR",
  "election": "2024_pres",
  "districts": [
    {
      "districtNumber": 1,
      "representative": "Suzanne Bonamici",
      "party": "Democrat",
      "racialEthnicGroup": "White",
      "voteMargin2024": 24.1
    }
  ]
}
```

- Mongo collection: `district_tables`
- Frontend usage today:
  - the custom-analysis table still renders local `CONGRESSIONAL_DATA`
- Status: `Seeded contract`

### GUI-9 Gingles Analysis

- URL pattern: `GET /api/states/{stateId}/analysis/gingles?group=...&election=2024_pres`
- Example request URLs:
  - `http://localhost:8080/api/states/OR/analysis/gingles?group=latino&election=2024_pres`
  - `http://localhost:8080/api/states/SC/analysis/gingles?group=black&election=2024_pres`
- Parameters:
  - path `stateId`: `OR` or `SC`
  - query `group`: seeded as `latino` for Oregon and `black` for South Carolina
  - query `election`: seeded as `2024_pres`
- Response JSON summary:
  - `chartType: "gingles-scatter"`
  - precinct-level points with minority share and party vote share
  - optional regression curve definitions for chart rendering
- Example JSON snippet:

```json
{
  "schemaVersion": "v1",
  "chartType": "gingles-scatter",
  "state": "OR",
  "selectedGroup": "Latino",
  "points": [
    {
      "precinctId": "OR-P001",
      "minorityShare": 0.12,
      "demVoteShare": 0.46,
      "repVoteShare": 0.5
    }
  ]
}
```

- Full sample files:
  - `mock-data/v1/gingles-scatter/OR_2024_latino.json`
  - `mock-data/v1/gingles-scatter/SC_2024_black.json`
- Mongo collection: `gingles_results`
- Frontend usage today:
  - `CrossStateAnalysis.jsx` currently imports local mock payloads from `src/data/chartPayloads.js`
- Status: `Seeded contract`

### GUI-12 Ecological Inference Support Distribution

- URL pattern: `GET /api/states/{stateId}/analysis/ei-support?groups=...&election=2024_pres&party=DEM|REP`
- Example request URLs:
  - `http://localhost:8080/api/states/OR/analysis/ei-support?groups=latino&election=2024_pres&party=DEM`
  - `http://localhost:8080/api/states/SC/analysis/ei-support?groups=black&election=2024_pres&party=DEM`
- Parameters:
  - path `stateId`: `OR` or `SC`
  - query `groups`: comma-separated group list; the current seeded examples use a single group per state
  - query `election`: seeded as `2024_pres`
  - query `party`: documented by the controller as `DEM` or `REP`
- Response JSON summary:
  - `chartType: "ei-support"`
  - selected candidate / party of choice context
  - `series[]` entries with density curve points
  - optional `confidenceScore` per group
- Example JSON snippet:

```json
{
  "schemaVersion": "v1",
  "chartType": "ei-support",
  "state": "OR",
  "selectedCandidate": "Hardy",
  "series": [
    {
      "key": "latino",
      "confidenceScore": 0.82,
      "points": [
        { "xSupportShare": 0.2, "density": 0.1 }
      ]
    }
  ],
  "selectedGroup": "Latino"
}
```

- Full sample files:
  - `mock-data/v1/ei-support/OR_2024_president.json`
  - `mock-data/v1/ei-support/SC_2024_president.json`
- Mongo collection: `ei_support_results`
- Frontend usage today:
  - `StateMinorityAnalysis.jsx` and `StateCustomAnalysis.jsx` currently render local mock payloads
- Status: `Seeded contract`

### GUI-16 Ensemble Splits

- URL pattern: `GET /api/states/{stateId}/ensembles/splits?ensembleSize=final&election=2024_pres`
- Example request URLs:
  - `http://localhost:8080/api/states/OR/ensembles/splits?ensembleSize=final&election=2024_pres`
  - `http://localhost:8080/api/states/SC/ensembles/splits?ensembleSize=final&election=2024_pres`
- Parameters:
  - path `stateId`: `OR` or `SC`
  - query `ensembleSize`: controller default is `final`
  - query `election`: seeded as `2024_pres`
- Response JSON summary:
  - `chartType: "ensemble-splits"`
  - `series.raceBlind[]`
  - `series.vraConstrained[]`
  - each bucket contains `splitLabel`, `repWins`, `demWins`, `frequency`, `shareOfEnsemble`
- Example JSON snippet:

```json
{
  "schemaVersion": "v1",
  "chartType": "ensemble-splits",
  "state": "OR",
  "ensembleSize": 250,
  "series": {
    "raceBlind": [
      { "splitLabel": "1R/5D", "repWins": 1, "demWins": 5, "frequency": 28, "shareOfEnsemble": 0.112 }
    ],
    "vraConstrained": [
      { "splitLabel": "1R/5D", "repWins": 1, "demWins": 5, "frequency": 20, "shareOfEnsemble": 0.08 }
    ]
  }
}
```

- Full sample files:
  - `mock-data/v1/ensemble-splits/OR_compare.json`
  - `mock-data/v1/ensemble-splits/SC_compare.json`
- Mongo collection: `ensemble_splits`
- Frontend usage today:
  - `VRAAnalysis.jsx` and `StateCustomAnalysis.jsx` currently render local mock payloads
- Status: `Seeded contract`
- Current implementation note:
  - the route selector uses `ensembleSize=final`, while the current seeded sample payload still carries demo field value `ensembleSize: 250`

### GUI-17 Box-and-Whisker Ensemble Summary

- URL pattern: `GET /api/states/{stateId}/ensembles/box-whisker?group=...&ensembleType=...&metric=...`
- Example request URLs:
  - `http://localhost:8080/api/states/OR/ensembles/box-whisker?group=latino&ensembleType=vra_constrained&metric=minority_share`
  - `http://localhost:8080/api/states/SC/ensembles/box-whisker?group=black&ensembleType=race_blind&metric=minority_share`
- Parameters:
  - path `stateId`: `OR` or `SC`
  - query `group`: seeded as `latino` for Oregon and `black` for South Carolina
  - query `ensembleType`: seeded as `vra_constrained` or `race_blind`
  - query `metric`: seeded repository key is `minority_share`
- Response JSON summary:
  - `chartType: "box-whisker"`
  - `ensembleType`
  - `selectedGroup`
  - `metricLabel`
  - `rankSummaries[]` with quartile values per ranked district
- Example JSON snippet:

```json
{
  "schemaVersion": "v1",
  "chartType": "box-whisker",
  "state": "OR",
  "ensembleType": "vra_constrained",
  "selectedGroup": "Latino",
  "metricLabel": "Latino CVAP share",
  "rankSummaries": [
    {
      "districtRank": 1,
      "min": 0.07,
      "median": 0.13,
      "max": 0.22,
      "enactedValue": 0.12
    }
  ]
}
```

- Full sample files:
  - `mock-data/v1/box-whisker/OR_latino_cvap_vra.json`
  - `mock-data/v1/box-whisker/OR_latino_cvap_race_blind.json`
  - `mock-data/v1/box-whisker/SC_black_cvap_vra.json`
  - `mock-data/v1/box-whisker/SC_black_cvap_race_blind.json`
- Mongo collection: `box_whisker_results`
- Frontend usage today:
  - `StateSimulationMinorityData.jsx` and `StateCustomAnalysis.jsx` currently render local mock payloads
- Status: `Seeded contract`

## Error Contract

The global error shape returned by `ApiExceptionHandler` is:

```json
{
  "timestamp": "2026-03-31T12:34:56Z",
  "status": 404,
  "error": "Not Found",
  "message": "District map not found for stateId=XX",
  "path": "/api/states/XX/districts/enacted/geojson"
}
```

Fields:

- `timestamp`: server-side `Instant` when the error was generated
- `status`: HTTP status code
- `error`: HTTP status reason phrase
- `message`: application error detail
- `path`: request URI

For routes still marked planned in the service layer, the backend returns the separate skeleton shape:

```json
{
  "schemaVersion": "v1",
  "status": "skeleton",
  "message": "Planned for next phase",
  "route": "/api/states/OR/summary"
}
```

## Data-to-Use-Case Relationship

The relationship between data and use cases is:

1. The frontend selects a use case and requests the matching route.
2. The backend uses `stateId` plus optional selectors such as `group`, `electionId`, `ensembleType`, and `metricKey` to determine the requested analytical slice.
3. The backend reads one Mongo document from the collection mapped to that use case.
4. The backend returns the document `payload` directly as client-ready JSON or GeoJSON.

This makes each use case easy to explain:

- the route tells you what question the UI is asking
- the request parameters tell you which slice of the dataset is needed
- the Mongo collection tells you what class of analytical artifact backs the answer
- the `payload` field is the JSON contract returned to the client

## Related References

- `docs/api-test-data-catalog.md`
- `docs/mongo-schema-and-use-case-mapping.md`
- `docs/chart-handoff-contracts.md`
- `docs/schema-field-guide.md`
- `docs/mock-data-validation-checklist.md`
