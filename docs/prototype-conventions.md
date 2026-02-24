# Prototype Conventions (GUI Review Chart Demo)

- Scope: Recharts-only chart prototype for GUI review (`GUI-9`, `GUI-12`, `GUI-16`, `GUI-17` required; `GUI-13`, `GUI-15`, `GUI-18` preferred).
- Out of scope: `GUI-14` choropleth/maps.
- Percent/share values are stored as decimals in JSON (`0.0` to `1.0`).
- UI formats decimals as percentages for axes/tooltips.
- Count/frequency fields are integers.
- Missing values use `null`.
- Every payload includes `schemaVersion`, `chartType`, `state`, and `totalDistricts`.
- Chart components must render from JSON payloads (no hardcoded chart arrays inside components).

## State constants
- Oregon (`OR`) has `6` congressional districts.
- South Carolina (`SC`) has `7` congressional districts.
