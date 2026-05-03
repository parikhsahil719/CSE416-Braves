# Schema Field Guide

## Shared fields
- `schemaVersion` (string): contract version, currently `v1`
- `state` (string): `OR` or `SC`
- `electionKey` (string): machine-readable election identifier, currently `2024_pres`
- `electionLabel` (string): human-readable election label, currently `2024 Presidential`
- `totalDistricts` (integer): state district count (`6` for OR, `7` for SC)
- `populationMeasureUsed` (string, optional): propagated from stored document metadata when available

## GUI-1 State Options
- Array of `StateOptionResponse`
- `stateId` (string): state code
- `stateName` (string): display name
- `totalDistricts` (integer): district count

## GUI-2 Enacted District Map
- TopoJSON `Topology`
- `objects.layer` (GeometryCollection): enacted district geometries in the current checked-in JSON assets
- `geometries[].properties.RESULT` (string): district party result used for map color styling
- `arcs[]`: shared or per-ring topology arcs consumed by `topojson-client`

## GUI-3 State Summary
- `population` (string): statewide population summary
- `voterDistributionDem` / `voterDistributionRep` (string): statewide 2024 Presidential vote summaries
- `partyControl` (string): party control of redistricting process
- `feasibleGroups[]` (string[]): feasible racial/ethnic groups for the state
- `ensembleSummary` (object): seeded ensemble availability summary

## GUI-4 Precinct Heatmap Bins
- `group` (string): selected demographic group label
- `binUnit` (string): seeded as `percent`
- `bins[]`: legend bins with integer bounds and colors
- `precomputed` (boolean): `true` for seeded contracts

## GUI-6 Congressional Representation Table
- `districts[]`: one row per enacted district
- `districts[].districtNumber` (integer)
- `districts[].representative` (string)
- `districts[].party` (string)
- `districts[].racialEthnicGroup` (string)
- `districts[].voteMargin2024` (number): positive for Democratic margin, negative for Republican margin

## GUI-7 Highlight District
- Client-only interaction
- Uses the district identifier already loaded by `GUI-6` and the rendered geometry from `GUI-2`

## GUI-9 Gingles Scatter
- `chartType` (string): `gingles-scatter`
- `selectedGroup` (string): selected group label
- `units.share` (string): seeded as `decimal_0_to_1`
- `sampling` (object): chart-display sampling metadata
- `sampling.displayedPointCount` (integer): displayed sampled precinct count
- `sampling.fullPrecinctCount` (integer): total available precinct count before sampling
- `sampling.targetPointCount` (integer): seeded target, currently `500`
- `points[].minorityShare` (number `[0,1]`): selected-group share in precinct
- `points[].demVoteShare` (number `[0,1]`)
- `points[].repVoteShare` (number `[0,1]`)
- `points[].totalPopulation` (integer)
- `points[].minorityPopulation` (integer)
- `regressionCurves[]` (array): precomputed best-fit curves

## GUI-10 Gingles Table
- `tableType` (string): `gingles-precinct-table`
- `selectedGroup` (string)
- `rowCount` (integer): full row count returned by the table endpoint
- `sorting.rowOrder` (string): currently `precinctId_asc`
- `rows[]`: one row per precinct in the full table response
- `rows[].precinctId` / `rows[].precinctName`
- `rows[].totalPopulation` / `rows[].minorityPopulation`
- `rows[].republicanVotes` / `rows[].democraticVotes`
- `rows[].minorityShare`, `rows[].repVoteShare`, `rows[].demVoteShare`

## GUI-12 EI Support Distribution
- `chartType` (string): `ei-support`
- `selectedCandidate` (string)
- `selectedGroup` (string): retained for frontend compatibility
- `series[]`: focal group and comparison group density curves
- `series[].confidenceScore` (number `[0,1]`, optional)
- `series[].points[].xSupportShare` (number `[0,1]`)
- `series[].points[].density` (number `>= 0`)

## GUI-13 EI Precinct Bar + CI
- `chartType` (string): `ei-precinct-bar-ci`
- `selectedCandidate` (string)
- `categories[]`: bar categories for the selected candidate
- `categories[].peak` (number `[0,1]`)
- `categories[].ciLow`, `categories[].ciHigh` (number `[0,1]`)

## GUI-15 EI KDE
- `chartType` (string): `ei-kde`
- `metricLabel` (string): describes compared support metric
- `thresholdX` (number, optional)
- `thresholdLabel` (string, optional)
- `thresholdProbability` (number `[0,1]`, optional)
- `series[].points[].x` (number)
- `series[].points[].density` (number `>= 0`)

## GUI-16 Ensemble Splits
- `chartType` (string): `ensemble-splits`
- `ensembleSize` (integer)
- `series.raceBlind[]` / `series.vraConstrained[]`: split-frequency buckets
- `repWins`, `demWins` (integers): seats won by each party in that split
- `frequency` (integer): count of plans with that split
- `shareOfEnsemble` (number `[0,1]`)

## GUI-17 Box & Whisker
- `chartType` (string): `box-whisker`
- `ensembleType` (string): `race_blind` or `vra_constrained`
- `selectedGroup` (string)
- `metricLabel` (string)
- `rankSummaries[]`: district-rank summaries
- `rankSummaries[].districtRank` (integer)
- `min`, `q1`, `median`, `q3`, `max` (numbers `[0,1]`)
- `enactedValue`, `proposedValue` (numbers `[0,1]`, optional)

## GUI-19 Interesting Plan
- `planId` (string): selected interesting plan identifier
- `planName` (string): display label for the plan
- `ensembleType` (string)
- `reasonInteresting` (string): why this plan was surfaced
- `summary` (object): seeded political/effectiveness summary for the plan
- `topology` (TopoJSON `Topology`): map-ready geometry payload

## GUI-20 VRA Impact Threshold Table
- `tableType` (string): `vra-impact-thresholds`
- `selectedGroup` (string)
- `populationMeasure` (string): seeded as `CVAP`
- `rows[]`: one row per legal threshold metric
- `rows[].metricKey` / `rows[].metricLabel`
- `rows[].raceBlindShare` / `rows[].vraConstrainedShare` (numbers `[0,1]`)

## GUI-21 Minority Effectiveness Box & Whisker Comparison
- `chartType` (string): `minority-effectiveness-box-whisker`
- `units.count` (string): seeded as `districts`
- `groupSummaries[]`: one summary per feasible group
- `groupSummaries[].raceBlindSummary` / `groupSummaries[].vraConstrainedSummary`
- each summary uses `min`, `q1`, `median`, `q3`, `max` integer district counts

## GUI-22 Minority Effectiveness Histogram
- `chartType` (string): `minority-effectiveness-histogram`
- `selectedGroup` (string)
- `ensembleSize` (integer)
- `series.raceBlind[]` / `series.vraConstrained[]`
- `effectiveDistricts` (integer)
- `frequency` (integer)
- `shareOfEnsemble` (number `[0,1]`)

## GUI-24 Reset Page
- Client-only interaction
- Clears frontend state back to pre-selection defaults; no dedicated server payload
