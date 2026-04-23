# Braves Server (Backend)

Spring Boot + MongoDB backend for the CSE 416 Braves project.

This README is the reproducible local setup guide for teammates. It covers:
- backend prerequisites
- local MongoDB setup
- backend build and run commands
- endpoint checks
- how to run the frontend against the backend for the current contract routes
- how the TopoJSON geometry implementation is structured

## Current Scope

Implemented end-to-end:
- `GET /api/states` (GUI-1)
- `GET /api/states/{stateId}/districts/enacted/topology` (GUI-2)
- `GET /api/states/{stateId}/districts/enacted/geojson` (GUI-2 compatibility)
- `GET /api/states/{stateId}/summary` (GUI-3)
- `GET /api/states/{stateId}/precincts/topology` (GUI-4 geometry)
- `GET /api/states/{stateId}/heatmap/precincts?group=...` (GUI-4)
- `GET /api/states/{stateId}/districts/enacted/table?election=...` (GUI-6)
- `GET /api/states/{stateId}/analysis/gingles?group=...&election=...` (GUI-9)
- `GET /api/states/{stateId}/analysis/gingles/table?group=...&election=...` (GUI-10)
- `GET /api/states/{stateId}/analysis/ei-support?groups=...&election=...&party=...` (GUI-12)
- `GET /api/states/{stateId}/analysis/ei-precinct-bar-ci?group=...&election=...&party=...` (GUI-13)
- `GET /api/states/{stateId}/analysis/ei-kde?group=...&election=...&metric=...` (GUI-15)
- `GET /api/states/{stateId}/ensembles/splits?ensembleSize=...&election=...` (GUI-16)
- `GET /api/states/{stateId}/ensembles/box-whisker?group=...&ensembleType=...&metric=...` (GUI-17)
- `GET /api/states/{stateId}/districts/interesting?planId=...` (GUI-19)
- `GET /api/states/{stateId}/analysis/vra-impact-thresholds?group=...&election=...` (GUI-20)
- `GET /api/states/{stateId}/analysis/minority-effectiveness/box-whisker?election=...` (GUI-21)
- `GET /api/states/{stateId}/analysis/minority-effectiveness/histogram?group=...&election=...` (GUI-22)
- `GET /api/maps/us-states/topology` (splash page overview geometry)

Also available:
- `GET /health`
- `GET /health/db`

## Prerequisites

Install these locally:
- Java 22
- Maven is not required globally; this repo uses the Maven Wrapper
- MongoDB Community Server
- `mongosh`
- Node.js and npm for the frontend

Recommended local versions:
- Java `22`
- MongoDB local server on `127.0.0.1:27017`

## Repository Setup

From the project root:

```bash
git checkout main
git pull --ff-only origin main
```

If you are working on another branch, update that branch instead.

## MongoDB Setup

Start MongoDB locally using your normal local setup.

Important:
- Use `127.0.0.1`, not `localhost`, for the backend Mongo URI on this machine.
- The backend expects the database name `cse416_braves`.

Verify Mongo is reachable:

```bash
mongosh "mongodb://127.0.0.1:27017/cse416_braves" --eval 'db.runCommand({ ping: 1 })'
```

Expected output:

```json
{ ok: 1 }
```

## Backend Environment

Default backend configuration:

- Spring HTTP server: `http://localhost:8080`
- MongoDB URI: `mongodb://127.0.0.1:27017/cse416_braves`

Environment variables supported:
- `MONGODB_URI`
- `APP_SEED_ENABLED`
- `APP_SEED_ROOT_PATH`

Normal local run values:

```bash
export MONGODB_URI="mongodb://127.0.0.1:27017/cse416_braves"
export APP_SEED_ENABLED=true
```

## Validate Backend Build

From the `server/` directory:

```bash
cd "/Users/sahilparikh/Documents/CSE 416 Braves/server"
./mvnw -q -DskipTests compile
```

Expected result:
- `BUILD SUCCESS`

## TopoJSON Implementation

Static geometry is now served as TopoJSON directly from checked-in files instead of being bundled into the frontend:
- enacted district topology: `src/data/oregon_congressional_districts.json`, `src/data/south_carolina_congressional_districts.json`
- precinct topology: `src/data/OR-precincts-with-results.json`, `src/data/SC-precincts-with-results.json`
- splash page overview topology: `src/data/us-states.json`

Mongo remains the source of truth for plan-specific geometry where a single collection-backed lookup matters:
- `interesting_plans` stores metadata plus `topology`

The frontend fetches TopoJSON from the backend, converts it with `topojson-client`, and renders the resulting features in Leaflet. This keeps large geometry out of the production bundle and avoids the prior Vite heap OOM during `npm run build`.

Static geometry responses are optimized for repeat loads:
- browser-cacheable with `Cache-Control: public, max-age=604800`
- strong `ETag` support for `304 Not Modified`
- sanitized map-only properties before serialization

Stable seeded JSON responses are also browser-cacheable:
- `Cache-Control: public, max-age=300, must-revalidate`
- strong `ETag` support for `304 Not Modified`
- backed by Spring+Caffeine after the first server-side load

The frontend now uses a shared TanStack Query cache on top of these HTTP semantics. Shared query hooks live in `src/queries/stateQueries.js`. See [docs/caching-architecture.md](/Users/sahilparikh/Documents/CSE 416 Braves/docs/caching-architecture.md) for the full request lifecycle.

