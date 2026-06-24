import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authApi } from '@/lib/api/auth'
import { messageForError } from '@/lib/errorCodes'

const otpSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  code: z.string().regex(/^\d{4}$/, 'Enter the 4-digit code.'),
})
type OtpValues = z.infer<typeof otpSchema>

const pwSchema = z
  .object({
    new_password: z.string().min(8, 'At least 8 characters.'),
    confirm: z.string(),
  })
  .refine((v) => v.new_password === v.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match.',
  })
type PwValues = z.infer<typeof pwSchema>

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefilledEmail = (location.state as { email?: string } | null)?.email ?? ''
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [topError, setTopError] = useState<string | null>(null)

  const otpForm = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { email: prefilledEmail, code: '' },
  })
  const pwForm = useForm<PwValues>({
    resolver: zodResolver(pwSchema),
    defaultValues: { new_password: '', confirm: '' },
  })

  const verifyOtp = async (values: OtpValues) => {
    setTopError(null)
    try {
      const { reset_token } = await authApi.verifyResetOtp(values.email, values.code)
      setResetToken(reset_token)
    } catch (err) {
      setTopError(messageForError(err))
    }
  }

  const setPassword = async (values: PwValues) => {
    if (!resetToken) return
    setTopError(null)
    try {
      await authApi.resetPassword(resetToken, values.new_password)
      toast.success('Password reset. You can now sign in.')
      navigate('/login', { replace: true })
    } catch (err) {
      setTopError(messageForError(err))
    }
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle={
        resetToken
          ? 'Choose a new password for your account'
          : 'Enter the code we emailed you'
      }
      footer={
        <>
          Back to{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            sign in
          </Link>
        </>
      }
    >
      {topError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{topError}</AlertDescription>
        </Alert>
      )}

      {!resetToken ? (
        <form onSubmit={otpForm.handleSubmit(verifyOtp)} className="space-y-4" noValidate>
          <Field label="Email" htmlFor="email" error={otpForm.formState.errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...otpForm.register('email')} />
          </Field>
          <Field
            label="Reset code"
            htmlFor="code"
            error={otpForm.formState.errors.code?.message}
          >
            <Input
              id="code"
              inputMode="numeric"
              maxLength={4}
              placeholder="1234"
              className="text-center text-lg tracking-[0.5em]"
              {...otpForm.register('code')}
            />
          </Field>
          <Button type="submit" className="w-full" disabled={otpForm.formState.isSubmitting}>
            {otpForm.formState.isSubmitting ? 'Verifying…' : 'Verify code'}
          </Button>
        </form>
      ) : (
        <form onSubmit={pwForm.handleSubmit(setPassword)} className="space-y-4" noValidate>
          <Field
            label="New password"
            htmlFor="new_password"
            error={pwForm.formState.errors.new_password?.message}
            hint="At least 8 characters."
          >
            <Input
              id="new_password"
              type="password"
              autoComplete="new-password"
              {...pwForm.register('new_password')}
            />
          </Field>
          <Field
            label="Confirm password"
            htmlFor="confirm"
            error={pwForm.formState.errors.confirm?.message}
          >
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              {...pwForm.register('confirm')}
            />
          </Field>
          <Button type="submit" className="w-full" disabled={pwForm.formState.isSubmitting}>
            {pwForm.formState.isSubmitting ? 'Saving…' : 'Set new password'}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
