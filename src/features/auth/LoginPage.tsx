import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/http'
import { isPreAuth } from '@/lib/api/types'
import { messageForError } from '@/lib/errorCodes'
import { useAuth } from '@/providers/auth-context'

const schema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})
type Values = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const { applyLoginResponse } = useAuth()
  const [topError, setTopError] = useState<string | null>(null)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: Values) => {
    setTopError(null)
    setUnverifiedEmail(null)
    try {
      const res = await authApi.login({
        email: values.email,
        password: values.password,
        device_hint: navigator.userAgent.slice(0, 60),
      })
      await applyLoginResponse(res)
      navigate(isPreAuth(res) ? '/select-organisation' : '/', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.code === 'AUTH_EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(values.email)
      }
      setTopError(messageForError(err))
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Access the WellLite management console"
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {topError && (
          <Alert variant="destructive">
            <AlertDescription>
              {topError}
              {unverifiedEmail && (
                <>
                  {' '}
                  <Link
                    to="/verify-email"
                    state={{ email: unverifiedEmail }}
                    className="font-medium underline"
                  >
                    Verify now
                  </Link>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.org"
            aria-invalid={!!form.formState.errors.email}
            {...form.register('email')}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          error={form.formState.errors.password?.message}
        >
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!form.formState.errors.password}
            {...form.register('password')}
          />
        </Field>

        <div className="text-right">
          <Link
            to="/forgot-password"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  )
}
