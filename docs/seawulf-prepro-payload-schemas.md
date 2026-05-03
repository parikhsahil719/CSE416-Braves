# SeaWulf & Preprocessing Payload Schemas

This document is frontend-first. Every field listed in an API response section is one that a React component actually reads. Fields are not included because they seem useful — they are included because removing them would break a chart, table, or map render. MongoDB schemas list the minimum needed to assemble those responses plus the lookup keys required to find the right document.

---

## 1. Core Definitions

| Term | Value |
|------|-------|
| Feasible group threshold | Statewide population ≥ 400,000 (≥ 200,000 for primarily-white states) |
| OR feasible groups | Latino, Asian, White |
| SC feasible groups | Black, Latino, White |
| Population measure | CVAP throughout (citizen voting-age population) |
| Effective district | Calibrated statewide effectiveness score (`s_state`) ≥ 0.6 |
| Rough proportionality benchmark | `floor(groupCvapShare × totalDistricts)` |
| Rough proportionality ratio (GUI-3) | `(enactedEffectiveDistricts / totalDistricts) / cvapShare` — displayed in state summary table per feasible group |
| Party of choice | Party with highest avg EI-estimated vote share in 2024 Presidential election for that group |
| Race-blind ensemble | ReCom, no minority constraints (~250 test / ~5,000 final plans) |
| VRA-constrained ensemble | ReCom using `s_state`, must meet or exceed enacted effective-district count per feasible group |
| Robust VRA-constrained ensemble | ReCom using `s_dist` (precinct-EI-based district effectiveness), must meet or exceed enacted effective-district count per feasible group |
| `s_dist` | District-level effectiveness score derived from precinct-level EI samples during ReCom; used only by Robust VRA-constrained ReCom (SeaWulf-14) |
| Effectiveness threshold variants | SeaWulf-15 generates VRA-constrained ensembles at thresholds 0.5, 0.6, and 0.7 |

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

**Component:** `StatePage`, `Simulation`, `EI` — all call `topologyToFeatureCollection(response.data, "districts")`

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

**Properties the frontend reads per feature:** `RESULT` (for party fill color), `district_number` (for highlight linking to district table).

---

### 2.3 `GET /api/states/{stateId}/state-summary` — GUI-3 (State tab)

**Component:** `StatePage` → `mergeSummaryData` → `StateData`

Note: `StatePage` calls `/state-summary`, **not** `/summary`. These are the only fields `mergeSummaryData` overwrites from local data.

```json
{
  "population": "4,272,371",
  "voterDistributionDem": "1,228,410 (55.6%)",
  "voterDistributionRep": "910,702 (41.3%)",
  "partyControl": "Democrat",
  "democratReps": 5,
  "republicanReps": 1,
  "groupRoughProportionality": [
    {
      "groupKey": "latino",
      "label": "Latino",
      "enactedEffectiveDistricts": 1,
      "cvapShare": 0.12,
      "roughProportionalityRatio": 1.39
    },
    {
      "groupKey": "asian",
      "label": "Asian",
      "enactedEffectiveDistricts": 0,
      "cvapShare": 0.05,
      "roughProportionalityRatio": 0.0
    }
  ]
}
```

`groupRoughProportionality` covers all feasible groups for the state. `roughProportionalityRatio = (enactedEffectiveDistricts / totalDistricts) / cvapShare`; a value of 1.0 means exactly proportional. `enactedEffectiveDistricts` is the count of enacted plan districts where `s_state ≥ 0.6` for that group.

---

### 2.4 `GET /api/states/{stateId}/ensembles-summary` — GUI-3 (Ensembles tab)

**Component:** `StatePage` → `EnsembleData`

```json
{
  "finalPlanCount": 5000,
  "populationEqualityThreshold": "1%"
}
```

---

### 2.5 `GET /api/states/{stateId}/precincts/topology` — GUI-4 geometry

**Component:** `MinorityHeatMap`

Same TopoJSON structure as §2.2 but for the `precincts` object key. The only property the frontend needs per precinct feature is `GEOID` (used to look up bin assignment from the heatmap bins response).

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

```json
{
  "group": "Latino",
  "binUnit": "percent",
  "bins": [
    { "min": 0,  "max": 10, "color": "#f7fcb9" },
    { "min": 10, "max": 20, "color": "#d9f0a3" },
    { "min": 20, "max": 30, "color": "#addd8e" }
  ],
  "precinctGroupShareByGeoid": {
    "41051001": 0.08,
    "41051002": 0.23
  }
}
```

`bins` must only include bins where at least one precinct falls (empty bins omitted per GUI-4 spec). `precinctGroupShareByGeoid` maps `GEOID → cvapShare [0,1]` for every precinct in the state — the component looks up each precinct's share to assign a bin color.

---

### 2.7 `GET /api/states/{stateId}/districts/enacted/table?election=&group=` — GUI-6

**Component:** `StatePage` → `DistrictData`

`group=` selects the feasible group for effectiveness columns (e.g., `group=latino`). When omitted, effectiveness fields are null.

```json
{
  "districts": [
    {
      "districtNumber": 1,
      "representative": "Suzanne Bonamici",
      "party": "Democrat",
      "racialEthnicGroup": "White",
      "voteMargin2024": 24.1,
      "effectivenessScore": 0.65,
      "calibratedEffectivenessScore": 0.72
    }
  ]
}
```

