# TopoJSON Implementation Notes

## Why TopoJSON

The frontend previously bundled large geometry payloads directly from `src/data/`, including multi-megabyte precinct and district files. That caused Vite production builds to run out of heap memory and pushed unnecessary geometry bytes to the client.

TopoJSON is now the primary geometry delivery format because:
- it reduces geometry payload size compared with equivalent GeoJSON
- it keeps large map assets out of the frontend bundle
- it gives the backend a single format to serve for map-heavy views

The frontend still converts TopoJSON to renderable features with `topojson-client` before Leaflet draws the map layers.

## Storage Split

### File-backed static geometry

Static geometry is served directly from checked-in files:
- `src/data/oregon_congressional_districts.json`
- `src/data/south_carolina_congressional_districts.json`
- `server/src/main/resources/geometry/precincts_or.json`
- `server/src/main/resources/geometry/precincts_sc.json`
- `src/data/us-states.json`

This geometry is stable by state and does not need MongoDB storage.

### Mongo-backed plan geometry

`GUI-19` interesting plans remain Mongo-backed in `interesting_plans`.

That route still returns one collection-backed payload containing:
- plan metadata
- plan summary
- `topology`

This preserves the existing one-lookup use-case model for plan-specific responses.

There is no Mongo-backed document or repository for the enacted district map in `GUI-2`; enacted district geometry is served only from static classpath TopoJSON files.

## Backend Flow

Static geometry routes use `GeometryAssetService`, which:
- resolves the repository root with `ProjectPathResolver`
- maps route parameters to a checked-in geometry file
- parses the JSON payload with Jackson
- strips geometry properties that the current frontend does not use
- computes a stable ETag for the sanitized payload
- returns a cached TopoJSON document to the controller

The current sanitized property contract is:
- enacted district topology keeps `RESULT`, `NAMELSAD`, `district_number`, and `GEOID`
- precinct topology keeps `GEOID`, `total`, `black`, `asian`, and `hispanic`
- US states topology keeps `name` and `isActive`

Static geometry responses are also browser-cacheable:
- `Cache-Control: public, max-age=604800`
- strong `ETag`
- conditional `304 Not Modified` support via `If-None-Match`

Interesting plan geometry is seeded by `SeedDataLoader` into Mongo using the `topology` field instead of `geojson`.

## Frontend Flow

The frontend no longer imports district or precinct geometry directly.

Instead it:
1. fetches TopoJSON from backend routes
2. converts TopoJSON to `FeatureCollection` with `topojson-client`
3. passes the converted features into Leaflet

This pattern is used by:
- `StatePage.jsx`
- `MinorityHeatMap.jsx`
- `SplashPage.jsx`

## Artifact Generation

Static district and US overview topology JSON artifacts are generated with:
- `scripts/geojson_to_topology.py`

This converter is intentionally dependency-free and produces deterministic topology JSON artifacts from local GeoJSON-style sources. Raw district GeoJSON files are retained as source inputs, and generated topology JSON artifacts are committed separately.
