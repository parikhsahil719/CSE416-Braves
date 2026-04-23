# Caching Architecture

This project uses three cache layers for stable server-state:

- Frontend TanStack Query cache for shared route data and request deduplication
- Browser HTTP cache for `ETag` validation and short-lived reuse of seeded JSON responses
- Backend Spring+Caffeine cache for in-process reuse of seeded payloads and large geometry assets

## Frontend Query Cache

Stable server-state must go through the shared query layer in:

- `src/queries/stateQueries.js`
- `src/lib/queryKeys.js`
- `src/lib/queryClient.js`

Use shared query hooks for read-only API data such as:

- state summaries
- district and precinct topology
- ensemble summaries
- district tables
- EI payloads
- simulation payloads
- interesting plans
- heatmap payloads

Keep local interaction state in component state instead:

- selected tab
- selected district
- selected minority group
- current chart mode

Default frontend query policy:

- seeded analytics JSON: `staleTime = 5 minutes`
- district topology and interesting-plan topology: `staleTime = 30 minutes`
- precinct topology and splash topology: `staleTime = 1 hour`
- `gcTime = 30 minutes`
- `retry = 1`
- `refetchOnWindowFocus = false`
- `refetchOnReconnect = true`

Group-switching queries use `placeholderData: (previousData) => previousData` so charts and tables keep rendering their last successful payload during refetch.

## HTTP Cache Policy

The backend returns browser-facing cache headers for stable read-only responses.

JSON endpoints:

- `Cache-Control: public, max-age=300, must-revalidate`
- strong `ETag`

Geometry endpoints:

- `Cache-Control: public, max-age=604800`
- strong `ETag`

Any new read-only endpoint must document its HTTP caching behavior and include tests for cache headers and `304 Not Modified`.

## Cache Sequence

### Frontend cache hit

1. Component mounts.
2. TanStack Query looks up the query key in `QueryClient`.
3. A fresh cache entry is found.
4. No network request is sent.
5. The component renders from cached data.

### Frontend stale entry

1. Component mounts.
2. TanStack Query finds a stale cache entry for the same query key.
3. Cached data is returned immediately to the component.
4. A background request is sent to the backend.
5. The browser may answer with `304 Not Modified` or the backend may return `200 OK` with a new body.
6. TanStack Query updates the cache entry.
7. Subscribed components re-render only if the resolved data changed.

### Browser/backend validation path

1. A network request is sent with `If-None-Match`.
2. The controller computes or reads the current `ETag`.
3. If the `ETag` matches, the controller returns `304 Not Modified` with no response body.
4. The browser keeps using its cached payload body.
5. TanStack Query treats the request as successfully validated and keeps the cached data fresh.

### Backend cache hit

1. No fresh frontend cache entry is available.
2. No reusable browser response body fully satisfies the request.
3. The controller delegates to the service layer.
4. Spring cache returns the stored seeded payload or geometry asset from Caffeine.
5. No repository query or classpath geometry re-read happens.
6. The controller returns the cached body with `Cache-Control` and `ETag`.

### Full miss

1. No frontend query entry exists.
2. No browser cache entry can satisfy or validate the request.
3. No Spring cache entry exists.
4. The backend loads the payload from the repository or classpath asset.
5. The backend returns the response body with `Cache-Control` and `ETag`.
6. The browser stores the HTTP response for reuse.
7. TanStack Query stores the payload under its shared query key.

## Contributor Rules

- Stable server-state must use shared query hooks and shared cache helpers.
- Local interaction state stays in component state.
- New shared queries must use a stable key from `src/lib/queryKeys.js`.
- New prefetch behavior should call the shared helpers in `src/queries/stateQueries.js`.
- New read-only endpoints must document cache behavior and add cache-header coverage in tests.