`voteMargin2024` is `(demVotes − repVotes) / totalVotes × 100`. Positive = Democratic margin, negative = Republican. The `VoteMarginBadge` component formats it as `D+24.1%` or `R+5.2%`.

`effectivenessScore` is the raw (uncalibrated) district effectiveness score for the selected group. `calibratedEffectivenessScore` is the `s_state` calibrated statewide score (threshold ≥ 0.6). Both are `null` when no `group=` is supplied.

---

### 2.8 `GET /api/states/{stateId}/analysis/gingles?group=&election=` — GUI-9

**Component:** `Gingles` → `GinglesScatterChart`

```json
{
  "electionKey": "2024_pres",
  "electionLabel": "2024 Presidential",
  "selectedGroup": "Latino",
  "sampling": {
    "isSampled": true,
    "samplingAuthority": "preprocessing",
    "samplingMethod": "minority_share_binned_random_seed_42_40_bins",
    "displayedPointCount": 500,
    "fullPrecinctCount": 1298,
    "targetPointCount": 500
  },
  "points": [
    {
      "precinctId": "41051001",
      "minorityShare": 0.12,
      "demVoteShare": 0.61,
      "repVoteShare": 0.35,
      "totalPopulation": 1820,
      "minorityPopulation": 218
    }
  ],
  "regressionCurves": [
    {
      "key": "dem_curve",
      "label": "Democratic trend",
      "party": "DEM",
      "points": [
        { "x": 0.0, "y": 0.38 },
        { "x": 0.5, "y": 0.62 },
        { "x": 1.0, "y": 0.85 }
      ]
    },
    {
      "key": "rep_curve",
      "label": "Republican trend",
      "party": "REP",
      "points": [
        { "x": 0.0, "y": 0.59 },
        { "x": 0.5, "y": 0.34 },
        { "x": 1.0, "y": 0.12 }
      ]
    }
  ]
}
```

**Fields the chart reads:**
- `points[].minorityShare` → x-axis for both scatter series
- `points[].demVoteShare` / `repVoteShare` → y-axis per scatter series
- `points[].precinctId`, `totalPopulation`, `minorityPopulation` → tooltip
- `sampling.displayedPointCount` / `sampling.fullPrecinctCount` → optional chart copy about sampled vs full precinct count
- `regressionCurves[].key` → `dataKey` for each `<Line>`
- `regressionCurves[].label` → legend name
- `regressionCurves[].party` → stroke color (`DEM` = `#2563eb`, else `#dc2626`)
- `regressionCurves[].points[].x` / `.y` → curve data
- `selectedGroup` → x-axis label text

---

### 2.9 `GET /api/states/{stateId}/analysis/gingles/table?group=&election=` — GUI-10

**Component:** `Gingles` → table rows

```json
{
  "electionKey": "2024_pres",
  "electionLabel": "2024 Presidential",
  "rowCount": 1298,
  "sorting": { "rowOrder": "precinctId_asc" },
  "rows": [
    {
      "precinctId": "41051001",
      "precinctName": "Portland 1",
      "totalPopulation": 1820,
      "minorityPopulation": 218,
      "repVoteShare": 0.50,
      "demVoteShare": 0.46
    }
  ]
}
```

---

### 2.10 `GET /api/states/{stateId}/analysis/ei-support?groups=&election=&party=` — GUI-12

**Components:** `EI` → `EiAnalysisPanel` → `EiSupportChart`, `StateMinorityAnalysis` → `EiSupportChart`

```json
{
  "selectedCandidate": "Democrat",
  "series": [
    {
      "key": "latino",
      "label": "Latino",
      "points": [
        { "xSupportShare": 0.20, "density": 0.12 },
        { "xSupportShare": 0.75, "density": 1.84 }
      ]
    },
    {
      "key": "non_latino",
      "label": "Non-Latino",
      "points": [
        { "xSupportShare": 0.15, "density": 0.30 },
        { "xSupportShare": 0.42, "density": 2.10 }
      ]
    }
  ]
}
```

**Fields the chart reads:**
- `selectedCandidate` → chart title `"Support for {selectedCandidate}"`
- `series[].key` → `dataKey` for each `<Area>` in the flattened data map
- `series[].label` → legend name
- `series[].points[].xSupportShare` → x-axis (merged across series into one table by `flattenSeries`)
- `series[].points[].density` → y-axis value for that series at that x position

`xSupportShare` values must be monotonically increasing within each series; `density ≥ 0`.

---

### 2.11 `GET /api/states/{stateId}/analysis/ei-precinct-bar-ci?group=&election=&party=` — GUI-13

**Component:** `EI` → `EiBarPanel`

```json
{
  "selectedCandidate": "Democrat",
  "election": "2024 Presidential",
  "categories": [
    { "category": "Latino", "peak": 0.71, "ciLow": 0.64, "ciHigh": 0.79 },
    { "category": "Asian",  "peak": 0.68, "ciLow": 0.58, "ciHigh": 0.76 },
    { "category": "White",  "peak": 0.42, "ciLow": 0.38, "ciHigh": 0.47 }
  ]
}
```

**Fields the chart reads:**
- `selectedCandidate` → title `"Support for {selectedCandidate}"`
- `election` → subtitle
- `categories[].category` → x-axis label
- `categories[].peak` → bar height (dataKey `peak`)
- `categories[].ciLow`, `ciHigh` → `ErrorBar` via `ciError: [peak - ciLow, ciHigh - peak]`

