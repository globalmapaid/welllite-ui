import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Member } from '@/lib/api/types'
import { messageForError } from '@/lib/errorCodes'
import { useRemoveMember } from './queries'

/** Confirm soft-removal of a member. Controlled via the `member` prop. */
export function RemoveMemberDialog({
  member,
  onClose,
}: {
  member: Member | null
  onClose: () => void
}) {
  const remove = useRemoveMember()

  const confirm = () => {
    if (!member) return
    remove.mutate(member.user_id, {
      onSuccess: () => {
        toast.success('Member removed.')
        onClose()
      },
      onError: (err) => toast.error(messageForError(err)),
    })
  }

  return (
    <Dialog open={!!member} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove member?</DialogTitle>
          <DialogDescription>
            {member && (
              <>
                {member.first_name} {member.last_name} ({member.email}) will lose
                access to this organisation and be signed out immediately. You can
                re-add them later by email.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={remove.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={confirm}
            disabled={remove.isPending}
          >
            {remove.isPending ? 'Removing…' : 'Remove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
