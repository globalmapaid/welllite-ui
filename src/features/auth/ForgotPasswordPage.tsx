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
import { messageForError } from '@/lib/errorCodes'

const schema = z.object({
  email: z.string().email('Enter a valid email address.'),
})
type Values = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [topError, setTopError] = useState<string | null>(null)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (values: Values) => {
    setTopError(null)
    try {
      await authApi.forgotPassword(values.email)
      navigate('/reset-password', { state: { email: values.email }, replace: true })
    } catch (err) {
      setTopError(messageForError(err))
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a 4-digit code to reset it"
      footer={
        <>
          Remembered it?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
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
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Sending…' : 'Send reset code'}
        </Button>
      </form>
    </AuthLayout>
  )
}