Invariant: `ciLow ≤ peak ≤ ciHigh`, all in `[0, 1]`.

---

### 2.12 `GET /api/states/{stateId}/analysis/ei-kde?group=&election=&metric=` — GUI-15

**Component:** `EI` → `EiKdePanel`

```json
{
  "metricLabel": "Support gap (Latino − non-Latino)",
  "thresholdX": 0.0,
  "thresholdLabel": "P(gap > 0)",
  "thresholdProbability": 0.84,
  "domain": [-0.4, 0.8],
  "series": [
    {
      "label": "Support gap",
      "points": [
        { "x": -0.30, "density": 0.05 },
        { "x": 0.00,  "density": 0.20 },
        { "x": 0.33,  "density": 1.10 }
      ]
    }
  ]
}
```

**Fields the chart reads:**
- `metricLabel` → title
- `thresholdProbability` → subtitle percentage display
- `thresholdLabel` → subtitle label text
- `thresholdX` → `<ReferenceLine x={...}>` position
- `domain` → `<XAxis domain={...}>`
- `series[0].points[].x` / `.density` → chart data (sorted ascending by x)
- `series[0].label` → `<Area name={...}>` fallback label

`x` values must be monotonically increasing; `density ≥ 0`.

---

### 2.13 `GET /api/states/{stateId}/ensembles/splits` — GUI-16

**Components:** `Simulation` → `EnsembleSplits`, `VRAAnalysis` → `SingleEnsembleSplitsChart`

```json
{
  "totalDistricts": 6,
  "ensembleSize": 5000,
  "series": {
    "raceBlind": [
      { "splitLabel": "2R/4D", "repWins": 2, "demWins": 4, "frequency": 2840, "shareOfEnsemble": 0.568 },
      { "splitLabel": "3R/3D", "repWins": 3, "demWins": 3, "frequency": 1750, "shareOfEnsemble": 0.350 }
    ],
    "vraConstrained": [
      { "splitLabel": "1R/5D", "repWins": 1, "demWins": 5, "frequency": 890,  "shareOfEnsemble": 0.178 },
      { "splitLabel": "2R/4D", "repWins": 2, "demWins": 4, "frequency": 3210, "shareOfEnsemble": 0.642 }
    ],
    "robustVraConstrained": [
      { "splitLabel": "1R/5D", "repWins": 1, "demWins": 5, "frequency": 950,  "shareOfEnsemble": 0.190 },
      { "splitLabel": "2R/4D", "repWins": 2, "demWins": 4, "frequency": 3300, "shareOfEnsemble": 0.660 }
    ]
  }
}
```

**Fields the components read:**
- `series.raceBlind[].splitLabel` → `XAxis dataKey` in both `EnsembleSplits` and `SingleEnsembleSplitsChart`
- `series.raceBlind[].frequency` → `Bar dataKey`
- `series.raceBlind[].shareOfEnsemble`, `.repWins`, `.demWins` → tooltip
- `totalDistricts` → `SingleEnsembleSplitsChart` meta display
- `ensembleSize` → `SingleEnsembleSplitsChart` meta display

`robustVraConstrained` is present only when SeaWulf-14 has been run (GUI-24); omit the key entirely if no robust ensemble exists. `splitLabel` format: `"{repWins}R/{demWins}D"`. Omit splits where frequency = 0 in **all** present series (GUI-16: tails omitted). Invariant: `repWins + demWins = totalDistricts`; frequencies in each series sum to `ensembleSize`.

---

### 2.14 `GET /api/states/{stateId}/ensembles/box-whisker?group=&ensembleType=&metric=` — GUI-17

**Component:** `Simulation` → `BoxWhisker` → `BoxWhiskerChart` → `BoxWhiskerSvg`

The frontend makes two (or three for GUI-24) separate calls: `ensembleType=race_blind`, `ensembleType=vra_constrained`, and optionally `ensembleType=robust_vra_constrained`, all with `metric=minority_share`.

```json
{
  "metricLabel": "Latino Minority Share",
  "rankSummaries": [
    {
      "districtRank": 1,
      "min": 0.01, "q1": 0.02, "median": 0.03, "q3": 0.05, "max": 0.09,
      "enactedValue": 0.025,
      "proposedValue": null
    },
    {
      "districtRank": 2,
      "min": 0.04, "q1": 0.07, "median": 0.09, "q3": 0.12, "max": 0.19,
      "enactedValue": 0.07,
      "proposedValue": null
    }
  ]
}
```

**Fields the SVG reads per row:**
- `districtRank` → x-axis label
- `min`, `max` → whisker endpoints
- `q1`, `q3` → box top/bottom
- `median` → median line
- `enactedValue` → red dot (always present; never null)
- `proposedValue` → yellow diamond (rendered only when non-null)
- `metricLabel` → `BoxWhiskerChart` title when `showHeader=true`

Invariants: `rankSummaries.length = totalDistricts`; `min ≤ q1 ≤ median ≤ q3 ≤ max`; all values in `[0, 1]`.

---

### 2.15 `GET /api/states/{stateId}/districts/interesting/list` — GUI-19 plan selector

**Component:** `Compare` (plan selector dropdown)

Returns an array of all interesting plans for the state. Each element has the same shape as the single-plan response below (§2.15b), including full `topology`. Use this endpoint to populate the plan selector; then fetch a specific plan via `?planId=`.

