# SeaWulf & Preprocessing Payload Schemas

This document is frontend-first. Every field listed in an API response section is one that a React component actually reads, or that is known to be present in the seeded payload. Fields are not included because they seem useful — they are included because removing them would break a chart, table, or map render. MongoDB schemas list the minimum needed to assemble those responses plus the lookup keys required to find the right document.

Shapes marked **[CURRENT]** reflect what is actually seeded today. Shapes marked **[GAP — needs Prepro-X]** are aspirational fields required by the new use case list but not yet in the seeded data.

---

## 1. Core Definitions

| Term | Value |
|------|-------|
| Feasible group threshold | Statewide population ≥ 400,000 (≥ 200,000 for primarily-white states) |
| OR feasible groups | Latino, Asian, White |
| SC feasible groups | Black, Latino, White |
| Population measure | TOTAL (state summary, heatmap, district table, box-whisker); CVAP (VRA thresholds, rough proportionality calculations) |
| Effective district | Calibrated statewide effectiveness score (`s_state`) ≥ 0.6 |
| Rough proportionality benchmark | `floor(groupCvapShare × totalDistricts)` |
| Party of choice | Party with highest avg EI-estimated vote share in 2024 Presidential election for that group |
| Race-blind ensemble | ReCom, no minority constraints (~250 test / ~5,000 final plans) |
| VRA-constrained ensemble | ReCom using `s_state`, must meet or exceed enacted effective-district count per feasible group |

---

## 2. API Response Contracts

Each subsection names the endpoint, the component(s) that call it, and the exact response shape — field by field.

---

### 2.1 `GET /api/states` — GUI-1

**Component:** `SplashPage`

```json
[
  { "stateId": "OR", "stateName": "Oregon",         "totalDistricts": 6 },
  { "stateId": "SC", "stateName": "South Carolina", "totalDistricts": 7 }
]
```

---

### 2.2 `GET /api/states/{stateId}/districts/enacted/topology` — GUI-2

**Component:** `StatePage`, `Simulation`, `EI` — all call `topologyToFeatureCollection(response, "districts")`

```json
{
  "type": "Topology",
  "objects": {
    "districts": {
      "type": "GeometryCollection",
      "geometries": [
        {
          "type": "Polygon",
          "arcs": [[0, 1, 2]],
          "properties": {
            "RESULT": "DEMOCRATIC",
            "district_number": 1,
            "NAMELSAD": "Congressional District 1",
            "GEOID": "4101"
          }
        }
      ]
    }
  },
  "arcs": [],
  "bbox": [-124.6, 41.9, -116.5, 46.3]
}
```

**Properties the frontend reads per feature:** `RESULT` (party fill color — `"DEMOCRATIC"` | `"REPUBLICAN"`), `district_number` (highlight linking to district table), `NAMELSAD` (hover tooltip).

Served from classpath TopoJSON; cached with HTTP ETag + 7-day max-age.

---

### 2.3 `GET /api/states/{stateId}/state-summary` — GUI-3

**Component:** `StatePage`

```json
{
  "schemaVersion": "v1",
  "state": "OR",
  "totalDistricts": 6,
  "population": "3,370,625",
  "voterDistributionDem": "1,240,600 (55.27%)",
  "voterDistributionRep": "919,480 (40.97%)",
  "WhitePopulation": "2,526,251",
  "BlackPopulation": "60,012",
  "AsianPopulation": "194,538",
  "HispanicPopulation": "389,384",
  "partyControl": "Democratic",
  "democratReps": "Suzanne Bonamici, Maxine Dexter, Val Hoyle, Janelle Bynum, Andrea Salinas",
  "republicanReps": "Cliff Bentz",
  "feasibleGroups": ["Latino", "Asian", "White"],
  "ensembleSummary": {
    "available": true,
    "sizes": ["test", "final"],
    "finalPlanCount": "5,000"
  }
}
```

**[GAP — needs Prepro-12]** GUI-3 (5/6/26) requires a `groupRoughProportionality` array to be added once enacted effectiveness data is available:
```json
"groupRoughProportionality": [
  {
    "groupKey": "latino",
    "label": "Latino",
    "enactedEffectiveDistricts": 1,
    "cvapShare": 0.12,
    "roughProportionalityRatio": 1.39
  }
]
```
`roughProportionalityRatio = (enactedEffectiveDistricts / totalDistricts) / cvapShare`; 1.0 = exactly proportional.

---

### 2.4 `GET /api/states/{stateId}/ensembles-summary` — GUI-3 (Ensembles tab)

**Component:** `StatePage`

```json
{
  "schemaVersion": "v1",
  "state": "OR",
  "finalPlanCount": "5,000",
  "populationEqualityThreshold": "0.50%"
}
```

---

### 2.5 `GET /api/states/{stateId}/precincts/topology` — GUI-4 geometry

**Component:** `MinorityHeatMap`

