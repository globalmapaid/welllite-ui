import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authApi } from '@/lib/api/auth'
import { isPreAuth } from '@/lib/api/types'
import { messageForError } from '@/lib/errorCodes'
import { setPreAuthToken } from '@/lib/tokens'
import { useAuth } from '@/providers/auth-context'

const schema = z
  .object({
    code: z.string().regex(/^\d{4}$/, 'Enter the 4-digit code.'),
    new_password: z.string().min(8, 'At least 8 characters.'),
    confirm: z.string(),
  })
  .refine((v) => v.new_password === v.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match.',
  })
type Values = z.infer<typeof schema>

/**
 * Change the signed-in user's password. There is no authenticated
 * change-password endpoint, so this reuses the password-reset flow with the
 * session's own email pre-filled: send an OTP → verify → set new password.
 *
 * The backend revokes ALL refresh tokens on reset (including this session's), so
 * after the change we silently re-authenticate with the new password and restore
 * the same tenant scope — keeping the user signed in rather than bouncing them to
 * the login screen. If re-auth fails, we fall back to a clean sign-out.
 */
export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const {
    user,
    claims,
    logout,
    applyLoginResponse,
    selectMembership,
    switchTenant,
  } = useAuth()
  const [phase, setPhase] = useState<'request' | 'reset'>('request')
  const [sending, setSending] = useState(false)
  const [topError, setTopError] = useState<string | null>(null)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { code: '', new_password: '', confirm: '' },
  })

  // Reset to a clean state whenever the dialog is closed.
  useEffect(() => {
    if (!open) {
      setPhase('request')
      setTopError(null)
      setSending(false)
      form.reset()
    }
  }, [open, form])

  const sendCode = async () => {
    if (!user) return
    setTopError(null)
    setSending(true)
    try {
      await authApi.forgotPassword(user.email)
      setPhase('reset')
      toast.success('We emailed a verification code.')
    } catch (err) {
      setTopError(messageForError(err))
    } finally {
      setSending(false)
    }
  }

  const submit = async (values: Values) => {
    if (!user) return
    setTopError(null)

    // Snapshot the current scope so we can restore it after re-authenticating.
    const email = user.email
    const deviceHint = navigator.userAgent.slice(0, 60)
    const prevMembershipId = claims?.membership_id ?? null
    const prevClientId = claims?.client_id ?? null
    const wasSuperAdmin = user.is_super_admin

    // Step 1 — verify the OTP and set the new password.
    try {
      const { reset_token } = await authApi.verifyResetOtp(email, values.code)
      await authApi.resetPassword(reset_token, values.new_password)
    } catch (err) {
      setTopError(messageForError(err))
      return
    }

    // Step 2 — the reset revoked every session, so silently sign back in with the
    // new password and restore the previous tenant scope. Keeps the user in place.
    try {
      const res = await authApi.login({
        email,
        password: values.new_password,
        device_hint: deviceHint,
      })
      if (isPreAuth(res)) {
        if (prevMembershipId) {
          setPreAuthToken(res.pre_auth_token)
          await selectMembership(prevMembershipId, deviceHint)
        } else {
          // No prior membership to restore — fall through to org selection.
          await applyLoginResponse(res)
        }
      } else {
        await applyLoginResponse(res)
        if (wasSuperAdmin && prevClientId) {
          await switchTenant(prevClientId)
        }
      }
      toast.success('Password changed.')
      onOpenChange(false)
    } catch {
      // Re-auth failed unexpectedly — fall back to a clean sign-out.
      toast.success('Password changed. Please sign in again.')
      onOpenChange(false)
      await logout()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            {phase === 'request'
              ? `We'll email a verification code to ${user?.email}.`
              : 'Enter the code and choose a new password.'}
          </DialogDescription>
        </DialogHeader>

        {topError && (
          <Alert variant="destructive">
            <AlertDescription>{topError}</AlertDescription>
          </Alert>
        )}

        {phase === 'request' ? (
          <>
            <p className="text-sm text-muted-foreground">
              For security, changing your password is verified by email. You'll
              stay signed in on this device once it's done.
            </p>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={sending}
              >
                Cancel
              </Button>
              <Button type="button" onClick={sendCode} disabled={sending}>
                <MailCheck className="size-4" />
                {sending ? 'Sending…' : 'Send code'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
            <Field
              label="Verification code"
              htmlFor="cp-code"
              error={form.formState.errors.code?.message}
            >
              <Input
                id="cp-code"
                inputMode="numeric"
                maxLength={4}
                placeholder="1234"
                className="text-center text-lg tracking-[0.5em]"
                {...form.register('code')}
              />
            </Field>
            <Field
              label="New password"
              htmlFor="cp-new"
              error={form.formState.errors.new_password?.message}
              hint="At least 8 characters."
            >
              <Input
                id="cp-new"
                type="password"
                autoComplete="new-password"
                {...form.register('new_password')}
              />
            </Field>
            <Field
              label="Confirm password"
              htmlFor="cp-confirm"
              error={form.formState.errors.confirm?.message}
            >
              <Input
                id="cp-confirm"
                type="password"
                autoComplete="new-password"
                {...form.register('confirm')}
              />
            </Field>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={sendCode}
                disabled={sending || form.formState.isSubmitting}
              >
                {sending ? 'Resending…' : 'Resend code'}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving…' : 'Change password'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
