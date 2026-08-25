/**
 * Types mirroring the welllite-api contract.
 * Every response uses a coded envelope; clients key behaviour off `code`,
 * never off the English `message` (which is a dev fallback).
 */

/** Generic coded message envelope returned by message-only endpoints. */
export interface MessageEnvelope {
  code: string
  message: string
  params?: Record<string, unknown>
}

/** A single field-level validation failure inside a 422 response. */
export interface FieldError {
  field: string
  code: string
  params?: Record<string, unknown>
}

/** 422 validation envelope. */
export interface ValidationEnvelope extends MessageEnvelope {
  errors: FieldError[]
}

export type Role = 'client_admin' | 'supervisor' | 'member'

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
}

export interface Membership {
  membership_id: string
  client_id: string
  client_name: string
  role: Role
}

export interface PreAuthResponse {
  pre_auth_token: string
  token_type: 'bearer'
  memberships: Membership[]
}

/** `POST /auth/login` returns either a full token pair or a pre-auth response. */
export type LoginResponse = TokenPair | PreAuthResponse

export function isPreAuth(r: LoginResponse): r is PreAuthResponse {
  return 'pre_auth_token' in r
}

export interface CurrentUser {
  id: string
  email: string
  first_name: string
  last_name: string
  is_super_admin: boolean
  email_verified_at: string | null
}

export interface ClientTenant {
  id: string
  name: string
  is_active: boolean
  /** ISO 3166-1 alpha-2 codes the tenant operates in; well coordinates are
   *  validated against these server-side. May be absent on older payloads. */
  countries?: string[]
  created_at: string
  updated_at: string
}

/** A user's membership in the current tenant (active or soft-removed). */
export interface Member {
  id: string // membership id (row key)
  user_id: string // used in PATCH/DELETE paths
  client_id: string
  email: string
  first_name: string
  last_name: string
  role: Role
  is_active: boolean
  created_at: string
  updated_at: string
}

/** Paginated list envelope returned by GET /clients/members. */
export interface PaginatedMembers {
  items: Member[]
  total: number
  limit: number
  offset: number
}

/** One of a user's tenant memberships, as returned in the platform directory. */
export interface UserMembershipSummary {
  membership_id: string
  client_id: string
  client_name: string
  role: Role
  is_active: boolean
}

/** A platform user (super-admin cross-tenant directory) with all memberships. */
export interface PlatformUser {
  id: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  is_super_admin: boolean
  email_verified_at: string | null
  created_at: string
  updated_at: string
  memberships: UserMembershipSummary[]
}

/** Paginated list envelope returned by GET /users. */
export interface PaginatedUsers {
  items: PlatformUser[]
  total: number
  limit: number
  offset: number
}

// ---- Wells & readings (field data) ----

export type WellType = 'borehole' | 'hand_dug' | 'spring' | 'oasis'
export type WellStatus = 'working' | 'broken'
export type ReviewStatus = 'pending' | 'approved' | 'discarded'

/** A well survey (`WellResponse`). Decimals arrive as fixed-precision strings. */
export interface Well {
  id: string
  client_id: string
  /** Device-generated idempotency key, unique per tenant. */
  client_uuid: string
  created_by: string
  latitude: number
  longitude: number
  well_confirmed: boolean
  name: string | null
  well_type: WellType | null
  well_status: WellStatus | null
  daily_users_estimate: number | null
  distance_to_other_water_km: string | null
  opening_diameter_cm: string | null
  owner_name: string | null
  owner_mobile: string | null
  comments: string | null
  review_status: ReviewStatus
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null
  created_at: string
  updated_at: string
}

/** A Static Water Level reading (`ReadingResponse`). */
export interface Reading {
  id: string
  client_id: string
  well_id: string
  client_uuid: string
  created_by: string
  swl_metres: string
  measured_on: string
  created_at: string
  updated_at: string
}

/**
 * A compact map marker from `GET /wells/search` — deliberately *not* the full
 * well record. Fetch `GET /wells/{id}` when a marker is selected.
 */
export interface WellMarker {
  id: string
  latitude: number
  longitude: number
  name: string | null
  well_type: WellType | null
  well_status: WellStatus | null
  well_confirmed: boolean
  review_status: ReviewStatus
}

/** Envelope returned by GET /wells/search (bounding-box query). */
export interface WellSearchResponse {
  items: WellMarker[]
  count: number
  limit: number
  /** True when more wells fall inside the box than `limit` returned — the
   *  viewport must be shrunk to see the rest. */
  truncated: boolean
}

/** Paginated list envelope returned by GET /wells. */
export interface PaginatedWells {
  items: Well[]
  total: number
  limit: number
  offset: number
}