```json
[
  {
    "planId": "plan-42",
    "planName": "Oregon Opportunity Corridor",
    "ensembleType": "vra_constrained",
    "reasonInteresting": "Maximum effective minority districts",
    "summary": {
      "repWins": 2,
      "demWins": 4,
      "effectiveMinorityDistricts": 3
    },
    "topology": {
      "type": "Topology",
      "objects": {
        "districts": {
          "type": "GeometryCollection",
          "geometries": []
        }
      },
      "arcs": [],
      "bbox": [-124.6, 41.9, -116.5, 46.3]
    }
  },
  {
    "planId": "plan-43",
    "planName": "Oregon Race-Blind Baseline",
    "ensembleType": "race_blind",
    "reasonInteresting": "Race-blind baseline for comparison",
    "summary": {
      "repWins": 3,
      "demWins": 3,
      "effectiveMinorityDistricts": 1
    },
    "topology": {
      "type": "Topology",
      "objects": {
        "districts": {
          "type": "GeometryCollection",
          "geometries": []
        }
      },
      "arcs": [],
      "bbox": [-124.6, 41.9, -116.5, 46.3]
    }
  }
]
```

Invariants per element: `topology.type = "Topology"`; `summary.repWins + summary.demWins = totalDistricts`. Returns an empty array `[]` when no plans are seeded for the state.

---

### 2.15b `GET /api/states/{stateId}/districts/interesting?planId=` — GUI-19

**Component:** `InterestingMap`

```json
{
  "planId": "plan-042",
  "planName": "Oregon Opportunity Corridor",
  "ensembleType": "race_blind",
  "reasonInteresting": "Maximum effective minority districts",
  "summary": {
    "repWins": 2,
    "demWins": 4,
    "effectiveMinorityDistricts": 3
  },
  "topology": {
    "type": "Topology",
    "objects": {
      "districts": {
        "type": "GeometryCollection",
        "geometries": []
      }
    },
    "arcs": [],
    "bbox": [-124.6, 41.9, -116.5, 46.3]
  }
}
```

`topology.type` must equal `"Topology"`. `summary.repWins + summary.demWins = totalDistricts`.

---

### 2.16 `GET /api/states/{stateId}/analysis/vra-impact-thresholds?group=&election=` — GUI-20

**Component:** `Simulation` → `VRAImpact`

```json
{
  "rows": [
    {
      "metricKey": "meet_or_exceed_enacted",
      "metricLabel": "Meet or exceed enacted effective minority districts",
      "raceBlindShare": 0.18,
      "vraConstrainedShare": 0.67,
      "robustVraConstrainedShare": 0.75
    },
    {
      "metricKey": "rough_proportionality",
      "metricLabel": "Achieve rough proportionality relative to minority CVAP share",
      "raceBlindShare": 0.22,
      "vraConstrainedShare": 0.71,
      "robustVraConstrainedShare": 0.78
    },
    {
      "metricKey": "meet_both",
      "metricLabel": "Satisfy both legal thresholds jointly",
      "raceBlindShare": 0.14,
      "vraConstrainedShare": 0.61,
      "robustVraConstrainedShare": 0.69
    }
  ]
}
```

**Fields the component reads:**
- `rows[].metricKey` → React key prop
- `rows[].metricLabel` → first column cell
- `rows[].raceBlindShare` → second column cell (formatted via `pct()`)
- `rows[].vraConstrainedShare` → third column cell
- `rows[].robustVraConstrainedShare` → fourth column cell (GUI-24 only; `null` when SeaWulf-14 has not been run)

Always exactly 3 rows. Shares in `[0, 1]`.

---

### 2.17 `GET /api/states/{stateId}/analysis/minority-effectiveness/box-whisker?election=` — GUI-21

**Component:** `Simulation` → `MinorityEffectivenessBoxWhisker`

```json
{
  "totalDistricts": 6,
  "groupSummaries": [
    {
      "key": "latino",
      "label": "Latino",
      "raceBlindSummary":            { "min": 0, "q1": 0, "median": 1, "q3": 1, "max": 2 },
      "vraConstrainedSummary":       { "min": 1, "q1": 1, "median": 2, "q3": 2, "max": 3 },
      "robustVraConstrainedSummary": { "min": 1, "q1": 2, "median": 2, "q3": 3, "max": 3 }
    },
    {
      "key": "asian",
      "label": "Asian",
      "raceBlindSummary":            { "min": 0, "q1": 0, "median": 0, "q3": 1, "max": 1 },
      "vraConstrainedSummary":       { "min": 0, "q1": 1, "median": 1, "q3": 1, "max": 2 },
      "robustVraConstrainedSummary": { "min": 0, "q1": 1, "median": 1, "q3": 2, "max": 2 }
    }
  ]
}
```

**Field names are `key` and `label` — not `groupKey`/`groupLabel`.** The SVG reads `g.key` and `g.label` directly.

- `totalDistricts` → y-axis scale denominator (`yScale = v / totalDistricts * innerHeight`)
- `groupSummaries[].key` → React key
- `groupSummaries[].label` → x-axis group label
- `{min, q1, median, q3, max}` → box/whisker rendering for each ensemble
- `robustVraConstrainedSummary` → present only when SeaWulf-14 has been run (GUI-24); omit the key entirely if no robust ensemble exists

All values are integer district counts in `[0, totalDistricts]`. Invariant: `min ≤ q1 ≤ median ≤ q3 ≤ max`.

