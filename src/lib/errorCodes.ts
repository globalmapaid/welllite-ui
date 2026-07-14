import { ApiError } from './api/http'

/**
 * Maps the backend's stable error/success codes to friendly UI copy.
 * This is the single place to localise: swap this map for a per-locale lookup.
 * Unknown codes fall back to the envelope's English `message`.
 */
export const CODE_MESSAGES: Record<string, string> = {
  // Auth — errors
  AUTH_INVALID_CREDENTIALS: 'Incorrect email or password.',
  AUTH_ACCOUNT_DISABLED: 'This account has been disabled. Contact your administrator.',
  AUTH_EMAIL_NOT_VERIFIED:
    'Your email is not verified yet. Check your inbox for the verification code.',
  AUTH_NO_ACTIVE_MEMBERSHIP:
    'Your account has no active project membership. Contact your administrator.',
  AUTH_EMAIL_ALREADY_REGISTERED: 'An account with this email already exists.',
  AUTH_VERIFICATION_CODE_INVALID:
    'That verification code is incorrect or has expired. Request a new one.',
  AUTH_RESET_CODE_INVALID:
    'That reset code is incorrect or has expired. Request a new one.',
  AUTH_USER_NOT_FOUND: 'No account was found for that email.',
  AUTH_REFRESH_TOKEN_INVALID: 'Your session has expired. Please sign in again.',
  AUTH_MEMBERSHIP_INACTIVE:
    'Your membership in this project is no longer active.',
  AUTH_MEMBERSHIP_NOT_FOUND: 'That project membership is unavailable.',
  AUTH_INVALID_TOKEN: 'Your session has expired. Please sign in again.',
  AUTH_NO_TENANT_SELECTED: 'Select a project to continue.',
  AUTH_SUPER_ADMIN_REQUIRED: 'You do not have permission to do that.',

  // Clients
  CLIENT_NOT_FOUND: 'That project could not be found.',
  CLIENT_UNSUPPORTED_COUNTRY:
    'One or more country codes aren’t supported for coordinate validation.',

  // Project member management
  AUTH_CLIENT_ADMIN_REQUIRED:
    'Only project admins can manage team members.',
  CLIENT_MEMBER_NOT_FOUND: 'That person is not a member of this project.',
  CLIENT_CANNOT_MODIFY_SELF: 'You cannot change or remove your own membership.',
  CLIENT_LAST_ADMIN:
    'This is the only project admin. Promote another admin before removing or demoting them.',
  CLIENT_MEMBER_ALREADY_EXISTS:
    'That person is already an active member of this project.',
  CLIENT_MEMBER_USER_INACTIVE:
    'That account is disabled, so they can’t be added.',
  CLIENT_MEMBER_USER_NOT_VERIFIED:
    'That person hasn’t verified their email yet, so they can’t be added.',

  // Wells & readings (field data)
  WELL_NOT_FOUND: 'That well could not be found in this project.',
  WELL_ALREADY_EXISTS: 'A well with this identifier already exists.',
  WELL_COORDINATE_LIKELY_TRANSPOSED:
    'The coordinates look swapped (latitude and longitude reversed).',
  WELL_COORDINATE_OUT_OF_RANGE:
    'The coordinates are not valid WGS84 latitude/longitude values.',
  WELL_COORDINATE_OUTSIDE_COUNTRY:
    'The coordinates fall outside the project’s configured countries.',
  CLIENT_NO_COUNTRIES:
    'This project has no countries configured yet. Ask a super-admin to set them before capturing wells.',
  READING_NOT_FOUND: 'That reading could not be found in this project.',
  READING_ALREADY_EXISTS: 'A reading with this identifier already exists.',
  SYNC_CONFLICT: 'Another sync is in progress. Please try again.',

  // Validation (root + common field codes)
  VALIDATION_FAILED: 'Please correct the highlighted fields.',
  VALIDATION_MISSING: 'This field is required.',
  VALIDATION_STRING_TOO_SHORT: 'This value is too short.',
  VALIDATION_STRING_TOO_LONG: 'This value is too long.',
  VALIDATION_PRIVACY_POLICY_REQUIRED: 'You must accept the privacy policy.',
  VALIDATION_TERMS_REQUIRED: 'You must accept the terms.',

  UNKNOWN: 'Something went wrong. Please try again.',
}

/** Resolve a friendly, top-level message for any thrown error. */
export function messageForError(err: unknown): string {
  if (err instanceof ApiError) {
    return CODE_MESSAGES[err.code] ?? err.message ?? CODE_MESSAGES.UNKNOWN
  }
  if (err instanceof TypeError) {
    // fetch network failure (server down / CORS)
    return 'Cannot reach the server. Check your connection and try again.'
  }
  if (err instanceof Error) return err.message
  return CODE_MESSAGES.UNKNOWN
}

/** Resolve a friendly message for a specific field code (validation errors). */
export function messageForFieldCode(code: string): string {
  return CODE_MESSAGES[code] ?? 'Invalid value.'
}