/** Paginated list envelope returned by GET /readings. */
export interface PaginatedReadings {
  items: Reading[]
  total: number
  limit: number
  offset: number
}

/**
 * A supervisor's verdict on whether a well's data is confirmed. Deliberately
 * narrower than `ReviewStatus`: a well has no `discarded` state anywhere in the
 * system, and the endpoint 422s if you send one.
 */
export type WellVerificationStatus = 'pending' | 'approved'

/**
 * `POST /wells/{id}/review` — a judgement, never an edit. It sets only the
 * verification verdict; survey data is changed through change requests.
 *
 * `review_note` is written verbatim, so **omitting it clears any existing
 * note**. Send the current note back to preserve it.
 */
export interface WellReviewPayload {
  review_status: WellVerificationStatus
  review_note?: string | null
}

// ---- Well change requests (survey review queue) ----

/** How a proposed value differs from the well as it currently stands. */
export type ChangeType = 'filled' | 'changed' | 'cleared'

/** The value carried by the synthetic `location` diff row. */
export interface LatLon {
  latitude: number
  longitude: number
}

/** One field-level difference between the live well and a submitted survey. */
export interface WellFieldChange {
  /** A well field name, or the synthetic `location` (lat+lon move together). */
  field: string
  change_type: ChangeType
  /** Shape follows `field`: string, number, null, or `LatLon` for `location`. */
  current_value: unknown
  proposed_value: unknown
}

/**
 * A survey filed against an existing well — a *full snapshot* of what the
 * surveyor believes the well should be. Surveys never edit a well directly:
 * nothing here has touched the well until a reviewer approves it, and approval
 * applies the whole snapshot (there is no per-field accept).
 */
export interface WellChangeRequest {
  id: string
  client_id: string
  well_id: string
  /** Device-generated idempotency key, unique per tenant. */
  client_uuid: string
  submitted_by: string
  latitude: number
  longitude: number
  well_confirmed: boolean
  name: string | null
  well_type: WellType | null
  well_status: WellStatus | null
  daily_users_estimate: number | null
  distance_to_other_water_km: string | null
  opening_diameter_cm: string | null
  owner_name: string | null
  owner_mobile: string | null
  comments: string | null
  /** The *request's* own state — not the well's. */
  review_status: ReviewStatus
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null
  /** When the snapshot was written onto the well (approved requests only). */
  applied_at: string | null
  /** The well's `updated_at` at the moment the survey was submitted. */
  base_updated_at: string
  created_at: string
  updated_at: string
}

/** `GET /well-changes/{id}` — the request plus its diff against the live well. */
export interface WellChangeDetail extends WellChangeRequest {
  /**
   * Differences from the well *as it stands now*, recomputed on every read —
   * so an approved request comes back with an empty array (its snapshot is
   * already applied), while a discarded one still shows what it would have
   * changed. Only a pending request's diff is a decision aid.
   */
  changes: WellFieldChange[]
  /** The well was modified after this survey was submitted, so the diff
   *  reflects values the submitter never saw. */
  stale: boolean
}

/** Paginated envelope from `GET /well-changes` and `GET /wells/{id}/changes`. */
export interface PaginatedWellChanges {
  items: WellChangeRequest[]
  total: number
  limit: number
  offset: number
}

/** Accept the submitted snapshot onto the well, or reject it outright. */
export type ReviewDecision = 'approved' | 'discarded'

/** Whether the well itself counts as verified once the survey is applied. */
export type WellVerdict = 'pending' | 'approved'

/**
 * The two independent judgements a reviewer makes in one call: what happens to
 * the proposed data, and — only then — whether the well is now verified.
 */
export interface ReviewWellChangePayload {
  decision: ReviewDecision
  /** Required when approving; must be omitted when discarding (422 either way). */
  well_review_status?: WellVerdict
  review_note?: string
}

/**
 * `POST /well-changes/{id}/review` — the decided request alongside the well it
 * was judged against. Note this is *not* a `WellChangeDetail`: the response
 * carries no `changes[]`/`stale`, since a decided request's diff is meaningless.
 */
export interface ReviewWellChangeResponse {
  change: WellChangeRequest
  well: Well
}

// ---- Request payloads ----

export interface RegisterRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  phone_number?: string
  occupation?: string
  job_description?: string
  organisation?: string
  privacy_policy_agreed: boolean
  terms_agreed: boolean
}

export interface LoginRequest {
  email: string
  password: string
  device_hint?: string
}

export interface VerifyEmailRequest {
  email: string
  code: string
}

export interface VerifyResetOtpResponse {
  reset_token: string
}
