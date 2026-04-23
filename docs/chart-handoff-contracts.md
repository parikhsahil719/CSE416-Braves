# Chart Handoff Contracts

## Components
- `EnsembleSplitsChart`
- `GinglesScatterChart`
- `EiSupportChart`
- `BoxWhiskerChart`
- `EiPrecinctBarCIChart` (preferred)
- `EiKdeChart` (preferred)
- `VoteShareSeatShareChart` (preferred)

## Input contract
- Each component accepts a single `payload` prop.
- Payload must match the corresponding schema under `/schemas/v1`.
- Shares are decimal `[0,1]`; UI handles percent formatting.

## Integration assumptions
- Data has already been validated (schema + sanity checks).
- Container provides enough width/height for labels.
- State/group/candidate selection can be handled in parent UI and passed as payload updates.

## Integration target
- Reuse these payload contracts in the repo's current React frontend at the project root.
