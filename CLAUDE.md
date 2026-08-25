# CLAUDE.md — welllite-ui

Web admin console for the `welllite-api` backend (sibling repo at
`../welllite-api`). React 19 + Vite + TypeScript SPA.

## What this app covers

The backend's `auth`, `clients`, `wells`, `readings` and `well-changes` routers.
Wells and readings are **read-only monitoring views** here — the field capture
(and offline `sync/batch`) lives in the separate React Native app. Wells are
edited only indirectly, by reviewing a change request (see below).

- Wells: `WellsPage.tsx` owns the shared filter bar and a List/Map toggle —
  `WellsList` (paginated table, in the same file) and `WellsMap.tsx`
  (bounding-box map). Detail is `WellDetailPage.tsx` (survey fields, location
  map, that well's survey history and readings). API in `src/lib/api/wells.ts`,
  hooks in `features/wells/queries.ts`.
- Readings: list (`src/features/readings/`), API in `src/lib/api/readings.ts`.
- Change requests: `src/features/well-changes/` (see below).
- Enum labels/badge tones live in `src/lib/wells.ts`, change-request ones in
  `src/lib/wellChanges.ts`.
- All three areas are tenant-scoped; the queries are disabled until
  `currentClientId` is set and the page shows `<NeedsProject />` for an
  unscoped super-admin.

`sync/batch` is intentionally **not** implemented in this console (offline sync
is a mobile concern). If the backend later ships photo upload, add it as a new
endpoint module mirroring the above.

## Wells filtering

`WellsPage` holds one `WellFilterState` and hands the same derived `WellFilters`
to both views, because `/wells` and `/wells/search` take an identical filter set
(`review_status`, `well_type`, `well_status`, `q`) — keep it that way, or
toggling to Map silently shows wells the controls above it exclude.

- `WellFilters` (in `src/lib/api/wells.ts`) is extended by *both*
  `ListWellsParams` and `SearchWellsParams`, and one `appendFilters()` serialises
  it for both calls, so the two endpoints can't drift.
- `q` is a case-insensitive substring match on **name only**; wells with a null
  name never match, and `%` is escaped server-side rather than acting as a
  wildcard. The server does **not** trim, so `appendFilters()` trims and drops a
  blank `q` — otherwise a stray space matches every name containing one.
- Only the text input is debounced (300 ms, `useDebouncedValue`); the selects
  apply immediately, since a select is a single decisive click.
- Both views are keyed on the active filter set: the list so paging resets to
  page 1 (a narrower filter can otherwise strand you past the last page), the map
  so it refits to what the filters now select.
- The list's empty state distinguishes "no wells match these filters" from "no
  wells captured yet" — `hasActiveFilters()` in `wellFilters.ts`, which is split
  out of `WellsFilters.tsx` for clean fast-refresh.

## Wells map view

`GET /wells/search` takes a WGS84 bounding box (`min_lat/min_lon/max_lat/max_lon`,
each `min_*` **strictly** below its `max_*`) plus optional `review_status` and
`limit` (1–2000, default 500), and returns compact `WellMarker`s — *not* full
well records, so a marker click links to `/wells/{id}` for detail.

- Leaflet drives the map directly (no react-leaflet), with `preferCanvas` so
  thousands of `circleMarker`s stay smooth. Markers are diffed by id between
  fetches rather than cleared and re-added, so pins don't blink while panning.
- **Never pass `map.getBounds()` straight to the API.** Leaflet reports lat/lon
  outside WGS84 range when zoomed out or panned across world copies, which the
  API rejects (422, or 400 `WELL_INVALID_BOUNDS`). `boundsFromViewport()` in
  `src/lib/map.ts` clamps, wraps, snaps to a ~100 m grid (stable query keys) and
  guarantees strict `min < max`; a viewport straddling the antimeridian widens
  to the full longitude range rather than splitting into two queries.
- The map opens on `WORLD_BOUNDS`, then `fitBounds` to whatever comes back —
  once per mount, so a refetch never yanks a zoomed-in user back out.
- Always surface `truncated`: it means more wells fall in the box than `limit`
  returned, so the pins on screen are an incomplete picture.
- `WellLocationMap.tsx` is the detail-page counterpart: one marker at the
  well's own coordinates, no API call (the well record already has them), and
  wheel zoom stays off until you click the map so the page keeps scrolling.
  It opens at **zoom 6** — the first question is which part of the country the
  well is in, and street tiles are blank at village scale out there anyway.
  Zooming in (or switching to satellite) is the user's move; "Recenter" puts
  the opening view back.
- Basemaps (`BASEMAPS` in `src/lib/map.ts`) are keyless by design — OSM streets
  and Esri World Imagery, attribution-only, no map vendor account. The four
  `VITE_MAP_*` vars in `.env.example` repoint them at a keyed provider.
  Leaflet's light-only chrome is re-themed at the bottom of `src/index.css`
  (which is also where `leaflet.css` is imported, so those overrides always
  come after it in the bundle).

## Change requests & review

Wells are the master record and they arrive **unverified** — bulk-imported or
captured in the field, always starting at `review_status: "pending"` ("we hold
this record, nobody has confirmed it"). Field surveys never edit a well: each
is filed as a **change request**, a full snapshot of what the surveyor believes
the well should be. `src/features/well-changes/` is the reviewer's side of that.

- `WellChangesPage.tsx` — the queue (`GET /well-changes`), opening on `pending`
  because that's the work to do. The list payload has **no** `changes[]` or
  `stale`; both only exist on the detail read, so the table deliberately doesn't
  try to summarise a diff per row.
- `WellChangeDetailPage.tsx` + `ChangeDiff.tsx` — the diff, ordered
  `changed` → `cleared` → `filled` (`sortChanges`). `changed` means the survey
  *contradicts* a value that was already there, so it leads; `filled` is the
  routine blank-completed case. `location` arrives as one row whose values are
  `{latitude, longitude}` objects, not two scalar rows — `formatChangeValue()`
  handles that.
- `ReviewPanel.tsx` — the decision, which is really **two independent
  judgements** and is deliberately not one "Approve" button: `decision`
  (`approved` applies the whole snapshot, `discarded` leaves the well untouched)
  and, only when approving, `well_review_status` (is the well now verified, or
  still `pending`?). The common real outcome is *approved + still pending* — the
  survey improved the record without completing it — so `pending` is the default
  there. `well_review_status` is required when approving and **must be omitted**
  when discarding; both are 422s otherwise. Approval is all-or-nothing (no
  per-field accept).
- `changes[]` is recomputed against the well's *current* state on every read, so
  an **approved request comes back with an empty diff** (already applied) and a
  discarded one still shows what it would have changed — both misleading as a
  diff. The detail page therefore switches on `review_status`: a decided request
  renders the submitted snapshot plus an Outcome card, i.e. as history.
- `stale` means the well was modified after submission, so the diff shows values
  the submitter never saw. Surface it — applying still overwrites with the whole
  snapshot.
- A request can only be decided once. A 409 `WELL_CHANGE_NOT_PENDING` means
  another reviewer got there first: toast it as information, refresh, and leave
  the queue — never retry.
- Reading the queue is open to any member; deciding needs supervisor or
  client-admin (403 `AUTH_SUPERVISOR_REQUIRED`), so the route is ungated and the
  *panel* is gated on `role`.

## Architecture conventions

- **API layer** (`src/lib/api/`): all network access goes through
  `request()` in `http.ts`. It prefixes `VITE_API_BASE_URL`, attaches the
  Bearer token, parses the coded envelope, and throws a typed `ApiError`
  (`{ status, code, params, errors }`). On a 401 with a usable refresh token it
  silently calls `/auth/refresh` once and retries; on failure it clears the
  session and fires the `onAuthLost` handler (wired in `AuthProvider`).
- **Never branch on `message` text** — branch on `ApiError.code`. Friendly copy
  lives in `src/lib/errorCodes.ts`; field-level 422 errors map onto forms via
  `applyApiError()` in `src/lib/formErrors.ts`.
- **Auth state** lives in `AuthProvider` (`src/providers/`). It exposes
  `status` (`loading | authenticated | preauth | unauthenticated`), `user`,
  `claims` (decoded JWT), `isSuperAdmin`, `currentClientId`, `role`, and the
  actions `applyLoginResponse`, `selectMembership`, `switchTenant`, `logout`,
  `refreshUser`. The context/hook are split into `auth-context.ts` for clean
  fast-refresh.
- **Routing/guards**: `ProtectedRoute` gates the authenticated shell and
  redirects pre-auth users to organisation selection; `RequireSuperAdmin` gates
  super-admin-only routes. See `src/App.tsx`.
- **Server state** uses TanStack Query (`['tenants']`, `['tenant','me',...]`,
  `['memberships']`). Mutations invalidate those keys.
- **UI primitives** in `src/components/ui/` are hand-rolled shadcn-style
  components (Radix + Tailwind v4 tokens defined in `src/index.css`). We do not
  use the shadcn CLI — add new primitives by hand in the same style.

## Multi-tenancy (mirror the backend)

- Login returns a token pair (single membership / super-admin) OR a
  `pre_auth_token` + membership list → user picks an org → `select-client`.
- Super-admins start unscoped and use `switch-client` (the header
  `TenantSwitcher`) to scope into a tenant. `/clients/me` returns 403
  `AUTH_NO_TENANT_SELECTED` while unscoped, so `useCurrentTenant` is disabled
  until `currentClientId` is set.
- The backend derives `client_id` from the JWT and never trusts a body value.
- Each tenant has a list of operating **countries** (ISO alpha-2) that well
  coordinates are validated against. Super-admins manage it in the Projects
  **Edit** dialog (`PUT /clients/{id}/countries`, a separate call from the
  name/active `PATCH`); it comes back on `GET /clients` and `/clients/me` as
  `countries: [...]`. There's no endpoint listing *supported* codes yet, so
  `src/lib/countries.ts` is a display-only label/suggestion list and the server
  is authoritative (`CLIENT_UNSUPPORTED_COUNTRY`, `params.countries` = bad codes).

## Commands

`npm run dev` (:3000) · `npm run build` · `npm run typecheck` · `npm run lint`

## Gotchas

- TS config uses `verbatimModuleSyntax` (use `import type` for types) and
  `erasableSyntaxOnly` (no TS enums/namespaces — use union types + const maps).
- Tailwind **v4**: config is CSS-first in `src/index.css` (`@theme inline`),
  there is no `tailwind.config.js`. The `@` import alias is set in both
  `vite.config.ts` and `tsconfig.app.json`.
