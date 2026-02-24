# Chart Handoff Contracts (for future /frontend integration)

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

## Future integration target
- Move or reuse chart components under `/frontend` once backend endpoints are available.
