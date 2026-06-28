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
import { ApiError } from '@/lib/api/http'
import type { Role } from '@/lib/api/types'
import { messageForError } from '@/lib/errorCodes'
import { applyApiError } from '@/lib/formErrors'
import { ROLE_LABELS, ROLES } from '@/lib/roles'
import { useAssignMember } from './queries'

/** Assignment failures that are about the entered email — shown inline on the field. */
const EMAIL_ERROR_CODES = new Set([
  'AUTH_USER_NOT_FOUND',
  'CLIENT_MEMBER_ALREADY_EXISTS',
  'CLIENT_MEMBER_USER_INACTIVE',
  'CLIENT_MEMBER_USER_NOT_VERIFIED',
])

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
        onSuccess: (member) => {
          // The endpoint now returns the created/reactivated member, so confirm
          // exactly who was added and with which role.
          toast.success(
            `Added ${member.first_name} ${member.last_name} (${member.email}) as ${ROLE_LABELS[member.role]}.`,
          )
          form.reset()
          setOpen(false)
        },
        onError: (err) => {
          // Malformed input → inline field errors.
          if (err instanceof ApiError && err.errors.length > 0) {
            const top = applyApiError(err, form.setError, ['email'])
            if (top) toast.error(top)
            return
          }
          // Explicit assignment failures are about the email — show inline and
          // keep the dialog open so the admin can correct it and retry.
          if (err instanceof ApiError && EMAIL_ERROR_CODES.has(err.code)) {
            form.setError('email', { type: 'server', message: messageForError(err) })
            return
          }
          toast.error(messageForError(err))
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
