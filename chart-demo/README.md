# CSE416 Braves Chart Demo (GUI Review Prototype)

This folder contains the Recharts-based GUI review chart prototype for the CSE416 project.

## Purpose
- Demo the chart-related GUI use cases during the GUI review.
- Use **schema-accurate mock data** so the frontend can later swap in real backend responses with minimal changes.
- Focus only on Recharts-compatible chart work for now.

Included charts:
- `GUI-9` Gingles scatter plot (required)
- `GUI-12` EI support distribution (required)
- `GUI-16` ensemble splits comparison bar chart (required)
- `GUI-17` box & whisker chart (required)
- `GUI-13`, `GUI-15`, `GUI-18` as preferred/stretch Recharts chart demos

Out of scope here:
- `GUI-14` choropleth maps (Leaflet/GeoJSON)

## How the code is organized
- `src/App.jsx`
  - Main demo shell.
  - Handles chart selection and state switching (`OR`, `SC`).
  - Loads chart payloads from shared mock JSON files via `src/data/payloads.js`.
- `src/data/payloads.js`
  - Central mapping from chart use-case key -> OR/SC payload JSON.
  - Keeps chart components data-driven.
- `src/charts/*`
  - One chart component per use case.
  - Required charts and preferred charts are separated by component file.
- `src/components/Controls.jsx`
  - UI selectors for chart and state.
- `src/utils/format.js`
  - Formatting helpers for percentages and counts.

## Why the schema was chosen (schema-first approach)
The demo uses a schema-first design so the chart code can remain stable when real data arrives from the Java backend.

### Reasons
- Prevents frontend/backend field-name mismatches.
- Forces consistent units (especially percentages/shares).
- Makes mock data realistic and reusable.
- Lets you explain exactly what each number in the JSON means during the oral review.

### Shared conventions (important)
- Shares/percentages are stored as decimals in JSON (`0.0` to `1.0`), not `0` to `100`.
- Counts/frequencies are integers.
- Missing values use `null`.
- Each payload includes metadata such as:
  - `schemaVersion`
  - `chartType`
  - `state`
  - `totalDistricts`

This matches the eventual Python -> Java -> React data flow:
1. Python preprocessing calculates chart-related values
2. Java server returns JSON matching the schema
3. React/Recharts renders the chart from that payload

## State-specific shaping (why OR and SC look different)
The mock data is intentionally shaped to match your project states:
- Oregon (`OR`) has `6` congressional districts
- South Carolina (`SC`) has `7` congressional districts

This affects chart structure directly:
- `GUI-16` (Ensemble splits): valid seat splits must sum to `6` for OR and `7` for SC
- `GUI-17` (Box & whisker): OR renders `6` ranked district boxes, SC renders `7`

## What the data points represent (chart-by-chart)

## GUI-9: Gingles Scatter (`gingles-scatter`)
Each precinct contributes one data object in `points[]`.

Important fields:
- `minorityShare`: selected group share in the precinct (`x` axis)
- `demVoteShare`: Democratic vote share in that precinct (`y` for blue series)
- `repVoteShare`: Republican vote share in that precinct (`y` for red series)
- `totalPopulation`: total population count in the precinct
- `minorityPopulation`: selected-group population count in the precinct

What you see in the chart:
- Two plotted point clouds (Dem and Rep) over the same precinct set
- Precomputed best-fit regression curves (linear or non-linear) supplied in JSON

Best-fit regression support:
- `GUI-9` now renders `regressionCurves[]` supplied in the payload.
- Curves may be `linear_regression`, `nonlinear_regression`, or a generic `best_fit` selection.

## GUI-12: EI Support Distribution (`ei-support`)
Each series represents one racial/demographic group for a selected candidate.

Important fields:
- `series[].points[].xSupportShare`: estimated support share (`x` axis)
- `series[].points[].density`: relative probability density (`y` axis)
- `confidenceScore` (optional): summary confidence metric for that group/candidate

What you see in the chart:
- Filled area curves (similar to the example figure style)
- One curve per group

## GUI-16: Ensemble Splits (`ensemble-splits`)
Each bar bucket represents one simulated election seat split outcome.

Important fields:
- `repWins`, `demWins`: seat counts for that split
- `splitLabel`: formatted label like `2R/4D`
- `frequency`: number of plans with that split (bar height)
- `shareOfEnsemble`: normalized frequency

What you see in the chart:
- Two bar charts side-by-side (race-blind vs VRA-constrained)
- Same split-domain intent for comparison

## GUI-17: Box & Whisker (`box-whisker`)
Each `rankSummaries[]` item represents one district rank (after sorting districts by a metric within each plan).

Important fields:
- `districtRank`: rank position on x-axis
- `min`, `q1`, `median`, `q3`, `max`: box plot summary stats
- `enactedValue`: dot overlay for enacted plan
- `proposedValue` (optional): dot overlay for proposed plan

What you see in the chart:
- Custom SVG box-and-whisker rendering inside the React component
- Red/green dots for enacted/proposed values

## Preferred charts included (Recharts-compatible)
### GUI-13: EI bar + confidence intervals
- Bars show `peak`
- Whiskers show `ciLow` to `ciHigh`

### GUI-15: EI KDE comparison
- Overlaid filled density curves by group
- Optional threshold annotation metadata

### GUI-18: Vote share vs seat share
- Line curve mapping statewide vote share -> seat share
- Optional `y = x` reference line

## Why Recharts (for this phase)
Recharts was chosen over D3-first because this phase is a GUI review prototype with mock data and limited time.

Benefits here:
- Faster to build reliable charts in React
- Easier to maintain as a solo chart workstream
- Lets the work focus on schema correctness and chart semantics
- Still supports custom drawing where needed (box plot, CI whiskers)

## Where the schemas and mock data live (shared across the monorepo)
The chart demo intentionally reads from the monorepo-level shared data/contracts:
- `../schemas/v1/*`
- `../mock-data/v1/*`

This is important because those files are meant to be reused later by the full project.

## Running the chart demo locally
From the `chart-demo` folder:

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in terminal (usually `http://127.0.0.1:4173/` or `http://localhost:5173/`).

## Build check
To verify production build compiles:

```bash
npm run build
```

## What to demo during GUI review (recommended order)
1. `GUI-16` (easy to explain, shows OR vs SC structure difference)
2. `GUI-17` (shows 6 vs 7 ranked district boxes)
3. `GUI-9` (precinct scatter point semantics)
4. `GUI-12` (EI curve semantics)
5. Preferred previews (`GUI-13`, `GUI-15`, `GUI-18`) if time permits

## Notes for future integration
- These chart components are payload-driven and can be moved into `/frontend` later.
- The payload schema design is the key contract that should remain stable as backend work starts.
