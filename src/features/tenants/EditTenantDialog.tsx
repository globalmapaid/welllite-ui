import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
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
} from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ApiError } from '@/lib/api/http'
import { clientsApi } from '@/lib/api/clients'
import type { ClientTenant } from '@/lib/api/types'
import { messageForError } from '@/lib/errorCodes'
import { applyApiError } from '@/lib/formErrors'
import { CountryEditor } from './CountryEditor'

const schema = z.object({
  name: z.string().min(1, 'Required.').max(255),
  is_active: z.boolean(),
})
type Values = z.infer<typeof schema>

/** Order-insensitive equality for two code lists. */
function sameCodes(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((c) => set.has(c))
}

export function EditTenantDialog({
  tenant,
  onClose,
}: {
  tenant: ClientTenant | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [countries, setCountries] = useState<string[]>([])
  const [invalidCodes, setInvalidCodes] = useState<string[]>([])
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', is_active: true },
  })

  useEffect(() => {
    if (tenant) {
      form.reset({ name: tenant.name, is_active: tenant.is_active })
      setCountries(tenant.countries ?? [])
      setInvalidCodes([])
    }
  }, [tenant, form])

  const mutation = useMutation({
    mutationFn: async (values: Values) => {
      let updated: ClientTenant | null = null
      const detailsChanged =
        values.name !== tenant!.name || values.is_active !== tenant!.is_active
      if (detailsChanged) {
        updated = await clientsApi.update(tenant!.id, values)
      }
      if (!sameCodes(countries, tenant!.countries ?? [])) {
        // Country list is its own endpoint; run after the PATCH so a rejected
        // code doesn't undo a valid name/status change.
        updated = await clientsApi.setCountries(tenant!.id, countries)
      }
      return updated
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['tenant', 'me'] })
      toast.success(`Saved “${updated?.name ?? tenant?.name}”.`)
      onClose()
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
        // Refresh cache so any name/status change that already landed is visible.
        queryClient.invalidateQueries({ queryKey: ['tenants'] })
        return
      }
      const top = applyApiError(err, form.setError, ['name'])
      if (top) toast.error(top)
    },
  })

  return (
    <Dialog open={!!tenant} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
          <DialogDescription>
            Update the project name, active status, or operating countries.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4"
          noValidate
        >
          <Field label="Name" htmlFor="edit-name" error={form.formState.errors.name?.message}>
            <Input id="edit-name" {...form.register('name')} />
          </Field>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="edit-active">Active</Label>
              <p className="text-xs text-muted-foreground">
                Inactive projects block their members from signing in.
              </p>
            </div>
            <Controller
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <Switch
                  id="edit-active"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <Field
            label="Operating countries"
            htmlFor="add-country"
            hint="Well coordinates are validated against these. A project with no countries can’t accept wells."
          >
            <CountryEditor
              id="add-country"
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
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