---

### 2.18 `GET /api/states/{stateId}/analysis/minority-effectiveness/histogram?group=&election=` — GUI-22

**Component:** `Simulation` → `MinorityEffectivenessHistogram`

```json
{
  "series": {
    "raceBlind": [
      { "effectiveDistricts": 0, "frequency": 1042 },
      { "effectiveDistricts": 1, "frequency": 2418 },
      { "effectiveDistricts": 2, "frequency": 1280 }
    ],
    "vraConstrained": [
      { "effectiveDistricts": 1, "frequency": 212  },
      { "effectiveDistricts": 2, "frequency": 2579 },
      { "effectiveDistricts": 3, "frequency": 2209 }
    ],
    "robustVraConstrained": [
      { "effectiveDistricts": 2, "frequency": 1800 },
      { "effectiveDistricts": 3, "frequency": 2600 },
      { "effectiveDistricts": 4, "frequency": 600  }
    ]
  }
}
```

**Fields the chart reads:**
- `series.raceBlind[].effectiveDistricts` → merged x-axis values (set union across all present series)
- `series.raceBlind[].frequency` → `raceBlind` bar height
- `series.vraConstrained[].effectiveDistricts` → same
- `series.vraConstrained[].frequency` → `vraConstrained` bar height
- `series.robustVraConstrained[].effectiveDistricts` / `.frequency` → `robustVraConstrained` bar height (GUI-24 only)

`robustVraConstrained` is present only when SeaWulf-14 has been run (GUI-24); omit the key entirely if no robust ensemble exists. Missing values are filled with 0 by the component. Frequencies in each series must sum to `ensembleSize`.

---

## 3. MongoDB Collection Schemas

