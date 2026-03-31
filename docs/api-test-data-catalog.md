# API Test Data Catalog

## Purpose

This appendix catalogs the concrete JSON and GeoJSON payloads used to demonstrate the server contract for each use case. It is the evidence set for professor review when discussing:

- what the client requests
- what the server returns
- where the response payload comes from
- whether the route is currently `Live` or only a `Seeded contract`

For the payload-backed analytical routes, the response body is the Mongo `payload` value itself. The server does not return the full Mongo document wrapper.

## Catalog

| Use Case | Server Route | State | Query Variant | Returned From | Sample JSON Source | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GUI-2 | `/api/states/{stateId}/districts/enacted/geojson` | OR | `stateId=OR` | `district_maps` | `src/data/oregon_congressional_districts.geojson` | `Live` route and payload |
| GUI-2 | `/api/states/{stateId}/districts/enacted/geojson` | SC | `stateId=SC` | `district_maps` | `src/data/south_carolina_congressional_districts.geojson` | `Live` route and payload |
| GUI-3 | `/api/states/{stateId}/summary` | OR | `stateId=OR` | `state_summaries` | seeded inline in `SeedDataLoader.seedStateSummaries()` | `Seeded contract` |
| GUI-3 | `/api/states/{stateId}/summary` | SC | `stateId=SC` | `state_summaries` | seeded inline in `SeedDataLoader.seedStateSummaries()` | `Seeded contract` |
| GUI-4 | `/api/states/{stateId}/heatmap/precincts?group=...` | OR | `stateId=OR&group=latino` | `heatmap_bins` | seeded inline in `SeedDataLoader.heatmapPayload()` | `Seeded contract` |
| GUI-4 | `/api/states/{stateId}/heatmap/precincts?group=...` | SC | `stateId=SC&group=black` | `heatmap_bins` | seeded inline in `SeedDataLoader.heatmapPayload()` | `Seeded contract` |
| GUI-6 | `/api/states/{stateId}/districts/enacted/table?election=2024_pres` | OR | `stateId=OR&election=2024_pres` | `district_tables` | seeded inline in `SeedDataLoader.seedDistrictTables()` | `Seeded contract` |
| GUI-6 | `/api/states/{stateId}/districts/enacted/table?election=2024_pres` | SC | `stateId=SC&election=2024_pres` | `district_tables` | seeded inline in `SeedDataLoader.seedDistrictTables()` | `Seeded contract` |
| GUI-9 | `/api/states/{stateId}/analysis/gingles?group=...&election=2024_pres` | OR | `stateId=OR&group=latino&election=2024_pres` | `gingles_results` | `mock-data/v1/gingles-scatter/OR_2024_latino.json` | `Seeded contract` |
| GUI-9 | `/api/states/{stateId}/analysis/gingles?group=...&election=2024_pres` | SC | `stateId=SC&group=black&election=2024_pres` | `gingles_results` | `mock-data/v1/gingles-scatter/SC_2024_black.json` | `Seeded contract` |
| GUI-12 | `/api/states/{stateId}/analysis/ei-support?groups=...&election=2024_pres&party=DEM` | OR | `stateId=OR&groups=latino&election=2024_pres&party=DEM` | `ei_support_results` | `mock-data/v1/ei-support/OR_2024_president.json` | `Seeded contract`; seeded payload is one group per state |
| GUI-12 | `/api/states/{stateId}/analysis/ei-support?groups=...&election=2024_pres&party=DEM` | SC | `stateId=SC&groups=black&election=2024_pres&party=DEM` | `ei_support_results` | `mock-data/v1/ei-support/SC_2024_president.json` | `Seeded contract`; controller documents `party=DEM|REP` |
| GUI-16 | `/api/states/{stateId}/ensembles/splits?ensembleSize=final&election=2024_pres` | OR | `stateId=OR&ensembleSize=final&election=2024_pres` | `ensemble_splits` | `mock-data/v1/ensemble-splits/OR_compare.json` | `Seeded contract`; stored under selector `final`, sample file still carries `ensembleSize: 250` |
| GUI-16 | `/api/states/{stateId}/ensembles/splits?ensembleSize=final&election=2024_pres` | SC | `stateId=SC&ensembleSize=final&election=2024_pres` | `ensemble_splits` | `mock-data/v1/ensemble-splits/SC_compare.json` | `Seeded contract`; stored under selector `final`, sample file still carries `ensembleSize: 250` |
| GUI-17 | `/api/states/{stateId}/ensembles/box-whisker?group=...&ensembleType=vra_constrained&metric=minority_share` | OR | `stateId=OR&group=latino&ensembleType=vra_constrained&metric=minority_share` | `box_whisker_results` | `mock-data/v1/box-whisker/OR_latino_cvap_vra.json` | `Seeded contract` |
| GUI-17 | `/api/states/{stateId}/ensembles/box-whisker?group=...&ensembleType=race_blind&metric=minority_share` | OR | `stateId=OR&group=latino&ensembleType=race_blind&metric=minority_share` | `box_whisker_results` | `mock-data/v1/box-whisker/OR_latino_cvap_race_blind.json` | `Seeded contract` |
| GUI-17 | `/api/states/{stateId}/ensembles/box-whisker?group=...&ensembleType=vra_constrained&metric=minority_share` | SC | `stateId=SC&group=black&ensembleType=vra_constrained&metric=minority_share` | `box_whisker_results` | `mock-data/v1/box-whisker/SC_black_cvap_vra.json` | `Seeded contract` |
| GUI-17 | `/api/states/{stateId}/ensembles/box-whisker?group=...&ensembleType=race_blind&metric=minority_share` | SC | `stateId=SC&group=black&ensembleType=race_blind&metric=minority_share` | `box_whisker_results` | `mock-data/v1/box-whisker/SC_black_cvap_race_blind.json` | `Seeded contract` |

