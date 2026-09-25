import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authApi } from '@/lib/api/auth'
import { applyApiError } from '@/lib/formErrors'
import { useAuth } from '@/providers/auth-context'

const schema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})
type Values = z.infer<typeof schema>

/**
 * Self-service account deletion. Public on purpose: the endpoint authenticates
 * with email + password rather than a token, so a user with no active
 * membership — who can't sign in at all — can still delete their account.
 * Signed-in users arrive from their profile with the email locked to their own.
 */
export function DeleteAccountPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { status, user, discardSession } = useAuth()
  const [topError, setTopError] = useState<string | null>(null)

  const signedIn = status === 'authenticated' && !!user
  const stateEmail = (location.state as { email?: string } | null)?.email
  const email = signedIn ? user.email : (stateEmail ?? '')

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: { email, password: '' },
    resetOptions: { keepDirtyValues: true },
  })

  const onSubmit = async (values: Values) => {
    setTopError(null)
    try {
      await authApi.deleteAccount(values.email, values.password)
    } catch (err) {
      setTopError(applyApiError(err, form.setError, ['email', 'password']))
      return
    }
    // Every session was revoked server-side; drop whatever this browser holds.
    discardSession()
    toast.success('Your account has been deleted.')
    navigate('/login', { replace: true })
  }

  return (
    <AuthLayout
      title="Delete account"
      subtitle="Permanently remove your WellLite account"
      footer={
        <Link
          to={signedIn ? '/profile' : '/login'}
          className="font-medium text-primary hover:underline"
        >
          {signedIn ? 'Keep my account' : 'Back to sign in'}
        </Link>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Alert variant="destructive">
          <AlertDescription className="space-y-2">
            <AlertTitle>This can’t be undone.</AlertTitle>
            <ul className="list-disc space-y-1 pl-4">
              <li>Your account and profile are deleted permanently.</li>
              <li>You’re signed out everywhere and removed from every project.</li>
              <li>
                Wells, readings, photos and surveys you collected{' '}
                <strong>stay with their project</strong>, no longer attributed
                to you.
              </li>
              <li>You can register again later with the same email.</li>
            </ul>
          </AlertDescription>
        </Alert>

        {topError && (
          <Alert variant="destructive">
            <AlertDescription>{topError}</AlertDescription>
          </Alert>
        )}

        <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.org"
            readOnly={signedIn}
            aria-invalid={!!form.formState.errors.email}
            {...form.register('email')}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          error={form.formState.errors.password?.message}
          hint="Re-enter your password to confirm."
        >
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            autoFocus={!!email}
            aria-invalid={!!form.formState.errors.password}
            {...form.register('password')}
          />
        </Field>

        <Button
          type="submit"
          variant="destructive"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          <Trash2 className="size-4" />
          {form.formState.isSubmitting ? 'Deleting…' : 'Delete my account'}
        </Button>
      </form>
    </AuthLayout>
  )
}