Only fields needed to assemble the API responses above, plus lookup keys. Metadata fields like `schemaVersion` and `createdAt` are internal; they are not returned to the frontend and can be added to any document without affecting the contract.

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
  "population": "4,272,371",
  "voterDistributionDem": "1,228,410 (55.6%)",
  "voterDistributionRep": "910,702 (41.3%)",
  "partyControl": "Democrat",
  "democratReps": 5,
  "republicanReps": 1,
  "finalPlanCount": 5000,
  "populationEqualityThreshold": "1%",
  "groupRoughProportionality": [
    {
      "groupKey": "latino",
      "label": "Latino",
      "enactedEffectiveDistricts": 1,
      "cvapShare": 0.12,
      "roughProportionalityRatio": 1.39
    }
  ]
}
```
The backend splits this into two responses: `/state-summary` returns all fields except `finalPlanCount` and `populationEqualityThreshold`; `/ensembles-summary` returns `finalPlanCount` and `populationEqualityThreshold`. `groupRoughProportionality` is included in the `/state-summary` response. Computed from `Prepro-11` + `Prepro-12` enacted effectiveness data.

---

### `heatmap_bins`
Lookup: `stateId + groupKey`
```json
{
  "stateId": "OR",
  "groupKey": "latino",
  "group": "Latino",
  "binUnit": "percent",
  "bins": [
    { "min": 0, "max": 10, "color": "#f7fcb9" }
  ],
  "precinctGroupShareByGeoid": {
    "41051001": 0.08,
    "41051002": 0.23
  }
}
```
Store only non-empty bins. `precinctGroupShareByGeoid` covers every precinct GEOID for the state.

---

### `district_tables`
Lookup: `stateId + electionId + groupKey`

`groupKey` may be omitted for the base record (no effectiveness columns); a per-group record is stored for each feasible group.

```json
{
  "stateId": "OR",
  "electionId": "2024_pres",
  "groupKey": "latino",
  "districts": [
    {
      "districtNumber": 1,
      "representative": "Suzanne Bonamici",
      "party": "Democrat",
      "racialEthnicGroup": "White",
      "voteMargin2024": 24.1,
      "effectivenessScore": 0.65,
      "calibratedEffectivenessScore": 0.72
    }
  ]
}
```

`effectivenessScore` is the raw district effectiveness score for `groupKey`; `calibratedEffectivenessScore` is `s_state`. Both are sourced from `Prepro-11` (enacted district scores). When `groupKey` is absent, those two fields are omitted and the record serves requests that supply no `group=` query param.

---

### `gingles_results`
Lookup: `stateId + groupKey + electionId`
```json
{
  "stateId": "OR",
  "groupKey": "latino",
  "electionId": "2024_pres",
  "documentType": "gingles_chart",
  "provenance": { "sourceType": "preprocessing_export" },
  "internal": { "regressionModels": [] },
  "payload": {
    "selectedGroup": "Latino",
    "electionKey": "2024_pres",
    "electionLabel": "2024 Presidential",
    "sampling": { "displayedPointCount": 500, "targetPointCount": 500 },
    "points": [
    {
      "precinctId": "41051001",
      "minorityShare": 0.12,
      "demVoteShare": 0.61,
      "repVoteShare": 0.35,
      "totalPopulation": 1820,
      "minorityPopulation": 218
    }
    ],
    "regressionCurves": [
    {
      "key": "dem_curve",
      "label": "Democratic trend",
      "party": "DEM",
      "points": [{ "x": 0.0, "y": 0.38 }, { "x": 1.0, "y": 0.85 }]
    },
    {
      "key": "rep_curve",
      "label": "Republican trend",
      "party": "REP",
      "points": [{ "x": 0.0, "y": 0.59 }, { "x": 1.0, "y": 0.12 }]
    }
    ]
  }
}
```

---

### `gingles_tables`
Lookup: `stateId + groupKey + electionId`
```json
{
  "stateId": "OR",
  "groupKey": "latino",
  "electionId": "2024_pres",
  "documentType": "gingles_table",
  "provenance": { "sourceType": "preprocessing_export" },
  "payload": {
    "electionKey": "2024_pres",
    "electionLabel": "2024 Presidential",
    "rowCount": 1298,
    "sorting": { "rowOrder": "precinctId_asc" },
    "rows": [
    {
      "precinctId": "41051001",
      "precinctName": "Portland 1",
      "totalPopulation": 1820,
      "minorityPopulation": 218,
      "repVoteShare": 0.50,
      "demVoteShare": 0.46
    }
    ]
  }
}
```

---

### `ei_support_results`
Lookup: `stateId + electionId + groupKey`
```json
{
  "stateId": "OR",
  "electionId": "2024_pres",
  "groupKey": "latino",
  "partyKey": "dem",
  "selectedCandidate": "Democrat",
  "series": [
    {
      "key": "latino",
      "label": "Latino",
      "points": [{ "xSupportShare": 0.20, "density": 0.12 }]
    },
    {
      "key": "non_latino",
      "label": "Non-Latino",
      "points": [{ "xSupportShare": 0.15, "density": 0.30 }]
    }
  ]
}
```

---

### `ei_precinct_bar_ci_results`
Lookup: `stateId + groupKey + electionId + partyKey`
```json
{
  "stateId": "OR",
  "groupKey": "latino",
  "electionId": "2024_pres",
  "partyKey": "dem",
  "selectedCandidate": "Democrat",
  "election": "2024 Presidential",
  "categories": [
    { "category": "Latino", "peak": 0.71, "ciLow": 0.64, "ciHigh": 0.79 },
    { "category": "Asian",  "peak": 0.68, "ciLow": 0.58, "ciHigh": 0.76 },
    { "category": "White",  "peak": 0.42, "ciLow": 0.38, "ciHigh": 0.47 }
  ]
}
```

---

### `ei_kde_results`
Lookup: `stateId + groupKey + electionId + metricKey`
```json
{
  "stateId": "OR",
  "groupKey": "latino",
  "electionId": "2024_pres",
  "metricKey": "support_gap",
  "metricLabel": "Support gap (Latino − non-Latino)",
  "thresholdX": 0.0,
  "thresholdLabel": "P(gap > 0)",
  "thresholdProbability": 0.84,
  "domain": [-0.4, 0.8],
  "series": [
    {
      "label": "Support gap",
      "points": [
        { "x": -0.30, "density": 0.05 },
        { "x": 0.00,  "density": 0.20 },
        { "x": 0.33,  "density": 1.10 }
      ]
    }
  ]
}
```

---

### `ensemble_splits`
Lookup: `stateId + electionId`
```json
{
  "stateId": "OR",
  "electionId": "2024_pres",
  "totalDistricts": 6,
  "ensembleSize": 5000,
  "series": {
    "raceBlind": [
      { "splitLabel": "2R/4D", "repWins": 2, "demWins": 4, "frequency": 2840, "shareOfEnsemble": 0.568 }
    ],
    "vraConstrained": [
      { "splitLabel": "2R/4D", "repWins": 2, "demWins": 4, "frequency": 3210, "shareOfEnsemble": 0.642 }
    ],
    "robustVraConstrained": [
      { "splitLabel": "2R/4D", "repWins": 2, "demWins": 4, "frequency": 3300, "shareOfEnsemble": 0.660 }
    ]
  }
}
```
`splitLabel` is precomputed as `"{repWins}R/{demWins}D"`. Omit splits where frequency = 0 in all present series. `robustVraConstrained` is populated by SeaWulf-14; omit the key entirely if that run has not completed.

---

### `box_whisker_results`
Lookup: `stateId + groupKey + ensembleType + metricKey`

`metricKey` = `minority_share` (the only metric the frontend currently requests). Valid `ensembleType` values: `race_blind`, `vra_constrained`, `robust_vra_constrained` (the last populated by SeaWulf-14).

```json
{
  "stateId": "OR",
  "groupKey": "latino",
  "ensembleType": "vra_constrained",
  "metricKey": "minority_share",
  "metricLabel": "Latino Minority Share",
  "rankSummaries": [
    {
      "districtRank": 1,
      "min": 0.01, "q1": 0.02, "median": 0.03, "q3": 0.05, "max": 0.09,
      "enactedValue": 0.025,
      "proposedValue": null
    }
  ]
}
```

---

### `interesting_plans`
Lookup: `stateId + planId`
```json
{
  "stateId": "OR",
  "planId": "plan-042",
  "planName": "Oregon Opportunity Corridor",
  "ensembleType": "race_blind",
  "reasonInteresting": "Maximum effective minority districts",
  "summary": {
    "repWins": 2,
    "demWins": 4,
    "effectiveMinorityDistricts": 3
  },
  "topology": {
    "type": "Topology",
    "objects": { "districts": { "type": "GeometryCollection", "geometries": [] } },
    "arcs": [],
    "bbox": [-124.6, 41.9, -116.5, 46.3]
  }
}
```

---

### `vra_impact_threshold_tables`
Lookup: `stateId + groupKey + electionId`
```json
{
  "stateId": "OR",
  "groupKey": "latino",
  "electionId": "2024_pres",
  "rows": [
    {
      "metricKey": "meet_or_exceed_enacted",
      "metricLabel": "Meet or exceed enacted effective minority districts",
      "raceBlindShare": 0.18,
      "vraConstrainedShare": 0.67,
      "robustVraConstrainedShare": 0.75
    },
    {
      "metricKey": "rough_proportionality",
      "metricLabel": "Achieve rough proportionality relative to minority CVAP share",
      "raceBlindShare": 0.22,
      "vraConstrainedShare": 0.71,
      "robustVraConstrainedShare": 0.78
    },
    {
      "metricKey": "meet_both",
      "metricLabel": "Satisfy both legal thresholds jointly",
      "raceBlindShare": 0.14,
      "vraConstrainedShare": 0.61,
      "robustVraConstrainedShare": 0.69
    }
  ]
}
```
`robustVraConstrainedShare` is populated by SeaWulf-14; store as `null` until that run completes.

---

### `minority_effectiveness_box_whisker`
Lookup: `stateId + electionId`
```json
{
  "stateId": "OR",
  "electionId": "2024_pres",
  "totalDistricts": 6,
  "groupSummaries": [
    {
      "key": "latino",
      "label": "Latino",
      "raceBlindSummary":            { "min": 0, "q1": 0, "median": 1, "q3": 1, "max": 2 },
      "vraConstrainedSummary":       { "min": 1, "q1": 1, "median": 2, "q3": 2, "max": 3 },
      "robustVraConstrainedSummary": { "min": 1, "q1": 2, "median": 2, "q3": 3, "max": 3 }
    }
  ]
}
```
`key` and `label` — not `groupKey`/`groupLabel`. The SVG renders directly from these field names. `robustVraConstrainedSummary` is populated by SeaWulf-14; omit the key entirely if that run has not completed.

---

### `minority_effectiveness_histograms`
Lookup: `stateId + groupKey + electionId`
```json
{
  "stateId": "OR",
  "groupKey": "latino",
  "electionId": "2024_pres",
  "series": {
    "raceBlind": [
      { "effectiveDistricts": 0, "frequency": 1042 },
      { "effectiveDistricts": 1, "frequency": 2418 }
    ],
    "vraConstrained": [
      { "effectiveDistricts": 2, "frequency": 2579 },
      { "effectiveDistricts": 3, "frequency": 2209 }
    ],
    "robustVraConstrained": [
      { "effectiveDistricts": 2, "frequency": 1800 },
      { "effectiveDistricts": 3, "frequency": 2600 },
      { "effectiveDistricts": 4, "frequency": 600  }
    ]
  }
}
```
`robustVraConstrained` is populated by SeaWulf-14; omit the key entirely if that run has not completed.

---

## 4. What the Pipeline Must Compute

### 4.1 Preprocessing → Collections

| Prepro Step | What to compute | Target collection(s) |
|-------------|----------------|----------------------|
| Prepro-1 + Prepro-3 | State populations, 2024 pres vote totals, party control, rep counts | `states`, `state_summaries` |
| Prepro-7 | Per-precinct: CVAP share by group, rep/dem 2024 pres vote share | `heatmap_bins`, `gingles_results`, `gingles_tables` |
| Prepro-8 | Non-linear regression curves (logistic or best-fit) per group for rep and dem series | `gingles_results` (append `regressionCurves`) |
| Prepro-9 (PyEI) | Statewide EI posterior: support density by group/candidate; KDE support-gap series; peak + 95% CI per group | `ei_support_results`, `ei_precinct_bar_ci_results`, `ei_kde_results` |
| Prepro-3 | Enacted plan: rep metadata + 2024 vote totals per district | `district_tables` |
| Prepro-11 | Enacted district minority share (CVAP%) per group, ranked ascending | `box_whisker_results` (sets `enactedValue` per rank) |
| Prepro-12 | Per-group count of effective enacted districts (`s_state ≥ 0.6`); rough proportionality ratio per group | `state_summaries` (`groupRoughProportionality`); `{state}_enacted_effectiveness.json` (SeaWulf VRA constraint floor) |
| Prepro-13 (PyEI, preferred) | Precinct-level EI posterior samples per (group, candidate) cell | `{state}_ei_precinct_samples.json` (file storage); input to SeaWulf-14 `s_dist` computation |
| Prepro-14 (preferred) | Compressed EI probability distribution per precinct per (group, candidate) cell via Appendix A of Becker paper | `{state}_ei_precinct_samples.json` (9-value histogram per cell, compressed form of Prepro-13 output) |

### 4.2 SeaWulf → Collections

| SeaWulf Step | What to compute | Target collection(s) |
|--------------|----------------|----------------------|
| SeaWulf-5 + SeaWulf-8 | Per-plan: rep/dem vote totals per district → winner → repWins/demWins | `ensemble_splits` |
| SeaWulf-6 | Per-district per-group: `s_state` calibrated effectiveness score, `isEffective` (`≥ 0.6`) | `minority_effectiveness_histograms`, `minority_effectiveness_box_whisker`, `vra_impact_threshold_tables` |
| SeaWulf-7 | Per-district per-group: minority CVAP share `[0,1]` | `box_whisker_results` |
| SeaWulf-9 | 5–10 notable plans: plan metadata + full district TopoJSON | `interesting_plans` |
| SeaWulf-10 | Aggregate: split frequency tables, effective-district frequency distributions, threshold proportions | `ensemble_splits`, `minority_effectiveness_histograms`, `vra_impact_threshold_tables` |
| SeaWulf-11 | For each feasible group: rank districts by minority CVAP share across all plans, compute (min, q1, median, q3, max) at each rank position | `box_whisker_results`, `minority_effectiveness_box_whisker` |
| SeaWulf-14 (preferred) | Robust VRA-constrained ReCom using `s_dist` (from `{state}_ei_precinct_samples.json`) for per-district effectiveness during generation; produces `robust_vra_constrained` ensemble | `ensemble_splits` (`robustVraConstrained` series), `minority_effectiveness_histograms` (`robustVraConstrained` series), `minority_effectiveness_box_whisker` (`robustVraConstrainedSummary`), `vra_impact_threshold_tables` (`robustVraConstrainedShare`), `box_whisker_results` (`ensembleType=robust_vra_constrained`) |
| SeaWulf-15 (preferred) | VRA-constrained ReCom at thresholds 0.5, 0.6, and 0.7; each threshold is a separate ensemble run | Stored with `ensembleType` values `vra_constrained_0.5`, `vra_constrained_0.6`, `vra_constrained_0.7` in the same collections as SeaWulf-6/10/11; GUI integration defined by GUI-24 extension |

### 4.3 SeaWulf Intermediate Per-Plan Format (file storage, not MongoDB)

Written per-plan to shared file storage by each core during the ReCom run. Aggregated into DB after all plans complete. Not stored in MongoDB as full records.

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
          "sDistScore": 0.68,
          "isEffective": true
        }
      ]
    }
  ]
}
```

