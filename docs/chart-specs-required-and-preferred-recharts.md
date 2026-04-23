# Chart Specs (Required + Preferred, Recharts Scope)

Covers chart use cases the team is implementing: GUI-9, GUI-12, GUI-13, GUI-15, GUI-16, GUI-17. GUI-18 (vote share vs seat share) is not in scope.

## GUI-16 Ensemble Splits (required)
- Purpose: Compare race-blind vs VRA-constrained ensemble split frequencies.
- X-axis: Seat split label (`#R/#D`).
- Y-axis: Frequency (count of plans).
- Controls: State selector.
- Tooltip: Split label, frequency, share of ensemble.
- OR/SC rule: split totals must match district count (OR=6, SC=7).

## GUI-9 Gingles Scatter (required)
- Purpose: Show precinct-level party vote share vs selected demographic share.
- X-axis: Selected group share in precinct.
- Y-axis: Party vote share.
- Series: Democratic (blue), Republican (red).
- Controls: State selector (group is pre-selected in the current payload shape).
- Tooltip: Precinct ID, shares, population counts.

## GUI-12 EI Support Distribution (required)
- Purpose: Show candidate support distributions by group from EI output.
- X-axis: Estimated support share.
- Y-axis: Density/probability.
- Series: One line per group.
- Controls: State selector, candidate selector (single candidate in the current payload).

## GUI-17 Box & Whisker (required)
- Purpose: Summarize ensemble district-rank values and compare to enacted plan.
- X-axis: District rank (sorted by metric within each plan).
- Y-axis: Share value.
- Overlay: Enacted plan dot (and optional proposed dot).
- OR/SC rule: rank count must equal district count (OR=6, SC=7).

## GUI-13 EI Precinct Bar + CI (preferred)
- Purpose: Show category peak support values with confidence intervals.
- X-axis: Category.
- Y-axis: Peak value.
- Overlay: CI whiskers (`ciLow`, `ciHigh`).

## GUI-15 EI KDE (preferred)
- Purpose: Compare group distributions with overlaid density curves.
- X-axis: Support/support-difference metric (payload metadata documents which).
- Y-axis: Density.
- Optional annotation: threshold probability.