## GUI-3 Example Payloads from Seed Data

These payloads are constructed directly inside `SeedDataLoader.seedStateSummaries()`.

### Oregon

Request URL:

```text
http://localhost:8080/api/states/OR/summary
```

Example payload:

```json
{
  "schemaVersion": "v1",
  "state": "OR",
  "totalDistricts": 6,
  "population": "4,272,371",
  "voterDistributionDem": "1,228,410 (55.6%)",
  "voterDistributionRep": "910,702 (41.3%)",
  "partyControl": "Democrat",
  "democratReps": "Suzanne Bonamici, Maxine Dexter, Val Hoyle, Janelle Bynum, Andrea Salinas",
  "republicanReps": "Cliff Bentz",
  "feasibleGroups": ["Latino", "Asian", "White"],
  "ensembleSummary": {
    "available": true,
    "sizes": ["test", "final"],
    "finalPlanCount": 5000
  }
}
```

### South Carolina

Request URL:

```text
http://localhost:8080/api/states/SC/summary
```

Example payload:

```json
{
  "schemaVersion": "v1",
  "state": "SC",
  "totalDistricts": 7,
  "population": "5,478,831",
  "voterDistributionDem": "1,417,196 (41.03%)",
  "voterDistributionRep": "1,696,935 (49.13%)",
  "partyControl": "Republican",
  "democratReps": "James Clyburn",
  "republicanReps": "Nancy Mace, Joe Wilson, Sheri Biggs, William Timmons, Ralph Norman, Russell Fry",
  "feasibleGroups": ["Black", "Latino", "White"],
  "ensembleSummary": {
    "available": true,
    "sizes": ["test", "final"],
    "finalPlanCount": 5000
  }
}
```

## GUI-4 Example Payloads from Seed Data

These payloads are generated by `SeedDataLoader.heatmapPayload()` and inserted into `heatmap_bins`.

### Oregon

Request URL:

```text
http://localhost:8080/api/states/OR/heatmap/precincts?group=latino
```

Example payload:

