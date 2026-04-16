# Client/Server Interface Packet

## Purpose
This document is the professor-facing contract reference for the Braves project. It lists every GUI use case currently implemented by the team and shows whether it is backed by a server response or is intentionally client-only.

## Use Case Scope
The team is implementing the following subset of the professor's master use case list:
- **GUI:** 1, 2, 3, 4, 6, 7, 8, 9, 10, 12, 13, 15, 16, 17, 19, 20, 21, 22, 24 (19 total)
- **Preprocessing:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 11 (10 total)
- **SeaWulf:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13 (12 total)

**Not implementing:** GUI-5 (census block heatmap), GUI-11 (Gingles table row highlight), GUI-14 (EI choropleth maps), GUI-18 (vote share vs seat share curve), GUI-23 (duplicate of GUI-20), Prepro-10 (vote share vs seat share data), SeaWulf-12 (multi-node MPI).

Status labels used here:
- `Live`: route exists and the backend can return a seeded payload now
- `Client-only`: UI behavior uses state already loaded by other routes and does not make its own server request

Geometry note:
- All geometry is TopoJSON-first and file-backed by the backend via `GeometryAssetService`.
- `GUI-2` enacted district maps and `GUI-4` precinct maps are served from static classpath TopoJSON assets.
- The frontend fetches TopoJSON, converts it with `topojson-client`, then renders the resulting features in Leaflet.
- `GUI-19` remains Mongo-backed, but its stored geometry is also TopoJSON-first via the `topology` field.
- Static geometry routes now return browser-cacheable responses with `ETag` and `Cache-Control: public, max-age=604800`.
- Static geometry payloads are sanitized to map-only properties before delivery.

## Interface Summary
| GUI | Purpose | Method | URL | Status | Response body / behavior |
| --- | --- | --- | --- | --- | --- |
| GUI-1 | List supported states | `GET` | `/api/states` | `Live` | JSON array of `StateOptionResponse` |
| GUI-2 | Enacted district map | `GET` | `/api/states/{stateId}/districts/enacted/topology` | `Live` | TopoJSON `Topology` |
| GUI-3 | State summary | `GET` | `/api/states/{stateId}/summary` | `Live` | Summary JSON |
| GUI-4 | Precinct heatmap geometry | `GET` | `/api/states/{stateId}/precincts/topology` | `Live` | TopoJSON `Topology` |
| GUI-4 | Precinct heatmap bins | `GET` | `/api/states/{stateId}/heatmap/precincts?group=...` | `Live` | Heatmap legend/bin JSON |
| GUI-6 | Congressional representation table | `GET` | `/api/states/{stateId}/districts/enacted/table?election=...` | `Live` | District table JSON |
| GUI-7 | Highlight district | N/A | N/A | `Client-only` | Uses `GUI-6` district row + `GUI-2` map geometry |
| GUI-9 | Gingles scatter plot | `GET` | `/api/states/{stateId}/analysis/gingles?group=...&election=...` | `Live` | Scatter/regression JSON |
| GUI-10 | Gingles precinct table | `GET` | `/api/states/{stateId}/analysis/gingles/table?group=...&election=...` | `Live` | Precinct table JSON |
| GUI-12 | EI support distribution | `GET` | `/api/states/{stateId}/analysis/ei-support?groups=...&election=...&party=...` | `Live` | EI density JSON |
| GUI-13 | EI precinct bar + CI | `GET` | `/api/states/{stateId}/analysis/ei-precinct-bar-ci?group=...&election=...&party=...` | `Live` | Bar/CI JSON |
| GUI-15 | EI KDE comparison | `GET` | `/api/states/{stateId}/analysis/ei-kde?group=...&election=...&metric=...` | `Live` | KDE JSON |
| GUI-16 | Ensemble splits | `GET` | `/api/states/{stateId}/ensembles/splits?ensembleSize=...&election=...` | `Live` | Split comparison JSON |
| GUI-17 | Box-and-whisker ensemble summary | `GET` | `/api/states/{stateId}/ensembles/box-whisker?group=...&ensembleType=...&metric=...` | `Live` | Ranked summary JSON |
| GUI-19 | Interesting district plan | `GET` | `/api/states/{stateId}/districts/interesting?planId=...` | `Live` | Metadata + TopoJSON plan payload |
| GUI-20 | VRA impact threshold table | `GET` | `/api/states/{stateId}/analysis/vra-impact-thresholds?group=...&election=...` | `Live` | Threshold comparison table JSON |
| GUI-21 | Minority effectiveness box-and-whisker comparison | `GET` | `/api/states/{stateId}/analysis/minority-effectiveness/box-whisker?election=...` | `Live` | Group comparison box summaries |
| GUI-22 | Minority effectiveness histogram | `GET` | `/api/states/{stateId}/analysis/minority-effectiveness/histogram?group=...&election=...` | `Live` | Overlapping histogram JSON |
| GUI-24 | Reset page | N/A | N/A | `Client-only` | Clears UI state to pre-selection defaults |

