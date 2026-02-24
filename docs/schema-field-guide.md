# Schema Field Guide (Charts)

## Shared fields
- `schemaVersion` (string): contract version, e.g. `v1`
- `chartType` (string): chart payload type used by the demo component
- `state` (string): `OR` or `SC`
- `totalDistricts` (integer): state district count (`6` or `7`)
- `election` (string): election label for chart context
- `units.share` (string): share storage convention (`decimal_0_to_1`)

## GUI-9 Gingles Scatter
- `points[].minorityShare` (number `[0,1]`): selected group share in precinct (x-axis)
- `points[].demVoteShare` (number `[0,1]`): Democratic share (blue series y-value)
- `points[].repVoteShare` (number `[0,1]`): Republican share (red series y-value)
- `points[].totalPopulation` (integer): total precinct population
- `points[].minorityPopulation` (integer): selected group count

## GUI-12 EI Support Distribution
- `series[].points[].xSupportShare` (number `[0,1]`): estimated support share (x-axis)
- `series[].points[].density` (number `>=0`): EI density/probability curve value (y-axis)
- `series[].confidenceScore` (number `[0,1]`, optional): confidence summary for group/candidate

## GUI-16 Ensemble Splits
- `series.raceBlind[]` / `series.vraConstrained[]`: split frequency buckets
- `repWins`, `demWins` (integers): seats won by each party in that split
- `frequency` (integer): count of plans with the split (bar height)
- `shareOfEnsemble` (number `[0,1]`): normalized frequency
- OR/SC note: `repWins + demWins` must equal `6` (OR) or `7` (SC)

## GUI-17 Box & Whisker
- `rankSummaries[].districtRank` (integer): rank position after sorting district metric values
- `min`, `q1`, `median`, `q3`, `max` (numbers `[0,1]`): box/whisker summary values
- `enactedValue` (number `[0,1]`): enacted plan dot overlay value
- `proposedValue` (number `[0,1]`, optional): proposed plan dot overlay
- OR/SC note: rank count is `6` for OR and `7` for SC

## GUI-13 EI Bar + CI
- `categories[].peak` (number `[0,1]`): bar height
- `categories[].ciLow`, `categories[].ciHigh` (numbers `[0,1]`): confidence interval whisker bounds

## GUI-15 EI KDE
- `series[].points[].x` (number): KDE x-axis value
- `series[].points[].density` (number `>=0`): KDE y-axis density
- `thresholdProbability` (number `[0,1]`, optional): probability annotation

## GUI-18 Vote Share vs Seat Share
- `points[].voteShare` (number `[0,1]`): x-axis vote share
- `points[].seatShare` (number `[0,1]`): y-axis seat share
- `enabled` (boolean): whether chart is enabled for the state in the prototype
