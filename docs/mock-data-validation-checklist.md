# Mock Data Validation Checklist

## Global checks
- `schemaVersion` present
- `chartType` or `tableType` present when applicable
- `state` is `OR` or `SC`
- `totalDistricts` matches state (`OR=6`, `SC=7`)
- Share values remain in `[0,1]`

## GUI-10 Gingles Table
- `rows[]` contains precinct identifiers and vote counts
- `minorityPopulation <= totalPopulation`
- `democraticVotes` and `republicanVotes` are non-negative integers
- share fields stay in `[0,1]`

## GUI-16 Ensemble Splits
- Every bucket satisfies `repWins + demWins = totalDistricts`
- All frequencies are integers >= 0
- Frequency totals match `ensembleSize`
- `shareOfEnsemble = frequency / ensembleSize`

## GUI-17 Box & Whisker
- Rank count equals `totalDistricts`
- Ranks are sequential starting at 1
- Quartiles ordered: `min <= q1 <= median <= q3 <= max`
- Enacted/proposed values are in `[0,1]`

## GUI-13 EI Bar + CI
- `ciLow <= peak <= ciHigh`

## GUI-15 EI KDE
- Densities are non-negative
- X values are monotonic within each series

## GUI-18 Vote Share vs Seat Share
- `voteShare` and `seatShare` are in `[0,1]`
- X values are monotonic increasing

## GUI-19 Interesting Plan
- `planId` and `planName` present
- `topology.type = Topology`
- `summary.repWins + summary.demWins` is plausible for the state

## GUI-20 VRA Impact Threshold Table
- `rows[]` includes the three legal threshold metrics
- `raceBlindShare` and `vraConstrainedShare` stay in `[0,1]`

## GUI-21 Minority Effectiveness Box & Whisker
- `groupSummaries[]` covers feasible groups for the state
- each summary satisfies `min <= q1 <= median <= q3 <= max`
- summary values are integer district counts

## GUI-22 Minority Effectiveness Histogram
- `effectiveDistricts` buckets are integers from `0` to `totalDistricts`
- frequency totals are consistent with `ensembleSize`
- `shareOfEnsemble = frequency / ensembleSize`