`ensembleType` values: `race_blind`, `vra_constrained`, `robust_vra_constrained`, `vra_constrained_0.5`, `vra_constrained_0.6`, `vra_constrained_0.7`. `sDistScore` is present only for `robust_vra_constrained` plans (requires `{state}_ei_precinct_samples.json` from Prepro-13/14); omit for other ensemble types.

### 4.4 Prepro Input Files for SeaWulf (file storage, not MongoDB)

| File | Contents |
|------|---------|
| `{state}_precinct_graph.json` | GerryChain dual-graph (adjacency for ReCom) |
| `{state}_precinct_data.csv` | Per-precinct: GEOID, HCVAP, BCVAP, WCVAP, OCVAP, dem2024, rep2024 |
| `{state}_ei_precinct_samples.json` | Per-precinct 9-value compressed EI histogram per (group, candidate) cell — generated by Prepro-13 (full PyEI posterior) then compressed per Prepro-14 (Becker Appendix A); enables fast `s_dist` computation during SeaWulf-14 ReCom |
| `{state}_enacted_effectiveness.json` | Per-district `sStateScore` + `isEffective` per group for enacted plan; generated by Prepro-12; used as VRA constraint floor in SeaWulf-3 and as benchmark in GUI-20 row 1 |

---

## 5. Invariant Checklist