Same TopoJSON structure as §2.2 but the object key is the state code (`"OR"` or `"SC"`). The only property the frontend needs per precinct feature is `GEOID` (used to look up the precinct's group share in the heatmap bins response).

```json
{
  "type": "Topology",
  "objects": {
    "OR": {
      "type": "GeometryCollection",
      "geometries": [
        { "type": "Polygon", "arcs": [[0]], "properties": { "GEOID": "41051001" } }
      ]
    }
  },
  "arcs": [],
  "bbox": [-124.6, 41.9, -116.5, 46.3]
}
```

---

### 2.6 `GET /api/states/{stateId}/heatmap/precincts?group=` — GUI-4 bins

**Component:** `MinorityHeatMap`

Query param `group` accepts the normalized group key (e.g., `latino`, `asian`, `black`).

```json
{
  "group": "Latino",
  "binUnit": "percent",
  "bins": [
    { "min": 0,  "max": 10,  "color": "#f7fcb9" },
    { "min": 10, "max": 20,  "color": "#d9f0a3" },
    { "min": 20, "max": 30,  "color": "#addd8e" },
    { "min": 30, "max": 40,  "color": "#78c679" },
    { "min": 40, "max": 50,  "color": "#41ab5d" },
    { "min": 50, "max": 100, "color": "#006837" }
  ],
  "precomputed": true
}
```

`bins` defines the color scale. The `MinorityHeatMap` component assigns each precinct feature a color by looking up its group share (from the precinct TopoJSON properties) against these bin ranges. Empty bins should be omitted per GUI-4 spec. `precomputed: true` signals the bins were calculated from real data, not defaults.

**Seeded groups:** OR: `latino`, `asian` · SC: `black`, `latino`

---

### 2.7 `GET /api/states/{stateId}/districts/enacted/table?election=` — GUI-6

**Component:** `StatePage` → district table

`election` defaults to `2024_pres` when omitted.

```json
{
  "schemaVersion": "v1",
  "state": "OR",
  "election": "2024_pres",
  "districts": [
    {
      "districtNumber": 1,
      "representative": "Suzanne Bonamici",
      "party": "Democratic",
      "racialEthnicGroup": "White",
      "voteMargin2024": 37.6,
      "effectivenessScore": 0.41,
      "calibratedEffectivenessScore": 0.38
    },
    {
      "districtNumber": 2,
      "representative": "Cliff Bentz",
      "party": "Republican",
      "racialEthnicGroup": "White",
      "voteMargin2024": -27.1,
      "effectivenessScore": 0.29,
      "calibratedEffectivenessScore": 0.27
    }
  ]
}
```

`voteMargin2024` is `(demVotes − repVotes) / totalVotes × 100`. Positive = Democratic margin, negative = Republican. `effectivenessScore` and `calibratedEffectivenessScore` are currently seeded with placeholder values from `Prepro-11` data; `calibratedEffectivenessScore` is `s_state` (threshold ≥ 0.6 for effectiveness).

**[GAP — needs Prepro-13/14]** GUI-6 (5/6/26) requires these scores to be computed per feasible minority group. Currently the seeded table has a single effectiveness score per district, not per group. A future multi-group version would change the shape.

---

### 2.8 `GET /api/states/{stateId}/analysis/gingles?group=&election=` — GUI-9

**Component:** `Gingles` → `GinglesScatterChart`

```json
{
  "schemaVersion": "v1",
  "chartType": "gingles-scatter",
  "state": "OR",
  "totalDistricts": 6,
  "electionKey": "2024_pres",
  "electionLabel": "2024 Presidential",
  "selectedGroup": "Latino",
  "units": { "share": "decimal_0_to_1" },
  "sampling": {
    "isSampled": true,
    "samplingAuthority": "preprocessing",
    "samplingMethod": "minority_share_binned_random_seed_42_40_bins",
    "displayedPointCount": 500,
    "fullPrecinctCount": 3421,
    "targetPointCount": 500
  },
  "points": [
    {
      "precinctId": "OR-P0409",
      "minorityShare": 0.0,
      "demVoteShare": 0.4939,
      "repVoteShare": 0.4777,
      "totalPopulation": 1944,
      "minorityPopulation": 0
    }
  ],
  "regressionCurves": [
    {
      "key": "dem_curve",
      "label": "Democratic curve",
      "party": "DEM",
      "curveType": "nonlinear_regression",
      "points": [
        { "x": 0.0, "y": 0.35 },
        { "x": 0.1, "y": 0.42 }
      ]
    },
    {
      "key": "rep_curve",
      "label": "Republican curve",
      "party": "REP",
      "curveType": "nonlinear_regression",
      "points": [
        { "x": 0.0, "y": 0.60 },
        { "x": 0.1, "y": 0.55 }
      ]
    }
  ]
}
```

**Fields the chart reads:**
- `points[].minorityShare` → x-axis for both scatter series
- `points[].demVoteShare` / `repVoteShare` → y-axis per series
- `points[].precinctId`, `totalPopulation`, `minorityPopulation` → tooltip
- `sampling.displayedPointCount` / `fullPrecinctCount` → optional chart annotation
- `regressionCurves[].party` → stroke color (`DEM` = `#2563eb`, else `#dc2626`)
- `regressionCurves[].points[].x` / `.y` → curve line data

Invariants: points sorted by `minorityShare` asc; `displayedPointCount` ≤ 500; must have exactly DEM and REP regression curves; curve `x` values sorted ascending; all shares in `[0, 1]`. When real preprocessing output exists at `preprocessing/output/{state}_2024_{group}_gingles_scatter.json`, it is loaded in preference to the mock fixture.

---

### 2.9 `GET /api/states/{stateId}/analysis/gingles/table?group=&election=` — GUI-10

**Component:** `Gingles` → precinct table

```json
{
  "schemaVersion": "v1",
  "chartType": "gingles-precinct-table",
  "state": "OR",
  "totalDistricts": 6,
  "electionKey": "2024_pres",
  "electionLabel": "2024 Presidential",
  "selectedGroup": "Latino",
  "rowCount": 3421,
  "sorting": { "rowOrder": "precinctId_asc" },
  "rows": [
    {
      "precinctId": "OR-P0538",
      "precinctName": "Latino Precinct 1",
      "totalPopulation": 2480,
      "minorityPopulation": 1361,
      "republicanVotes": 408,
      "democraticVotes": 1201,
      "minorityShare": 0.5486,
      "repVoteShare": 0.253,
      "demVoteShare": 0.7449,
      "winningParty": "DEM"
    }
  ]
}
```

Invariants: `rowCount = rows.length`; rows sorted by `precinctId` asc; `minorityPopulation ≤ totalPopulation`; all shares in `[0, 1]`.

---

### 2.10 `GET /api/states/{stateId}/analysis/ei-support?groups=&election=&party=` — GUI-12

**Components:** `EI` → `EiSupportChart`, `StateMinorityAnalysis`

`party` accepts `DEM` or `REP` (defaults to `DEM`). `groups` is a comma-separated list of group keys.

```json
{
  "schemaVersion": "v1",
  "chartType": "ei-support",
  "state": "OR",
  "totalDistricts": 6,
  "election": "2024 Presidential",
  "selectedCandidate": "Hardy",
  "selectedGroup": "Latino",
  "units": { "share": "decimal_0_to_1" },
  "series": [
    {
      "key": "latino",
      "label": "Latino",
      "confidenceScore": 0.82,
      "points": [
        { "xSupportShare": 0.2, "density": 0.1 },
        { "xSupportShare": 0.3, "density": 0.4 },
        { "xSupportShare": 0.7, "density": 3.7 },
        { "xSupportShare": 0.8, "density": 2.9 }
      ]
    },
    {
      "key": "non_latino",
      "label": "Non-Latino",
      "confidenceScore": 0.71,
      "points": [
        { "xSupportShare": 0.1, "density": 0.2 },
        { "xSupportShare": 0.3, "density": 3.6 },
        { "xSupportShare": 0.5, "density": 1.0 }
      ]
    }
  ]
}
```

**Fields the chart reads:**
- `selectedCandidate` → chart title `"Support for {selectedCandidate}"` (name of the candidate, not party label)
- `series[].key` → `dataKey` for each `<Area>`
- `series[].label` → legend name
- `series[].confidenceScore` → optional confidence badge
- `series[].points[].xSupportShare` → x-axis (merged across series by `flattenSeries`)
- `series[].points[].density` → y-axis

Invariants: `xSupportShare` monotonically increasing within each series; `density ≥ 0`.

**Seeded combinations:** OR: `(latino, DEM)`, `(asian, DEM)`, `(latino, REP)` · SC: `(black, DEM)`, `(latino, DEM)`, `(black, REP)`

---

### 2.11 `GET /api/states/{stateId}/analysis/ei-precinct-bar-ci?group=&election=&party=` — GUI-13

**Component:** `EI` → EI bar panel

```json
{
  "schemaVersion": "v1",
  "chartType": "ei-precinct-bar-ci",
  "state": "OR",
  "election": "2024 Presidential",
  "selectedCandidate": "Hardy",
  "categories": [
    { "category": "Latino", "peak": 0.71, "ciLow": 0.64, "ciHigh": 0.79 },
    { "category": "White",  "peak": 0.36, "ciLow": 0.29, "ciHigh": 0.43 },
    { "category": "Black",  "peak": 0.62, "ciLow": 0.51, "ciHigh": 0.73 },
    { "category": "Other",  "peak": 0.49, "ciLow": 0.38, "ciHigh": 0.60 }
  ]
}
```

**Fields the chart reads:**
- `selectedCandidate` → title
- `categories[].category` → x-axis label
- `categories[].peak` → bar height
- `categories[].ciLow`, `ciHigh` → `ErrorBar` via `ciError: [peak - ciLow, ciHigh - peak]`

Invariant: `ciLow ≤ peak ≤ ciHigh`; all in `[0, 1]`.

---

### 2.12 `GET /api/states/{stateId}/analysis/ei-kde?group=&election=&metric=&party=` — GUI-15

**Component:** `EI` → KDE panel

`metric` defaults to `support_gap`.

```json
{
  "schemaVersion": "v1",
  "chartType": "ei-kde",
  "state": "OR",
  "totalDistricts": 6,
  "selectedGroup": "Latino",
  "metricLabel": "Latino − non-Latino Dem support gap (2024 Presidential)",
  "domain": [-0.2, 0.75],
  "thresholdX": 0.25,
  "thresholdLabel": "Prob(gap > 0.25)",
  "thresholdProbability": 0.81,
  "series": [
    {
      "key": "support_gap",
      "label": "Latino support gap",
      "points": [
        { "x": -0.2,   "density": 0.0    },
        { "x": 0.101,  "density": 0.2887 },
        { "x": 0.33,   "density": 1.10   }
      ]
    }
  ]
}
```

**Fields the chart reads:**
- `metricLabel` → title
- `thresholdProbability` → annotated probability value
- `thresholdLabel` → annotation label text
- `thresholdX` → `<ReferenceLine x={...}>` position
- `domain` → `<XAxis domain={...}>`
- `series[0].points[].x` / `.density` → chart data

Invariants: `domain[0] ≤ thresholdX ≤ domain[1]`; `thresholdProbability ∈ [0, 1]`; `x` monotonically increasing; `density ≥ 0`.

---

### 2.13 `GET /api/states/{stateId}/ensembles/splits?ensembleSize=&election=` — GUI-16

**Components:** `Simulation` → `EnsembleSplits`, `VRAAnalysis`

`ensembleSize` accepts `test` or `final` (defaults to `final`). `election` defaults to `2024_pres`.

```json
{
  "schemaVersion": "v1",
  "chartType": "ensemble-splits",
  "state": "OR",
  "totalDistricts": 6,
  "ensembleSize": 250,
  "election": "2024 Presidential",
  "units": { "share": "decimal_0_to_1" },
  "series": {
    "raceBlind": [
      { "splitLabel": "1R/5D", "repWins": 1, "demWins": 5, "frequency": 28,  "shareOfEnsemble": 0.112 },
      { "splitLabel": "2R/4D", "repWins": 2, "demWins": 4, "frequency": 102, "shareOfEnsemble": 0.408 },
      { "splitLabel": "3R/3D", "repWins": 3, "demWins": 3, "frequency": 92,  "shareOfEnsemble": 0.368 },
      { "splitLabel": "4R/2D", "repWins": 4, "demWins": 2, "frequency": 28,  "shareOfEnsemble": 0.112 }
    ],
    "vraConstrained": [
      { "splitLabel": "1R/5D", "repWins": 1, "demWins": 5, "frequency": 20,  "shareOfEnsemble": 0.08  },
      { "splitLabel": "2R/4D", "repWins": 2, "demWins": 4, "frequency": 116, "shareOfEnsemble": 0.464 },
      { "splitLabel": "3R/3D", "repWins": 3, "demWins": 3, "frequency": 95,  "shareOfEnsemble": 0.38  },
      { "splitLabel": "4R/2D", "repWins": 4, "demWins": 2, "frequency": 19,  "shareOfEnsemble": 0.076 }
    ]
  }
}
```

**Fields the components read:**
- `series.raceBlind[].splitLabel` → x-axis dataKey
- `series.raceBlind[].frequency` → bar height
- `series.raceBlind[].shareOfEnsemble`, `.repWins`, `.demWins` → tooltip
- `totalDistricts`, `ensembleSize` → meta display

`splitLabel` format: `"{repWins}R/{demWins}D"`. Omit splits where frequency = 0 in **all** present series (GUI-16: tails omitted). Invariants: `repWins + demWins = totalDistricts`; `sum(frequency) = ensembleSize` per series; `shareOfEnsemble = frequency / ensembleSize`.

---

### 2.14 `GET /api/states/{stateId}/ensembles/box-whisker?group=&ensembleType=&metric=` — GUI-17

**Component:** `Simulation` → `BoxWhisker`

Frontend makes two separate calls: `ensembleType=race_blind` and `ensembleType=vra_constrained`, both with `metric=minority_share`.

```json
{
  "schemaVersion": "v1",
  "chartType": "box-whisker",
  "state": "OR",
  "totalDistricts": 6,
  "election": "2024 Presidential",
  "ensembleType": "vra_constrained",
  "selectedGroup": "Latino",
  "metricLabel": "Latino CVAP share",
  "units": { "share": "decimal_0_to_1" },
  "rankSummaries": [
    { "districtRank": 1, "min": 0.07, "q1": 0.10, "median": 0.13, "q3": 0.16, "max": 0.22, "enactedValue": 0.12, "proposedValue": 0.14 },
    { "districtRank": 2, "min": 0.12, "q1": 0.16, "median": 0.20, "q3": 0.24, "max": 0.30, "enactedValue": 0.22, "proposedValue": 0.24 },
    { "districtRank": 3, "min": 0.18, "q1": 0.23, "median": 0.28, "q3": 0.33, "max": 0.39, "enactedValue": 0.29, "proposedValue": 0.31 },
    { "districtRank": 4, "min": 0.24, "q1": 0.30, "median": 0.36, "q3": 0.41, "max": 0.47, "enactedValue": 0.35, "proposedValue": 0.39 },
    { "districtRank": 5, "min": 0.31, "q1": 0.38, "median": 0.44, "q3": 0.50, "max": 0.57, "enactedValue": 0.48, "proposedValue": 0.45 },
    { "districtRank": 6, "min": 0.42, "q1": 0.49, "median": 0.56, "q3": 0.63, "max": 0.72, "enactedValue": 0.59, "proposedValue": 0.61 }
  ]
}
```

**Fields read per rankSummary entry:**
- `districtRank` → x-axis label
- `min`, `max` → whisker endpoints; `q1`, `q3` → box; `median` → median line
- `enactedValue` → red dot (never null)
- `proposedValue` → yellow dot (rendered only when non-null)

Invariants: `rankSummaries.length = totalDistricts`; `min ≤ q1 ≤ median ≤ q3 ≤ max`; all values in `[0, 1]`; `districtRank` is 1-indexed.

---

### 2.15 `GET /api/states/{stateId}/districts/interesting/list` — GUI-8 / GUI-19 plan selector

**Component:** `Compare` — plan selector dropdown

Returns plan metadata only (no topology). Sorted and rendered in the dropdown.

```json
[
  {
    "schemaVersion": "v1",
    "state": "OR",
    "planId": "plan-42",
    "planName": "Oregon Opportunity Corridor",
    "ensembleType": "vra_constrained",
    "reasonInteresting": "High Latino opportunity with competitive statewide split",
    "summary": {
      "repWins": 2,
      "demWins": 4,
      "effectiveMinorityDistricts": 2
    }
  },
  {
    "schemaVersion": "v1",
    "state": "OR",
    "planId": "plan-43",
    "planName": "Oregon Race-Blind Baseline",
    "ensembleType": "race_blind",
    "reasonInteresting": "Race-blind baseline for comparison",
    "summary": {
      "repWins": 3,
      "demWins": 3,
      "effectiveMinorityDistricts": 1
    }
  }
]
```

Returns `[]` when no plans are seeded for the state. Invariant per element: `summary.repWins + summary.demWins = totalDistricts`.

---

### 2.16 `GET /api/states/{stateId}/districts/interesting?planId=` — GUI-19

**Component:** `InterestingMap`

Returns plan metadata plus full TopoJSON topology. `planId` is required.

```json
{
  "schemaVersion": "v1",
  "state": "OR",
  "planId": "plan-42",
  "planName": "Oregon Opportunity Corridor",
  "ensembleType": "vra_constrained",
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
        "geometries": [
          {
            "type": "Polygon",
            "arcs": [[0]],
            "properties": {
              "district_number": 1,
              "blackPopulation": 92299,
              "NAMELSAD": "Congressional District 1"
            }
          }
        ]
      }
    },
    "arcs": [],
    "bbox": [-124.6, 41.9, -116.5, 46.3]
  }
}
```

The topology is injected from canonical district geometry at seed time. `InterestingMap` uses `feature.properties.blackPopulation` for fill color; `feature.properties.district_number` for click selection. Invariant: `topology.type = "Topology"`.

---

### 2.17 `GET /api/states/{stateId}/analysis/vra-impact-thresholds?group=&election=` — GUI-20

**Component:** `Simulation` → `VRAImpact`

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
      "raceBlindShare": 0.21,
      "vraConstrainedShare": 0.74
    },
    {
      "metricKey": "rough_proportionality",
      "metricLabel": "Achieve rough proportionality relative to Latino CVAP share",
      "raceBlindShare": 0.28,
      "vraConstrainedShare": 0.78
    },
    {
      "metricKey": "joint_satisfaction",
      "metricLabel": "Satisfy both legal thresholds jointly",
      "raceBlindShare": 0.16,
      "vraConstrainedShare": 0.66
    }
  ]
}
```

**Fields the component reads:**
- `rows[].metricKey` → React key prop
- `rows[].metricLabel` → first column cell
- `rows[].raceBlindShare` → second column (formatted via `pct()`)
- `rows[].vraConstrainedShare` → third column

Always exactly 3 rows. `metricKey` values: `meet_or_exceed_enacted`, `rough_proportionality`, `joint_satisfaction`. All shares in `[0, 1]`.

---

### 2.18 `GET /api/states/{stateId}/analysis/minority-effectiveness/box-whisker?election=&ensembleType=&ensembleIndex=` — GUI-21

**Component:** `Simulation` → `MinorityEffectivenessBoxWhisker`

The frontend makes **two separate calls** — one with `ensembleType=rb` and one with `ensembleType=vra` — then merges the results. Each call returns only the summary for that ensemble type. `ensembleIndex` selects which run (1–4) to display, defaulting to `1`.

**`ensembleType=rb` response:**
```json
{
  "schemaVersion": "v1",
  "chartType": "minority-effectiveness-box-whisker",
  "state": "OR",
  "election": "2024 Presidential",
  "totalDistricts": 6,
  "units": { "count": "districts" },
  "groupSummaries": [
    { "key": "latino", "label": "Latino", "raceBlindSummary": { "min": 0, "q1": 1, "median": 1, "q3": 2, "max": 3 } },
    { "key": "asian",  "label": "Asian",  "raceBlindSummary": { "min": 0, "q1": 0, "median": 1, "q3": 1, "max": 2 } },
    { "key": "white",  "label": "White",  "raceBlindSummary": { "min": 3, "q1": 4, "median": 4, "q3": 5, "max": 6 } }
  ]
}
```

**`ensembleType=vra` response:**
```json
{
  "schemaVersion": "v1",
  "chartType": "minority-effectiveness-box-whisker",
  "state": "OR",
  "election": "2024 Presidential",
  "totalDistricts": 6,
  "units": { "count": "districts" },
  "groupSummaries": [
    { "key": "latino", "label": "Latino", "vraConstrainedSummary": { "min": 1, "q1": 1, "median": 2, "q3": 2, "max": 3 } },
    { "key": "asian",  "label": "Asian",  "vraConstrainedSummary": { "min": 0, "q1": 1, "median": 1, "q3": 2, "max": 2 } },
    { "key": "white",  "label": "White",  "vraConstrainedSummary": { "min": 3, "q1": 4, "median": 4, "q3": 5, "max": 6 } }
  ]
}
```

**Frontend merge:** `Simulation.jsx` combines both into a single `meBwData` object with each `groupSummaries[i]` containing both `raceBlindSummary` (from the `rb` call) and `vraConstrainedSummary` (from the `vra` call) before passing to the chart.

Field names are `key` and `label` — **not** `groupKey`/`groupLabel`. Invariants: `min ≤ q1 ≤ median ≤ q3 ≤ max`; all values are non-negative integer district counts in `[0, totalDistricts]`. 16 documents seeded total: 2 states × 2 ensemble types × 4 ensemble indices.

---

### 2.19 `GET /api/states/{stateId}/analysis/minority-effectiveness/histogram?group=&election=` — GUI-22

**Component:** `Simulation` → `MinorityEffectivenessHistogram`

```json
{
  "schemaVersion": "v1",
  "chartType": "minority-effectiveness-histogram",
  "state": "OR",
  "election": "2024 Presidential",
  "totalDistricts": 6,
  "selectedGroup": "Latino",
  "ensembleSize": 5000,
  "units": { "count": "plans" },
  "series": {
    "raceBlind": [
      { "effectiveDistricts": 0, "frequency": 1050 },
      { "effectiveDistricts": 1, "frequency": 2400 },
      { "effectiveDistricts": 2, "frequency": 1260 },
      { "effectiveDistricts": 3, "frequency": 280  },
      { "effectiveDistricts": 4, "frequency": 10   }
    ],
    "vraConstrained": [
      { "effectiveDistricts": 0, "frequency": 220  },
      { "effectiveDistricts": 1, "frequency": 1480 },
      { "effectiveDistricts": 2, "frequency": 2580 },
      { "effectiveDistricts": 3, "frequency": 720  }
    ]
  }
}
```

**Fields the chart reads:**
- `series.raceBlind[].effectiveDistricts` → merged x-axis (set union across both series)
- `series.raceBlind[].frequency` → green bar height
- `series.vraConstrained[].frequency` → blue bar height
- `totalDistricts` → x-axis tick range `[0, totalDistricts]`

Missing x-axis values are filled with frequency 0. Invariants: `sum(frequencies) = ensembleSize` per series; `effectiveDistricts ∈ [0, totalDistricts]`.

---

## 3. MongoDB Collection Schemas

Only fields needed to assemble the API responses above, plus lookup keys. `schemaVersion`, `createdAt`, `updatedAt` are internal envelope fields present on all documents but not returned to the frontend.

---

### `states`
Lookup: none (full scan)
```json
{ "stateId": "OR", "stateName": "Oregon", "totalDistricts": 6 }
```

---

### `state_summaries`
Lookup: `stateId`
```json
{
  "stateId": "OR",
  "payload": {
    "schemaVersion": "v1",
    "state": "OR",
    "totalDistricts": 6,
    "population": "3,370,625",
    "voterDistributionDem": "1,240,600 (55.27%)",
    "voterDistributionRep": "919,480 (40.97%)",
    "WhitePopulation": "2,526,251",
    "BlackPopulation": "60,012",
    "AsianPopulation": "194,538",
    "HispanicPopulation": "389,384",
    "partyControl": "Democratic",
    "democratReps": "Suzanne Bonamici, Maxine Dexter, Val Hoyle, Janelle Bynum, Andrea Salinas",
    "republicanReps": "Cliff Bentz",
    "feasibleGroups": ["Latino", "Asian", "White"],
    "ensembleSummary": {
      "available": true,
      "sizes": ["test", "final"],
      "finalPlanCount": "5,000"
    }
  }
}
```
`groupRoughProportionality` will be added to `payload` once `Prepro-12` data is available (see §2.3 GAP note).

---

### `ensemble_summaries`
Lookup: `stateId`
```json
{
  "stateId": "OR",
  "payload": {
    "schemaVersion": "v1",
    "state": "OR",
    "finalPlanCount": "5,000",
    "populationEqualityThreshold": "0.50%"
  }
}
```

---

### `heatmap_bins`
Lookup: `stateId + groupKey`
```json
{
  "stateId": "OR",
  "groupKey": "latino",
  "payload": {
    "group": "Latino",
    "binUnit": "percent",
    "bins": [
      { "min": 0,  "max": 10,  "color": "#f7fcb9" },
      { "min": 10, "max": 20,  "color": "#d9f0a3" },
      { "min": 20, "max": 30,  "color": "#addd8e" },
      { "min": 30, "max": 40,  "color": "#78c679" },
      { "min": 40, "max": 50,  "color": "#41ab5d" },
      { "min": 50, "max": 100, "color": "#006837" }
    ],
    "precomputed": true
  }
}
```
Store only non-empty bins. `precomputed: true` indicates bins were derived from actual precinct data.

---

### `district_tables`
Lookup: `stateId + electionId`
```json
{
  "stateId": "OR",
  "electionId": "2024_pres",
  "payload": {
    "schemaVersion": "v1",
    "state": "OR",
    "election": "2024_pres",
    "districts": [
      {
        "districtNumber": 1,
        "representative": "Suzanne Bonamici",
        "party": "Democratic",
        "racialEthnicGroup": "White",
        "voteMargin2024": 37.6,
        "effectivenessScore": 0.41,
        "calibratedEffectivenessScore": 0.38
      }
    ]
  }
}
```

---

### `gingles_results`
Lookup: `stateId + groupKey + electionId`
```json
{
  "stateId": "OR",
  "groupKey": "latino",
  "electionId": "2024_pres",
  "payload": {
    "schemaVersion": "v1",
    "chartType": "gingles-scatter",
    "state": "OR",
    "selectedGroup": "Latino",
    "electionKey": "2024_pres",
    "sampling": { "isSampled": true, "displayedPointCount": 500, "fullPrecinctCount": 3421, "targetPointCount": 500 },
    "points": [{ "precinctId": "OR-P0409", "minorityShare": 0.0, "demVoteShare": 0.49, "repVoteShare": 0.48, "totalPopulation": 1944, "minorityPopulation": 0 }],
    "regressionCurves": [
      { "key": "dem_curve", "label": "Democratic curve", "party": "DEM", "points": [{ "x": 0.0, "y": 0.35 }] },
      { "key": "rep_curve", "label": "Republican curve", "party": "REP", "points": [{ "x": 0.0, "y": 0.60 }] }
    ]
  }
}
```
When `preprocessing/output/{state}_2024_{group}_gingles_scatter.json` exists, it is loaded in preference to the mock fixture.

---

### `gingles_tables`
Lookup: `stateId + groupKey + electionId`
```json
{
  "stateId": "OR",
  "groupKey": "latino",
  "electionId": "2024_pres",
  "payload": {
    "schemaVersion": "v1",
    "chartType": "gingles-precinct-table",
    "state": "OR",
    "selectedGroup": "Latino",
    "electionKey": "2024_pres",
    "rowCount": 3421,
    "sorting": { "rowOrder": "precinctId_asc" },
    "rows": [{ "precinctId": "OR-P0538", "precinctName": "Latino Precinct 1", "totalPopulation": 2480, "minorityPopulation": 1361, "republicanVotes": 408, "democraticVotes": 1201, "minorityShare": 0.549, "repVoteShare": 0.253, "demVoteShare": 0.745 }]
  }
}
```

---

### `ei_support_results`
Lookup: `stateId + electionId + groupKey + partyKey`
```json
{
  "stateId": "OR",
  "electionId": "2024_pres",
  "groupKey": "latino",
  "partyKey": "DEM",
  "payload": {
    "schemaVersion": "v1",
    "chartType": "ei-support",
    "state": "OR",
    "election": "2024 Presidential",
    "selectedCandidate": "Hardy",
    "selectedGroup": "Latino",
    "series": [
      { "key": "latino",     "label": "Latino",     "confidenceScore": 0.82, "points": [{ "xSupportShare": 0.2, "density": 0.1 }] },
      { "key": "non_latino", "label": "Non-Latino",  "confidenceScore": 0.71, "points": [{ "xSupportShare": 0.1, "density": 0.2 }] }
    ]
  }
}
```

---

### `ei_precinct_bar_ci`
Lookup: `stateId + groupKey + electionId + partyKey`
```json
{
  "stateId": "OR",
  "groupKey": "latino",
  "electionId": "2024_pres",
  "partyKey": "DEM",
  "payload": {
    "schemaVersion": "v1",
    "chartType": "ei-precinct-bar-ci",
    "state": "OR",
    "election": "2024 Presidential",
    "selectedCandidate": "Hardy",
    "categories": [
      { "category": "Latino", "peak": 0.71, "ciLow": 0.64, "ciHigh": 0.79 },
      { "category": "White",  "peak": 0.36, "ciLow": 0.29, "ciHigh": 0.43 }
    ]
  }
}
```

---

### `ei_kde`
Lookup: `stateId + groupKey + electionId + metricKey + partyKey`
```json
{
  "stateId": "OR",
  "groupKey": "latino",
  "electionId": "2024_pres",
  "metricKey": "support_gap",
  "partyKey": "DEM",
  "payload": {
    "schemaVersion": "v1",
    "chartType": "ei-kde",
    "state": "OR",
    "selectedGroup": "Latino",
    "metricLabel": "Latino − non-Latino Dem support gap (2024 Presidential)",
    "domain": [-0.2, 0.75],
    "thresholdX": 0.25,
    "thresholdLabel": "Prob(gap > 0.25)",
    "thresholdProbability": 0.81,
    "series": [{ "key": "support_gap", "label": "Latino support gap", "points": [{ "x": -0.2, "density": 0.0 }, { "x": 0.33, "density": 1.10 }] }]
  }
}
```

---

### `ensemble_splits`
Lookup: `stateId + electionId`
```json
{
  "stateId": "OR",
  "electionId": "2024_pres",
  "payload": {
    "schemaVersion": "v1",
    "chartType": "ensemble-splits",
    "state": "OR",
    "totalDistricts": 6,
    "ensembleSize": 250,
    "election": "2024 Presidential",
    "units": { "share": "decimal_0_to_1" },
    "series": {
      "raceBlind":     [{ "splitLabel": "2R/4D", "repWins": 2, "demWins": 4, "frequency": 102, "shareOfEnsemble": 0.408 }],
      "vraConstrained":[{ "splitLabel": "2R/4D", "repWins": 2, "demWins": 4, "frequency": 116, "shareOfEnsemble": 0.464 }]
    }
  }
}
```

---

### `box_whisker_results`
Lookup: `stateId + groupKey + ensembleType + metricKey`

Valid `ensembleType` values: `race_blind`, `vra_constrained`.

```json
{
  "stateId": "OR",
  "groupKey": "latino",
  "ensembleType": "vra_constrained",
  "metricKey": "minority_share",
  "payload": {
    "schemaVersion": "v1",
    "chartType": "box-whisker",
    "state": "OR",
    "totalDistricts": 6,
    "ensembleType": "vra_constrained",
    "selectedGroup": "Latino",
    "metricLabel": "Latino CVAP share",
    "units": { "share": "decimal_0_to_1" },
    "rankSummaries": [
      { "districtRank": 1, "min": 0.07, "q1": 0.10, "median": 0.13, "q3": 0.16, "max": 0.22, "enactedValue": 0.12, "proposedValue": 0.14 }
    ]
  }
}
```

---

### `interesting_plans`
Lookup: `stateId + planId`
```json
{
  "stateId": "OR",
  "planId": "plan-42",
  "payload": {
    "schemaVersion": "v1",
    "state": "OR",
    "planId": "plan-42",
    "planName": "Oregon Opportunity Corridor",
    "ensembleType": "vra_constrained",
    "reasonInteresting": "High Latino opportunity with competitive statewide split",
    "summary": { "repWins": 2, "demWins": 4, "effectiveMinorityDistricts": 2 },
    "topology": { "type": "Topology", "objects": { "districts": { "type": "GeometryCollection", "geometries": [] } }, "arcs": [] }
  }
}
```
Topology is injected from canonical geometry assets at seed time.

---

### `vra_impact_threshold_tables`
Lookup: `stateId + groupKey + electionId`
```json
{
  "stateId": "OR",
  "groupKey": "latino",
  "electionId": "2024_pres",
  "payload": {
    "schemaVersion": "v1",
    "tableType": "vra-impact-thresholds",
    "state": "OR",
    "election": "2024 Presidential",
    "selectedGroup": "Latino",
    "populationMeasure": "CVAP",
    "rows": [
      { "metricKey": "meet_or_exceed_enacted", "metricLabel": "Meet or exceed enacted effective minority districts", "raceBlindShare": 0.21, "vraConstrainedShare": 0.74 },
      { "metricKey": "rough_proportionality",  "metricLabel": "Achieve rough proportionality relative to Latino CVAP share", "raceBlindShare": 0.28, "vraConstrainedShare": 0.78 },
      { "metricKey": "joint_satisfaction",     "metricLabel": "Satisfy both legal thresholds jointly", "raceBlindShare": 0.16, "vraConstrainedShare": 0.66 }
    ]
  }
}
```

---

### `minority_effectiveness_box_whisker`
Lookup: `stateId + electionId + ensembleType + ensembleIndex`

Each document stores **either** `raceBlindSummary` (ensembleType = `rb`) **or** `vraConstrainedSummary` (ensembleType = `vra`) per group — not both. 16 documents per deployment: 2 states × 2 ensemble types × 4 ensemble indices.

```json
{
  "stateId": "OR",
  "electionId": "2024_pres",
  "ensembleType": "rb",
  "ensembleIndex": 1,
  "payload": {
    "schemaVersion": "v1",
    "chartType": "minority-effectiveness-box-whisker",
    "state": "OR",
    "election": "2024 Presidential",
    "totalDistricts": 6,
    "units": { "count": "districts" },
    "groupSummaries": [
      { "key": "latino", "label": "Latino", "raceBlindSummary": { "min": 0, "q1": 1, "median": 1, "q3": 2, "max": 3 } },
      { "key": "asian",  "label": "Asian",  "raceBlindSummary": { "min": 0, "q1": 0, "median": 1, "q3": 1, "max": 2 } },
      { "key": "white",  "label": "White",  "raceBlindSummary": { "min": 3, "q1": 4, "median": 4, "q3": 5, "max": 6 } }
    ]
  }
}
```

---

### `minority_effectiveness_histograms`
Lookup: `stateId + groupKey + electionId`
```json
{
  "stateId": "OR",
  "groupKey": "latino",
  "electionId": "2024_pres",
  "payload": {
    "schemaVersion": "v1",
    "chartType": "minority-effectiveness-histogram",
    "state": "OR",
    "election": "2024 Presidential",
    "totalDistricts": 6,
    "selectedGroup": "Latino",
    "ensembleSize": 5000,
    "units": { "count": "plans" },
    "series": {
      "raceBlind":     [{ "effectiveDistricts": 0, "frequency": 1050 }, { "effectiveDistricts": 1, "frequency": 2400 }],
      "vraConstrained":[{ "effectiveDistricts": 1, "frequency": 1480 }, { "effectiveDistricts": 2, "frequency": 2580 }]
    }
  }
}
```

---

## 4. What the Pipeline Must Compute

### 4.1 Preprocessing → Collections

| Prepro Step | What to compute | Target collection(s) |
|-------------|----------------|----------------------|
| Prepro-1 + Prepro-3 | State populations, 2024 pres vote totals, party control, rep counts | `states`, `state_summaries` |
| Prepro-7 | Per-precinct: group share, rep/dem 2024 pres vote share, winner | `gingles_results`, `gingles_tables` |
| Prepro-7 | Per-precinct group share → bin assignment | `heatmap_bins` |
| Prepro-8 | Non-linear regression curves (logistic or best-fit) for rep and dem series | `gingles_results` (append `regressionCurves`) |
| Prepro-9 (PyEI) | Statewide EI posterior: support density by group/candidate; KDE support-gap series; peak + 95% CI per group | `ei_support_results`, `ei_precinct_bar_ci`, `ei_kde` |
| Prepro-3 | Enacted plan: rep metadata + 2024 vote totals per district | `district_tables` |
| Prepro-11 | Enacted district minority share (CVAP%) per group, ranked ascending → `enactedValue` per rank | `box_whisker_results` |
| Prepro-12 | Per-group count of effective enacted districts (`s_state ≥ 0.6`); rough proportionality ratio per group | `state_summaries` (`groupRoughProportionality` — **GAP**); `{state}_enacted_effectiveness.json` (VRA constraint floor for SeaWulf) |
| Prepro-13 (preferred) | Precinct-level EI posterior samples per (group, candidate) cell | `{state}_ei_precinct_samples.json` (file storage); input for `s_dist` in SeaWulf-14 |
| Prepro-14 (preferred) | Compressed EI distribution per cell via Becker Appendix A | `{state}_ei_precinct_samples.json` (compressed form) |
| Prepro-15 (required) | Overlap % between white group curve and each feasible group curve per candidate | Stored as `polarizedVotingPercentage` in `ei_support_results`; used for GUI-12 display and GUI-18 conditional |

### 4.2 SeaWulf → Collections

| SeaWulf Step | What to compute | Target collection(s) |
|--------------|----------------|----------------------|
| SeaWulf-5 + SeaWulf-8 | Per-plan: rep/dem vote totals per district → winner → repWins/demWins | `ensemble_splits` |
| SeaWulf-6 | Per-district per-group: `s_state` effectiveness score, `isEffective` flag | `minority_effectiveness_histograms`, `minority_effectiveness_box_whisker`, `vra_impact_threshold_tables` |
| SeaWulf-7 | Per-district per-group: minority CVAP share `[0,1]` | `box_whisker_results` |
| SeaWulf-9 | 5–10 notable plans: plan metadata + district TopoJSON | `interesting_plans` |
| SeaWulf-10 | Aggregate: split frequency tables, effective-district frequency distributions, threshold proportions | `ensemble_splits`, `minority_effectiveness_histograms`, `vra_impact_threshold_tables` |
| SeaWulf-11 | For each feasible group: rank districts by minority CVAP share across all plans, compute (min, q1, median, q3, max) at each rank | `box_whisker_results`, `minority_effectiveness_box_whisker` |

### 4.3 SeaWulf Intermediate Per-Plan Format (file storage, not MongoDB)

Written per-plan by each core during ReCom. Aggregated into DB after all plans complete.

```json
{
  "planIndex": 42,
  "ensembleType": "race_blind",
  "stateId": "OR",
  "repWins": 2,
  "demWins": 4,
  "districts": [
    {
      "districtNumber": 1,
      "demVotes": 44200,
      "repVotes": 31100,
      "winner": "Democrat",
      "groupMetrics": [
        {
          "groupKey": "latino",
          "cvapShare": 0.38,
          "sStateScore": 0.72,
          "isEffective": true
        }
      ]
    }
  ]
}
```

`ensembleType` values: `race_blind`, `vra_constrained`.

### 4.4 Prepro Input Files for SeaWulf (file storage, not MongoDB)

| File | Contents |
|------|---------|
| `{state}_precinct_graph.json` | GerryChain dual-graph (adjacency for ReCom) |
| `{state}_precinct_data.csv` | Per-precinct: GEOID, HCVAP, BCVAP, WCVAP, OCVAP, dem2024, rep2024 |
| `{state}_enacted_effectiveness.json` | Per-district `sStateScore` + `isEffective` per group for enacted plan; generated by Prepro-12; used as VRA constraint floor in SeaWulf-3 and as benchmark in GUI-20 row 1 |

---

## 5. Invariant Checklist

| Collection / Response | Invariants |
|-----------------------|-----------|
| `ensemble_splits` | `repWins + demWins = totalDistricts` per entry; `sum(frequency) = ensembleSize` per series; `splitLabel = "{repWins}R/{demWins}D"`; `shareOfEnsemble = frequency / ensembleSize` |
| `box_whisker_results` | `rankSummaries.length = totalDistricts`; `min ≤ q1 ≤ median ≤ q3 ≤ max`; all values in `[0, 1]`; `enactedValue` never null; valid `ensembleType`: `race_blind`, `vra_constrained` |
| `ei_support_results` | `xSupportShare` monotonically increasing per series; `density ≥ 0` |
| `ei_precinct_bar_ci` | `ciLow ≤ peak ≤ ciHigh`; all in `[0, 1]` |
| `ei_kde` | `x` monotonically increasing per series; `density ≥ 0`; `domain[0] ≤ thresholdX ≤ domain[1]` |
| `vra_impact_threshold_tables` | Exactly 3 rows; `metricKey ∈ {meet_or_exceed_enacted, rough_proportionality, joint_satisfaction}`; all shares in `[0, 1]` |
| `minority_effectiveness_box_whisker` | `min ≤ q1 ≤ median ≤ q3 ≤ max`; integer counts in `[0, totalDistricts]`; field names are `key` and `label` (not `groupKey`/`groupLabel`); each document has either `raceBlindSummary` or `vraConstrainedSummary` per group — not both; 16 documents total |
| `minority_effectiveness_histograms` | `sum(frequency) = ensembleSize` per series; `effectiveDistricts ∈ [0, totalDistricts]` |
| `interesting_plans` | `topology.type = "Topology"`; `summary.repWins + summary.demWins = totalDistricts`; 4 plans per state (2 per ensemble type) |
| `state_summaries` | `feasibleGroups` matches groups with seeded heatmap + analysis data; all population fields are display strings |
| `district_tables` | `effectivenessScore` and `calibratedEffectivenessScore` in `[0, 1]`; `voteMargin2024` is signed percentage |
