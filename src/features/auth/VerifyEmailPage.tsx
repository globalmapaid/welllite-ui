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

const schema = z.object({
  email: z.string().email('Enter a valid email address.'),
  code: z.string().regex(/^\d{4}$/, 'Enter the 4-digit code.'),
})
type Values = z.infer<typeof schema>

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefilledEmail = (location.state as { email?: string } | null)?.email ?? ''
  const [topError, setTopError] = useState<string | null>(null)
  const [resending, setResending] = useState(false)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: prefilledEmail, code: '' },
  })

  const onSubmit = async (values: Values) => {
    setTopError(null)
    try {
      await authApi.verifyEmail(values)
      toast.success('Email verified. You can now sign in.')
      navigate('/login', { replace: true })
    } catch (err) {
      setTopError(messageForError(err))
    }
  }

  const resend = async () => {
    const email = form.getValues('email')
    if (!email) {
      setTopError('Enter your email to resend the code.')
      return
    }
    setResending(true)
    try {
      await authApi.resendVerification(email)
      toast.success('If that account is unverified, a new code has been sent.')
    } catch (err) {
      setTopError(messageForError(err))
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Enter the 4-digit code we sent to your inbox"
      footer={
        <>
          Back to{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            sign in
          </Link>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {topError && (
          <Alert variant="destructive">
            <AlertDescription>{topError}</AlertDescription>
          </Alert>
        )}

        <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
        </Field>

        <Field
          label="Verification code"
          htmlFor="code"
          error={form.formState.errors.code?.message}
        >
          <Input
            id="code"
            inputMode="numeric"
            maxLength={4}
            placeholder="1234"
            className="text-center text-lg tracking-[0.5em]"
            {...form.register('code')}
          />
        </Field>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Verifying…' : 'Verify email'}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={resend}
          disabled={resending}
        >
          {resending ? 'Sending…' : 'Resend code'}
        </Button>
      </form>
    </AuthLayout>
  )
}
