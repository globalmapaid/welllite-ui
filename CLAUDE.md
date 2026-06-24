# CLAUDE.md — welllite-ui

Web admin console for the `welllite-api` backend (sibling repo at
`../welllite-api`). React 19 + Vite + TypeScript SPA.

## What this app covers

Only what the backend implements **today**: the `auth` and `clients` routers.
Wells / readings / sync are documented in the API's README but **not yet
implemented** (no routers/schemas/models) — they exist here as `ComingSoon`
placeholder pages under `src/features/placeholders/`. The real field-capture
client is the separate React Native app, not this one.

When the backend ships wells/readings:

- Add types to `src/lib/api/types.ts` and an endpoint module under
  `src/lib/api/` (mirror `clients.ts`).
- Replace the relevant `ComingSoon` page body with TanStack Query data.
- The nav entries already exist in `src/components/layout/Sidebar.tsx` (drop the
  `soon` flag).

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

## Commands

`npm run dev` (:3000) · `npm run build` · `npm run typecheck` · `npm run lint`

## Gotchas

- TS config uses `verbatimModuleSyntax` (use `import type` for types) and
  `erasableSyntaxOnly` (no TS enums/namespaces — use union types + const maps).
- Tailwind **v4**: config is CSS-first in `src/index.css` (`@theme inline`),
  there is no `tailwind.config.js`. The `@` import alias is set in both
  `vite.config.ts` and `tsconfig.app.json`.
