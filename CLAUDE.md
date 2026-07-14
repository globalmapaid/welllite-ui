# CLAUDE.md — welllite-ui

Web admin console for the `welllite-api` backend (sibling repo at
`../welllite-api`). React 19 + Vite + TypeScript SPA.

## What this app covers

The backend's `auth`, `clients`, `wells`, and `readings` routers. Wells and
readings are **read-only monitoring views** here — the field capture (and
offline `sync/batch`) lives in the separate React Native app, and the backend's
review-moderation endpoints aren't built yet, so `review_status` is display-only.

- Wells: list (`src/features/wells/WellsPage.tsx`, review-status filter +
  pagination) and detail (`WellDetailPage.tsx`, survey fields + that well's
  readings). API in `src/lib/api/wells.ts`, hooks in `features/wells/queries.ts`.
- Readings: list (`src/features/readings/`), API in `src/lib/api/readings.ts`.
- Enum labels/badge tones live in `src/lib/wells.ts`.
- Both areas are tenant-scoped; the queries are disabled until `currentClientId`
  is set and the page shows `<NeedsProject />` for an unscoped super-admin.

`sync/batch` is intentionally **not** implemented in this console (offline sync
is a mobile concern). If the backend later ships photo upload or approve/discard
moderation, add them as new endpoint modules mirroring the above.

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
