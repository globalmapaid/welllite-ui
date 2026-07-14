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
import { ApiError } from '@/lib/api/http'
import { clientsApi } from '@/lib/api/clients'
import { messageForError } from '@/lib/errorCodes'
import { applyApiError } from '@/lib/formErrors'
import { CountryEditor } from './CountryEditor'

const schema = z.object({
  name: z.string().min(1, 'Required.').max(255),
})
type Values = z.infer<typeof schema>

export function CreateTenantDialog() {
  const [open, setOpen] = useState(false)
  const [countries, setCountries] = useState<string[]>([])
  const [invalidCodes, setInvalidCodes] = useState<string[]>([])
  const queryClient = useQueryClient()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  })

  const reset = () => {
    form.reset()
    setCountries([])
    setInvalidCodes([])
  }

  const mutation = useMutation({
    mutationFn: (name: string) => clientsApi.create(name, countries),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast.success(`Created “${created.name}”.`)
      reset()
      setOpen(false)
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'CLIENT_UNSUPPORTED_COUNTRY') {
        const bad = (err.params?.countries as string[] | undefined) ?? []
        setInvalidCodes(bad)
        toast.error(
          bad.length
            ? `Not supported: ${bad.join(', ')}. Remove or correct these countries.`
            : messageForError(err),
        )
        return
      }
      const top = applyApiError(err, form.setError, ['name'])
      if (top) toast.error(top)
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
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
          <Field
            label="Operating countries"
            htmlFor="create-country"
            hint="Well coordinates are validated against these. You can also set them later."
          >
            <CountryEditor
              id="create-country"
              value={countries}
              onChange={(next) => {
                setCountries(next)
                setInvalidCodes([])
              }}
              invalidCodes={invalidCodes}
              disabled={mutation.isPending}
            />
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
