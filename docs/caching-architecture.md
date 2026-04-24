# Caching Architecture

This document describes the two-tier caching strategy: backend in-process + HTTP caching, and frontend TanStack Query caching with automatic server-restart invalidation.

---

## Overview

```
Browser (TanStack Query in-memory cache)
  │
  │  GET /api/meta  ←── boot-time check on every app load
  │
  ▼
Vite proxy → Spring Boot (port 8080)
  │
  ├── Caffeine in-process cache (19 caches, 30-min TTL)
  │     └── populated from MongoDB on first access
  │
  └── HTTP ETag + Cache-Control (topology endpoints only)
        └── 304 Not Modified when content unchanged
```

---

## Layer 1 — Frontend: TanStack Query

**Files:** `src/lib/queryClient.js`, `src/lib/queryKeys.js`, `src/queries/stateQueries.js`

**Defaults** (set in `queryClient.js`):

| Setting | Value | Why |
|---------|-------|-----|
| `staleTime` | 5 minutes | Data doesn't change within a session; avoids redundant refetches |
| `gcTime` | 30 minutes | Matches backend Caffeine TTL; evicts data from memory when backend cache would also expire |
| `retry` | 1 | One retry on network error; prevents hammering a restarting server |
| `refetchOnWindowFocus` | false | Read-only analytical data; background refetch not needed |

**Topology queries** (`useDistrictTopology`, `usePrecinctTopology`, `useUsStatesTopology`) override `staleTime: Infinity` because these endpoints use HTTP ETags — the browser handles freshness via `If-None-Match` / 304.

**Query key factory** (`queryKeys.js`): all query keys are defined centrally so `prefetchQuery`, `invalidateQueries`, and `useQuery` always reference the same key shape.

---

## Layer 2 — HTTP Cache (topology endpoints only)

**Set in:** `StateController.java` (`STATIC_GEOMETRY_CACHE = CacheControl.maxAge(Duration.ofDays(7))`)

**Endpoints with ETag + Cache-Control:**
- `GET /api/states/{stateId}/districts/enacted/topology`
- `GET /api/states/{stateId}/precincts/topology`
- `GET /api/maps/us-states/topology`

**Flow:**
1. First request: server computes SHA-256 of TopoJSON payload → returns `ETag` header + `Cache-Control: max-age=604800, public`
2. Subsequent requests within 7 days: browser sends `If-None-Match: <etag>` → server returns `304 Not Modified` (no body)
3. If file content changes (new seed data): SHA-256 changes → new ETag → browser fetches fresh payload

**Implementation:** `GeometryAssetService.computeEtag()` — SHA-256 of serialized topology → hex string.

---

## Layer 3 — Backend: Caffeine In-Process Cache

**File:** `server/src/main/java/.../config/CacheConfig.java`

| Setting | Value |
|---------|-------|
| Provider | Caffeine |
| Strategy | `expireAfterAccess` |
| TTL | 30 minutes |
| Max entries | 256 per cache region |
| Null values | Not allowed |

**19 named caches** (one per service method):
`states`, `stateSummary`, `ensembleSummary`, `heatmap`, `districtTable`, `gingles`, `ginglesTable`, `eiSupport`, `eiPrecinctBarCi`, `eiKde`, `ensembleSplits`, `boxWhisker`, `interestingPlan`, `vraImpactThresholds`, `minorityEffectivenessBoxWhisker`, `minorityEffectivenessHistogram`, `districtTopology`, `precinctTopology`, `usStatesTopology`

All service methods in `BackendDataService` and `GeometryAssetService` are annotated `@Cacheable`. There are no `@CacheEvict` annotations — the cache is cleared automatically on server restart (in-memory only).

---

## Cache Invalidation on Server Restart

When seed JSON files are replaced and the server restarts:

```
1. Server starts → Caffeine cleared (in-memory) → MongoDB re-seeded → new BOOT_TIME set
2. Frontend loads → CacheBuster component fires → GET /api/meta → receives new bootTime
3. Stored localStorage.serverBootTime ≠ new bootTime
4. queryClient.clear() → all TanStack Query cache wiped
5. Components refetch → server re-populates Caffeine from freshly seeded MongoDB
6. localStorage.serverBootTime updated to new bootTime
```

**Files involved:**
- `server/src/main/java/.../api/MetaController.java` — `GET /api/meta` returns `{ "bootTime": "<ISO-8601>" }`
- `src/App.jsx` → `CacheBuster` component — detects `bootTime` change, calls `queryClient.clear()`

The `bootTime` is a static `Instant` captured at class-load time (`Instant.now()`), so it changes on every restart.

---

## Prefetch on State Click

`SplashPage.jsx` uses `queryClient.prefetchQuery()` on state click (before navigation). By the time `StatePage` mounts and calls `useStateSummary(stateCode)`, the data is already in cache — zero loading flash.

This replaces the previous `location.state.prefetchedStateSummary` pattern.

---

## Cache Miss Sequence (first load after restart)

```
User opens app
  → CacheBuster detects new bootTime → queryClient.clear()
  → StatePage mounts → useStateSummary("OR") → TanStack cache miss
  → GET /api/states/OR/state-summary
  → Spring: Caffeine cache miss → MongoDB query → store in Caffeine → return payload
  → TanStack stores response → component renders
  → Next navigation to OR: TanStack cache hit (within 5 min staleTime) → instant render
```
