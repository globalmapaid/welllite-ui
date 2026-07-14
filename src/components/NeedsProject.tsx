import { FolderTree } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Shown on tenant-scoped pages when an (unscoped) super-admin hasn't picked a
 * project yet — the wells/readings endpoints 403 AUTH_NO_TENANT_SELECTED until
 * they do. Mirrors the guidance on the dashboard's "Current project" card.
 */
export function NeedsProject() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FolderTree className="size-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Select a project</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Use the project switcher above to scope into a project and view its
            field data.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