## Example/Test JSON

### GUI-1
```json
[
  { "stateId": "OR", "stateName": "Oregon", "totalDistricts": 6 },
  { "stateId": "SC", "stateName": "South Carolina", "totalDistricts": 7 }
]
```

### GUI-2
```json
{
  "type": "Topology",
  "objects": {
    "districts": {
      "type": "GeometryCollection",
      "geometries": []
    }
  },
  "arcs": []
}
```
District geometries include `properties.RESULT` for party color styling.
Delivered district geometry properties are limited to `RESULT`, `NAMELSAD`, `district_number`, and `GEOID`.
Actual payload source: file-backed Topology JSON in `server/src/main/resources/geometry/*_congressional_districts.json`.

### GUI-3
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
  "ensembleSummary": { "available": true, "sizes": ["test", "final"], "finalPlanCount": 5000 }
}
```

### GUI-4
Geometry route:
`GET /api/states/{stateId}/precincts/topology`

```json
{
  "type": "Topology",
  "objects": {
    "OR": {
      "type": "GeometryCollection",
      "geometries": []
    }
  },
  "arcs": []
}
```
Delivered precinct geometry properties are limited to `GEOID`.

Legend/bin route:
`GET /api/states/{stateId}/heatmap/precincts?group=...`

```json
{
  "schemaVersion": "v1",
  "state": "SC",
  "group": "Black",
  "binUnit": "percent",
  "bins": [
    { "min": 0, "max": 10, "color": "#f7fcb9" },
    { "min": 10, "max": 20, "color": "#d9f0a3" }
  ],
  "precomputed": true
}
```

### GUI-6
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

### GUI-7
No dedicated JSON response. The highlight action is driven by the district row selected in `GUI-6` and the already-rendered geometry from `GUI-2`.

### GUI-9
Sample payload source: [`mock-data/v1/gingles-scatter/OR_2024_latino.json`](/Users/sahilparikh/Documents/CSE%20416%20Braves/mock-data/v1/gingles-scatter/OR_2024_latino.json)

### GUI-10
```json
{
  "schemaVersion": "v1",
  "tableType": "gingles-precinct-table",
  "state": "OR",
  "election": "2024 Presidential",
  "selectedGroup": "Latino",
  "rows": [
    {
      "precinctId": "OR-P001",
      "precinctName": "Portland 1",
      "totalPopulation": 1820,
      "minorityPopulation": 218,
      "republicanVotes": 812,
      "democraticVotes": 746,
      "minorityShare": 0.12,
      "repVoteShare": 0.5,
      "demVoteShare": 0.46
    }
  ]
}
```

### GUI-12
Sample payload source: [`mock-data/v1/ei-support/OR_2024_president.json`](/Users/sahilparikh/Documents/CSE%20416%20Braves/mock-data/v1/ei-support/OR_2024_president.json)

### GUI-13
```json
{
  "schemaVersion": "v1",
  "chartType": "ei-precinct-bar-ci",
  "state": "OR",
  "totalDistricts": 6,
  "election": "2024 Presidential",
  "selectedCandidate": "Hardy",
  "categories": [
    { "category": "Latino", "peak": 0.71, "ciLow": 0.64, "ciHigh": 0.79 }
  ]
}
```

### GUI-15
Single-series support-gap KDE with histogram bins and threshold overlay.
```json
{
  "schemaVersion": "v1",
  "chartType": "ei-kde",
  "state": "OR",
  "totalDistricts": 6,
  "metricLabel": "Support gap (Latino − non-Latino)",
  "thresholdX": 0.0,
  "thresholdLabel": "P(gap > 0)",
  "thresholdProbability": 0.84,
  "domain": [-0.4, 0.8],
  "series": [
    {
      "key": "support_gap",
      "label": "Support gap",
      "points": [{ "x": -0.3, "density": 0.05 }, { "x": 0.0, "density": 0.2 }, { "x": 0.33, "density": 1.1 }]
    }
  ]
}
```

### GUI-16
Sample payload source: [`mock-data/v1/ensemble-splits/OR_compare.json`](/Users/sahilparikh/Documents/CSE%20416%20Braves/mock-data/v1/ensemble-splits/OR_compare.json)

### GUI-17
Sample payload source: [`mock-data/v1/box-whisker/OR_latino_cvap_vra.json`](/Users/sahilparikh/Documents/CSE%20416%20Braves/mock-data/v1/box-whisker/OR_latino_cvap_vra.json)

### GUI-19
```json
{
  "schemaVersion": "v1",
  "state": "OR",
  "planId": "plan-42",
  "planName": "Oregon Opportunity Corridor",
  "ensembleType": "race_blind",
  "reasonInteresting": "High Latino opportunity with competitive statewide split",
  "summary": {
    "repWins": 2,
    "demWins": 4,
    "effectiveMinorityDistricts": 2
  },
  "topology": {
    "type": "Topology",
    "objects": {
      "districts": {
        "type": "GeometryCollection",
        "geometries": []
      }
    },
    "arcs": []
  }
}
```
The live seeded payload stores TopoJSON in Mongo so `GUI-19` remains one collection-backed lookup returning metadata plus geometry in a single response.

### GUI-20
```json
{
  "schemaVersion": "v1",
  "tableType": "vra-impact-thresholds",
  "state": "OR",
  "election": "2024 Presidential",
  "selectedGroup": "Latino",
  "populationMeasure": "CVAP",
  "rows": [
    {
      "metricKey": "meet_or_exceed_enacted",
      "metricLabel": "Meet or exceed enacted effective minority districts",
      "raceBlindShare": 0.18,
      "vraConstrainedShare": 0.67
    }
  ]
}
```

### GUI-21
```json
{
  "schemaVersion": "v1",
  "chartType": "minority-effectiveness-box-whisker",
  "state": "OR",
  "election": "2024 Presidential",
  "totalDistricts": 6,
  "units": { "count": "districts" },
  "groupSummaries": [
    {
      "key": "latino",
      "label": "Latino",
      "raceBlindSummary": { "min": 0, "q1": 1, "median": 1, "q3": 2, "max": 3 },
      "vraConstrainedSummary": { "min": 1, "q1": 1, "median": 2, "q3": 2, "max": 3 }
    }
  ]
}
```

### GUI-22
```json
{
  "schemaVersion": "v1",
  "chartType": "minority-effectiveness-histogram",
  "state": "OR",
  "election": "2024 Presidential",
  "totalDistricts": 6,
  "selectedGroup": "Latino",
  "ensembleSize": 250,
  "units": { "count": "plans" },
  "series": {
    "raceBlind": [
      { "effectiveDistricts": 0, "frequency": 52, "shareOfEnsemble": 0.208 }
    ],
    "vraConstrained": [
      { "effectiveDistricts": 2, "frequency": 129, "shareOfEnsemble": 0.516 }
    ]
  }
}
```

### GUI-24
No dedicated JSON response. Reset is a frontend state clear back to the pre-selection view.