Delivered geometry property sets:
- district topology: `RESULT`, `NAMELSAD`, `district_number`, `GEOID`
- precinct topology: `GEOID`
- US states overview: `name`, `isActive`

## Start the Backend Server

From `server/`:

```bash
cd "/Users/sahilparikh/Documents/CSE 416 Braves/server"
MONGODB_URI="mongodb://127.0.0.1:27017/cse416_braves" ./mvnw spring-boot:run
```

Expected startup behavior:
- Tomcat starts on port `8080`
- Mongo connects successfully
- the app seeds local data if needed
- startup completes without errors

## Verify Backend Endpoints

Open a second terminal and run:

```bash
curl http://localhost:8080/health
curl http://localhost:8080/health/db
curl http://localhost:8080/api/states
curl http://localhost:8080/api/maps/us-states/topology
curl http://localhost:8080/api/states/OR/districts/enacted/topology
curl http://localhost:8080/api/states/SC/districts/enacted/topology
curl http://localhost:8080/api/states/OR/districts/enacted/geojson
curl http://localhost:8080/api/states/SC/districts/enacted/geojson
curl http://localhost:8080/api/states/OR/precincts/topology
curl http://localhost:8080/api/states/SC/precincts/topology
curl "http://localhost:8080/api/states/OR/analysis/gingles/table?group=latino&election=2024_pres"
curl "http://localhost:8080/api/states/OR/analysis/ei-support?groups=latino&election=2024_pres&party=DEM"
curl "http://localhost:8080/api/states/OR/analysis/vra-impact-thresholds?group=latino&election=2024_pres"
```

Expected responses:
- `/health`
  - returns `{"status":"ok","service":"braves-server"}`
- `/health/db`
  - returns Mongo health info, DB name, and collection counts for stored analytical payloads
- `/api/states`
  - returns supported state options
- topology endpoints
  - return TopoJSON payloads for US states, enacted districts, and precinct geometry
  - include `ETag`; repeated browser requests may receive `304 Not Modified`
- compatibility GeoJSON endpoints
  - return enacted district GeoJSON for `OR` and `SC`
- summary and analysis endpoints
  - return seeded professor-facing JSON payloads for the implemented GUI use cases
  - include `Cache-Control` and `ETag`
  - may return `304 Not Modified` when the browser revalidates with `If-None-Match`

## Verify MongoDB in Compass

Connect Compass to:

```text
mongodb://127.0.0.1:27017/cse416_braves
```

Check:
- collection `states` exists if seed data has loaded
- collection `interesting_plans` exists and stores plan metadata plus `topology`

## Run the Frontend Against the Backend

The frontend Vite dev server proxies `/api` and `/health` to `http://localhost:8080`.

From the project root:

```bash
cd "/Users/sahilparikh/Documents/CSE 416 Braves"
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

For contract verification:
- confirm the splash page requests `/api/maps/us-states/topology`
- select a supported state
- confirm the state page requests `/api/states/{stateId}/districts/enacted/topology`
- confirm the minority analysis requests `/api/states/{stateId}/precincts/topology`
- confirm the frontend requests the expected `/api/...` route for the chosen GUI
- confirm the payload shape matches the docs under `/docs`

## Typical Full Local Workflow

In terminal 1:

```bash
cd "/Users/sahilparikh/Documents/CSE 416 Braves/server"
MONGODB_URI="mongodb://127.0.0.1:27017/cse416_braves" ./mvnw spring-boot:run
```

In terminal 2:

```bash
cd "/Users/sahilparikh/Documents/CSE 416 Braves"
npm install
npm run dev
```

In terminal 3:

```bash
curl http://localhost:8080/health
curl http://localhost:8080/health/db
```

## Troubleshooting

### Mongo connection fails

Check:

```bash
mongosh "mongodb://127.0.0.1:27017/cse416_braves" --eval 'db.runCommand({ ping: 1 })'
```

If this fails:
- Mongo is not running
- or local security/network tooling is blocking access

### Backend fails with index conflict

The app now migrates the old non-unique `district_maps.stateId` index automatically to the new unique index. If a conflict still appears, inspect indexes in Compass or run:

```bash
mongosh "mongodb://127.0.0.1:27017/cse416_braves" --eval 'db.district_maps.getIndexes()'
```

### `/health/db` returns an error

Make sure:
- the backend was restarted after pulling the latest changes
- Mongo is running
- you are using `127.0.0.1` in `MONGODB_URI`

## Key Backend Files

- [`application.properties`](/Users/sahilparikh/Documents/CSE 416 Braves/server/src/main/resources/application.properties)
- [`HealthController.java`](/Users/sahilparikh/Documents/CSE 416 Braves/server/src/main/java/edu/stonybrook/cse416/braves/server/api/HealthController.java)
- [`MongoIndexConfig.java`](/Users/sahilparikh/Documents/CSE 416 Braves/server/src/main/java/edu/stonybrook/cse416/braves/server/config/MongoIndexConfig.java)
- [`MongoDatabaseHealthService.java`](/Users/sahilparikh/Documents/CSE 416 Braves/server/src/main/java/edu/stonybrook/cse416/braves/server/service/MongoDatabaseHealthService.java)
