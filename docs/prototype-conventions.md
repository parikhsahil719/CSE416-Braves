# Chart Payload Conventions

- Scope: Recharts-backed chart payload conventions for the current frontend (`GUI-9`, `GUI-12`, `GUI-16`, `GUI-17` required; `GUI-13`, `GUI-15` preferred).
- Out of scope: `GUI-5` (census block heatmap), `GUI-11` (Gingles row highlight), `GUI-14` (EI choropleth maps), `GUI-18` (vote share vs seat share).
- Percent/share values are stored as decimals in JSON (`0.0` to `1.0`).
- UI formats decimals as percentages for axes/tooltips.
- Count/frequency fields are integers.
- Missing values use `null`.
- Every payload includes `schemaVersion`, `chartType`, `state`, and `totalDistricts`.
- Chart components must render from JSON payloads (no hardcoded chart arrays inside components).

## State constants
- Oregon (`OR`) has `6` congressional districts.
- South Carolina (`SC`) has `7` congressional districts.
