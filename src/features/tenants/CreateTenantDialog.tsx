import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
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
import { clientsApi } from '@/lib/api/clients'
import { applyApiError } from '@/lib/formErrors'

const schema = z.object({
  name: z.string().min(1, 'Required.').max(255),
})
type Values = z.infer<typeof schema>

export function CreateTenantDialog() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  })

  const mutation = useMutation({
    mutationFn: (name: string) => clientsApi.create(name),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast.success(`Created “${created.name}”.`)
      form.reset()
      setOpen(false)
    },
    onError: (err) => {
      const top = applyApiError(err, form.setError, ['name'])
      if (top) toast.error(top)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            Create a project. Members are added separately via their memberships.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((v) => mutation.mutate(v.name))}
          className="space-y-4"
          noValidate
        >
          <Field label="Name" htmlFor="name" error={form.formState.errors.name?.message}>
            <Input id="name" placeholder="e.g. Arba Minch University" {...form.register('name')} />
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
