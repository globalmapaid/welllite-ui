# WellLite Console (welllite-ui)

Web admin console for the [WellLite](../welllite-api) backend — part of the
WellMapr™ ecosystem. It manages the things the backend exposes today:

- **Authentication** — register, email verification (OTP), login, multi-tenant
  organisation selection, password reset, and session handling.
- **Organisations (tenants)** — super-admins list, create, and edit tenants, and
  scope their session into any tenant.

> Field data capture (wells & Static Water Level readings) happens in the
> **WellLite mobile app** (a separate React Native project). The Wells and
> Readings sections here are placeholder shells, ready to wire up once the
> backend exposes those endpoints.

## Stack

Vite · React 19 · TypeScript · React Router · TanStack Query ·
React Hook Form + Zod · Tailwind CSS v4 · shadcn-style components (Radix).

## Getting started

```bash
npm install
cp .env.example .env.local   # already present; adjust if your API runs elsewhere
npm run dev                  # http://localhost:3000
```

The dev server runs on **port 3000** to match the backend's default
`ALLOWED_ORIGINS`. Point it at a backend with `VITE_API_BASE_URL` (default
`http://localhost:8001/api/v1`).

### Running against the backend

1. Start `welllite-api` (`make up` in that repo); confirm
   `http://localhost:8001/health` is OK.
2. Make sure the backend's `ALLOWED_ORIGINS` includes `http://localhost:3000`.
3. Create an account via the console's **Register** flow, or use an existing
   one. Super-admins (created with `make superuser` in the backend) get the
   Organisations section and the tenant switcher.

## Scripts

| Command             | Purpose                          |
| ------------------- | -------------------------------- |
| `npm run dev`       | Dev server on :3000              |
| `npm run build`     | Type-check + production build    |
| `npm run typecheck` | Type-check only (`tsc -b`)       |
| `npm run lint`      | Lint with oxlint                 |
| `npm run preview`   | Preview the production build     |

## Auth flow

```
register → verify-email (OTP) → login
login →  ┌ token pair ............... enter app
         └ pre-auth + memberships ... select organisation → token pair → enter app
super-admin: login (unscoped) → switch organisation (tenant switcher)
```

The backend returns a **coded envelope** (`{ code, message, params }`, plus
`errors[]` on 422). The UI keys all behaviour off the stable `code`, never the
English `message`. Codes are mapped to friendly copy in
[`src/lib/errorCodes.ts`](src/lib/errorCodes.ts) — the single place to localise.

## Token storage trade-off

The backend returns access + refresh tokens in the response body (not as
httpOnly cookies), so this SPA keeps them in `localStorage`
([`src/lib/tokens.ts`](src/lib/tokens.ts)). This survives reloads but is
reachable from JS, so the app must never inject untrusted HTML. If the backend
later sets an httpOnly refresh cookie, move refresh handling there and keep only
the access token in memory.

## Project layout

```
src/
  lib/api/      HTTP client (envelope parsing, refresh-on-401), typed endpoints
  lib/          tokens, error-code map, role labels, form-error mapping, utils
  providers/    AuthProvider (session), QueryProvider
  components/   ui/ (shadcn-style primitives), layout/ (shell, sidebar, header)
  features/     auth/, tenants/, dashboard/, profile/, placeholders/
```
