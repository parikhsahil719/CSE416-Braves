# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (React + Vite) — run from project root
```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:5173
npm run build        # Production build
npm run test         # Run Vitest unit tests
```

### Backend (Spring Boot) — run from `server/`
```bash
./mvnw spring-boot:run                                                          # Start at :8080
MONGODB_URI="mongodb://127.0.0.1:27017/cse416_braves" ./mvnw spring-boot:run   # With explicit URI
./mvnw test                                                                     # Run all tests
./mvnw test -Dtest=ClassName#methodName                                         # Run a single test
./mvnw compile -DskipTests                                                      # Compile only
```

### MongoDB
```bash
# Use the IP address — not localhost — or the driver will fail
mongosh "mongodb://127.0.0.1:27017/cse416_braves" --eval 'db.runCommand({ ping: 1 })'
```

### Verify the full stack
```bash
curl http://localhost:8080/health
curl http://localhost:8080/health/db
curl http://localhost:8080/api/states
```

Swagger UI: `http://localhost:8080/swagger-ui.html`

## Architecture

Three-tier: React SPA (Vite + Leaflet + Recharts) → Spring Boot REST API → MongoDB.

**Vite proxy** routes `/api` and `/health` from `:5173` → `:8080` in dev (see `vite.config.js`).

### Frontend (`src/`)
- `components/` — page-level feature components
- `charts/` — Recharts wrappers; each accepts a single `payload` prop
- `utils/topology.js` — TopoJSON → GeoJSON conversion; always call this before passing geometry to Leaflet
- `utils/chartFormat.js` — normalizes API JSON into chart-ready structures
- `data/` — static fallback TopoJSON (districts 4–6 MB, precincts 11–14 MB)

### Backend (`server/src/main/java/.../braves/server/`)
Layered: `api/ → service/ → repository/`. Controllers are thin — validation and delegation only, no business logic.

- `service/BackendDataService.java` — main business logic across 16+ repositories
- `service/GeometryAssetService.java` — loads static TopoJSON/GeoJSON from classpath `geometry/`
- `service/SeedDataLoader.java` — seeds MongoDB at startup if empty; env vars `APP_SEED_ENABLED`, `APP_SEED_ROOT_PATH`
- `model/` — documents extend `BasePayloadDocument` with a `Map<String, Object> payload` field for schema-free analytical data
- `config/ApiExceptionHandler.java` — global exception → HTTP status mapping

### Geometry delivery
Static geometry is served as TopoJSON **from the backend**, not bundled in the frontend, to avoid Vite heap OOM with multi-MB files. Frontend fetches topology, converts with `topojson-client`, renders in Leaflet.
