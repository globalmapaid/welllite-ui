import { zodResolver } from '@hookform/resolvers/zod'
import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import type { Role } from '@/lib/api/types'
import { applyApiError } from '@/lib/formErrors'
import { ROLE_LABELS, ROLES } from '@/lib/roles'
import { useAssignMember } from './queries'

const schema = z.object({
  email: z.string().email('Enter a valid email address.'),
  role: z.enum(['client_admin', 'supervisor', 'member']),
})
type Values = z.infer<typeof schema>

export function AddMemberDialog() {
  const [open, setOpen] = useState(false)
  const assign = useAssignMember()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', role: 'member' },
  })

  const onSubmit = (values: Values) => {
    assign.mutate(
      { email: values.email, role: values.role as Role },
      {
        onSuccess: () => {
          // Anti-enumeration: a 202 doesn't confirm a real account, so keep the
          // copy neutral. The invalidated list refetch shows the real result.
          toast.success("If that account exists, they've been added to your team.")
          form.reset()
          setOpen(false)
        },
        onError: (err) => {
          const top = applyApiError(err, form.setError, ['email'])
          if (top) toast.error(top)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="size-4" />
          Add member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a team member</DialogTitle>
          <DialogDescription>
            Enter the email of an existing WellLite account to add them to this
            organisation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Email" htmlFor="member-email" error={form.formState.errors.email?.message}>
            <Input
              id="member-email"
              type="email"
              autoComplete="off"
              placeholder="person@example.org"
              {...form.register('email')}
            />
          </Field>
          <Field label="Role" htmlFor="member-role" error={form.formState.errors.role?.message}>
            <NativeSelect id="member-role" {...form.register('role')}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={assign.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={assign.isPending}>
              {assign.isPending ? 'Adding…' : 'Add member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
