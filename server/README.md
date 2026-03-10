# Braves Server (Backend)

Spring Boot + MongoDB backend for the CSE 416 Braves project.

This README is the reproducible local setup guide for teammates. It covers:
- backend prerequisites
- local MongoDB setup
- backend test and run commands
- endpoint checks
- how to run the frontend against the backend for the GUI-2 district-loading flow

## Current Scope

Implemented end-to-end:
- `GET /api/states/{stateId}/districts/enacted/geojson` (GUI-2)

Also available:
- `GET /health`
- `GET /health/db`

Other backend collections may exist as skeleton data for future use cases, but they should not be treated as fully implemented client/server flows.

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

## Run Backend Tests

From the `server/` directory:

```bash
cd "/Users/sahilparikh/Documents/CSE 416 Braves/server"
./mvnw test
```

Expected result:
- `BUILD SUCCESS`

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
curl http://localhost:8080/api/states/OR/districts/enacted/geojson
curl http://localhost:8080/api/states/SC/districts/enacted/geojson
```

Expected responses:
- `/health`
  - returns `{"status":"ok","service":"braves-server"}`
- `/health/db`
  - returns Mongo health info, DB name, collection list, and `district_maps` count
- district GeoJSON endpoints
  - return enacted district map JSON for `OR` and `SC`

## Verify MongoDB in Compass

Connect Compass to:

```text
mongodb://127.0.0.1:27017/cse416_braves
```

Check:
- collection `district_maps` exists
- OR and SC each have one district map document
- collection `states` exists if seed data has loaded

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

For GUI-2 verification:
- select a supported state
- confirm the frontend requests `/api/states/{stateId}/districts/enacted/geojson`
- confirm the district map renders

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

### Tests fail under Java 22

Current test suite is adjusted for Java 22 and does not depend on Mockito agent attachment for the existing tests. Use:

```bash
./mvnw test
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
