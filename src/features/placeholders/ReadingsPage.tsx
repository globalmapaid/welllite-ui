import { Droplets } from 'lucide-react'
import { ComingSoon } from '@/components/ComingSoon'
import { PageHeader } from '@/components/PageHeader'

export function ReadingsPage() {
  return (
    <div>
      <PageHeader
        title="Readings"
        description="Static Water Level (SWL) readings recorded against wells."
      />
      <ComingSoon
        icon={Droplets}
        title="Readings are coming soon"
        description="This page will list Static Water Level readings with their timestamps and source well once the backend exposes the readings endpoints."
        endpoints={['POST /readings', 'GET /readings?well_id=…']}
      />
    </div>
  )
}