| Collection / Response | Invariants |
|-----------------------|-----------|
| `ensemble_splits` | `repWins + demWins = totalDistricts` per bucket; `sum(frequency) = ensembleSize` per series; `splitLabel = "{repWins}R/{demWins}D"`; `robustVraConstrained` key omitted until SeaWulf-14 completes |
| `box_whisker_results` | `rankSummaries.length = totalDistricts`; `min ≤ q1 ≤ median ≤ q3 ≤ max`; all in `[0, 1]`; `enactedValue` is never null; valid `ensembleType` values: `race_blind`, `vra_constrained`, `robust_vra_constrained`, `vra_constrained_0.5`, `vra_constrained_0.6`, `vra_constrained_0.7` |
| `ei_support_results` | `xSupportShare` monotonically increasing per series; `density ≥ 0` |
| `ei_precinct_bar_ci_results` | `ciLow ≤ peak ≤ ciHigh`; all in `[0, 1]` |
| `ei_kde_results` | `x` monotonically increasing; `density ≥ 0` |
| `vra_impact_threshold_tables` | Exactly 3 rows; `metricKey ∈ {meet_or_exceed_enacted, rough_proportionality, meet_both}`; all shares in `[0, 1]`; `robustVraConstrainedShare` is `null` until SeaWulf-14 completes |
| `minority_effectiveness_box_whisker` | `min ≤ q1 ≤ median ≤ q3 ≤ max`; all are non-negative integers ≤ `totalDistricts`; uses field names `key` and `label`; `robustVraConstrainedSummary` key omitted until SeaWulf-14 completes |
| `minority_effectiveness_histograms` | `sum(frequency) = ensembleSize` per series; `effectiveDistricts ∈ [0, totalDistricts]`; `robustVraConstrained` key omitted until SeaWulf-14 completes |
| `interesting_plans` | `topology.type = "Topology"`; `summary.repWins + summary.demWins = totalDistricts`; 5–10 plans per state |
| `state_summaries` | `groupRoughProportionality` covers all feasible groups; `roughProportionalityRatio ≥ 0`; `cvapShare ∈ [0, 1]`; `enactedEffectiveDistricts ∈ [0, totalDistricts]` |
| `district_tables` | `effectivenessScore` and `calibratedEffectivenessScore` are `null` when no `groupKey` present; both in `[0, 1]` when populated |
