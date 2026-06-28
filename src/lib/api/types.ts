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
