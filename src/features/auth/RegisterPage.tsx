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
import { applyApiError } from '@/lib/formErrors'

const schema = z.object({
  first_name: z.string().min(1, 'Required.').max(150),
  last_name: z.string().min(1, 'Required.').max(150),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'At least 8 characters.'),
  phone_number: z
    .string()
    .max(30)
    .optional()
    .or(z.literal('')),
  organisation: z.string().max(255).optional().or(z.literal('')),
  occupation: z.string().max(255).optional().or(z.literal('')),
  privacy_policy_agreed: z.literal(true, {
    message: 'You must accept the privacy policy.',
  }),
  terms_agreed: z.literal(true, { message: 'You must accept the terms.' }),
})
type Values = z.infer<typeof schema>

const FIELDS = [
  'first_name',
  'last_name',
  'email',
  'password',
  'phone_number',
  'organisation',
  'occupation',
] as const

export function RegisterPage() {
  const navigate = useNavigate()
  const [topError, setTopError] = useState<string | null>(null)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      phone_number: '',
      organisation: '',
      occupation: '',
      privacy_policy_agreed: false as unknown as true,
      terms_agreed: false as unknown as true,
    },
  })
  const { errors } = form.formState

  const onSubmit = async (values: Values) => {
    setTopError(null)
    try {
      await authApi.register({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        password: values.password,
        phone_number: values.phone_number || undefined,
        organisation: values.organisation || undefined,
        occupation: values.occupation || undefined,
        privacy_policy_agreed: values.privacy_policy_agreed,
        terms_agreed: values.terms_agreed,
      })
      navigate('/verify-email', { state: { email: values.email }, replace: true })
    } catch (err) {
      const top = applyApiError(err, form.setError, FIELDS)
      if (top) setTopError(top)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Register to manage WellLite data and organisations"
      footer={
        <>
          Already have an account?{' '}
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

        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" htmlFor="first_name" error={errors.first_name?.message}>
            <Input id="first_name" autoComplete="given-name" {...form.register('first_name')} />
          </Field>
          <Field label="Last name" htmlFor="last_name" error={errors.last_name?.message}>
            <Input id="last_name" autoComplete="family-name" {...form.register('last_name')} />
          </Field>
        </div>

        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          hint="At least 8 characters."
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...form.register('password')}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Organisation" htmlFor="organisation" error={errors.organisation?.message}>
            <Input id="organisation" {...form.register('organisation')} />
          </Field>
          <Field label="Phone" htmlFor="phone_number" error={errors.phone_number?.message}>
            <Input id="phone_number" placeholder="+251…" {...form.register('phone_number')} />
          </Field>
        </div>

        <div className="space-y-2 pt-1">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded border-input accent-[var(--color-primary)]"
              {...form.register('privacy_policy_agreed')}
            />
            <span>I accept the privacy policy.</span>
          </label>
          {errors.privacy_policy_agreed && (
            <p className="text-xs text-destructive">
              {errors.privacy_policy_agreed.message}
            </p>
          )}
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded border-input accent-[var(--color-primary)]"
              {...form.register('terms_agreed')}
            />
            <span>I accept the terms of service.</span>
          </label>
          {errors.terms_agreed && (
            <p className="text-xs text-destructive">{errors.terms_agreed.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  )
}
