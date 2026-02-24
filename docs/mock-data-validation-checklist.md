# Mock Data Validation Checklist

## Global checks
- `schemaVersion` present
- `chartType` present
- `state` is `OR` or `SC`
- `totalDistricts` matches state (`OR=6`, `SC=7`)
- Share values remain in `[0,1]`

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
