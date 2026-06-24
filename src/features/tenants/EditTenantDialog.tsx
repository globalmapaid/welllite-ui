import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
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
import { clientsApi, type UpdateTenantPayload } from '@/lib/api/clients'
import type { ClientTenant } from '@/lib/api/types'
import { applyApiError } from '@/lib/formErrors'

const schema = z.object({
  name: z.string().min(1, 'Required.').max(255),
  is_active: z.boolean(),
})
type Values = z.infer<typeof schema>

export function EditTenantDialog({
  tenant,
  onClose,
}: {
  tenant: ClientTenant | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', is_active: true },
  })

  useEffect(() => {
    if (tenant) form.reset({ name: tenant.name, is_active: tenant.is_active })
  }, [tenant, form])

  const mutation = useMutation({
    mutationFn: (payload: UpdateTenantPayload) =>
      clientsApi.update(tenant!.id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['tenant', 'me'] })
      toast.success(`Saved “${updated.name}”.`)
      onClose()
    },
    onError: (err) => {
      const top = applyApiError(err, form.setError, ['name'])
      if (top) toast.error(top)
    },
  })

  return (
    <Dialog open={!!tenant} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit organisation</DialogTitle>
          <DialogDescription>
            Update the organisation name or active status.
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
                Inactive organisations block their members from signing in.
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
