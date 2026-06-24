import { request } from './http'
import type {
  CurrentUser,
  LoginRequest,
  LoginResponse,
  Membership,
  MessageEnvelope,
  RegisterRequest,
  TokenPair,
  VerifyEmailRequest,
  VerifyResetOtpResponse,
} from './types'

export const authApi = {
  register: (payload: RegisterRequest) =>
    request<MessageEnvelope>('/auth/register', {
      method: 'POST',
      body: payload,
      auth: 'none',
    }),

  verifyEmail: (payload: VerifyEmailRequest) =>
    request<MessageEnvelope>('/auth/verify-email', {
      method: 'POST',
      body: payload,
      auth: 'none',
    }),

  resendVerification: (email: string) =>
    request<MessageEnvelope>('/auth/resend-verification', {
      method: 'POST',
      body: { email },
      auth: 'none',
    }),

  login: (payload: LoginRequest) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: payload,
      auth: 'none',
    }),

  /** Pre-auth or access token both accepted by the backend. */
  memberships: () =>
    request<Membership[]>('/auth/memberships', { auth: 'preauth' }),

  selectClient: (membership_id: string, device_hint?: string) =>
    request<TokenPair>('/auth/select-client', {
      method: 'POST',
      body: { membership_id, device_hint },
      auth: 'preauth',
    }),

  switchClient: (client_id: string, device_hint?: string) =>
    request<TokenPair>('/auth/switch-client', {
      method: 'POST',
      body: { client_id, device_hint },
      auth: 'access',
    }),

  forgotPassword: (email: string) =>
    request<MessageEnvelope>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
      auth: 'none',
    }),

  verifyResetOtp: (email: string, code: string) =>
    request<VerifyResetOtpResponse>('/auth/verify-reset-otp', {
      method: 'POST',
      body: { email, code },
      auth: 'none',
    }),

  resetPassword: (reset_token: string, new_password: string) =>
    request<MessageEnvelope>('/auth/reset-password', {
      method: 'POST',
      body: { reset_token, new_password },
      auth: 'none',
    }),

  logout: (refresh_token: string) =>
    request<void>('/auth/logout', {
      method: 'POST',
      body: { refresh_token },
      auth: 'none',
    }),

  me: () => request<CurrentUser>('/auth/me', { auth: 'access' }),
}