```json
{
  "schemaVersion": "v1",
  "state": "OR",
  "group": "Latino",
  "binUnit": "percent",
  "bins": [
    { "min": 0, "max": 10, "color": "#f7fbff" },
    { "min": 10, "max": 20, "color": "#deebf7" },
    { "min": 20, "max": 30, "color": "#c6dbef" },
    { "min": 30, "max": 40, "color": "#9ecae1" },
    { "min": 40, "max": 50, "color": "#6baed6" },
    { "min": 50, "max": 100, "color": "#3182bd" }
  ],
  "precomputed": true
}
```

### South Carolina

Request URL:

```text
http://localhost:8080/api/states/SC/heatmap/precincts?group=black
```

Example payload:

```json
{
  "schemaVersion": "v1",
  "state": "SC",
  "group": "Black",
  "binUnit": "percent",
  "bins": [
    { "min": 0, "max": 10, "color": "#f7fbff" },
    { "min": 10, "max": 20, "color": "#deebf7" },
    { "min": 20, "max": 30, "color": "#c6dbef" },
    { "min": 30, "max": 40, "color": "#9ecae1" },
    { "min": 40, "max": 50, "color": "#6baed6" },
    { "min": 50, "max": 100, "color": "#3182bd" }
  ],
  "precomputed": true
}
```

## GUI-6 Example Payloads from Seed Data

These payloads are constructed inside `SeedDataLoader.seedDistrictTables()`.

### Oregon

Request URL:

```text
http://localhost:8080/api/states/OR/districts/enacted/table?election=2024_pres
```

Example payload:

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
    },
    {
      "districtNumber": 6,
      "representative": "Andrea Salinas",
      "party": "Democrat",
      "racialEthnicGroup": "Latino",
      "voteMargin2024": 5.4
    }
  ]
}
```

### South Carolina

Request URL:

```text
http://localhost:8080/api/states/SC/districts/enacted/table?election=2024_pres
```

Example payload:

```json
{
  "schemaVersion": "v1",
  "state": "SC",
  "election": "2024_pres",
  "districts": [
    {
      "districtNumber": 1,
      "representative": "Nancy Mace",
      "party": "Republican",
      "racialEthnicGroup": "White",
      "voteMargin2024": -13.8
    },
    {
      "districtNumber": 6,
      "representative": "James Clyburn",
      "party": "Democrat",
      "racialEthnicGroup": "Black",
      "voteMargin2024": 15.3
    }
  ]
}
```

## Linked Payload Files

- GUI-2
  - `src/data/oregon_congressional_districts.geojson`
  - `src/data/south_carolina_congressional_districts.geojson`
- GUI-9
  - `mock-data/v1/gingles-scatter/OR_2024_latino.json`
  - `mock-data/v1/gingles-scatter/SC_2024_black.json`
- GUI-12
  - `mock-data/v1/ei-support/OR_2024_president.json`
  - `mock-data/v1/ei-support/SC_2024_president.json`
- GUI-16
  - `mock-data/v1/ensemble-splits/OR_compare.json`
  - `mock-data/v1/ensemble-splits/SC_compare.json`
- GUI-17
  - `mock-data/v1/box-whisker/OR_latino_cvap_vra.json`
  - `mock-data/v1/box-whisker/OR_latino_cvap_race_blind.json`
  - `mock-data/v1/box-whisker/SC_black_cvap_vra.json`
  - `mock-data/v1/box-whisker/SC_black_cvap_race_blind.json`

## How the Server Gets This JSON

The data flow is consistent across the seeded analytical routes:

1. `SeedDataLoader` inserts the payload into MongoDB during application startup.
2. The repository layer selects a document using keys such as `stateId`, `groupKey`, `electionId`, `ensembleType`, or `metricKey`.
3. `BackendDataService` returns the document `payload`.
4. The frontend consumes that payload directly as chart JSON, summary JSON, or GeoJSON.

This is why the sample files and seed definitions are important talking points: they are both the professor-facing test data and the concrete contract the backend is expected to return.
