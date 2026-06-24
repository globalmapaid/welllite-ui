import { Gauge } from 'lucide-react'
import { ComingSoon } from '@/components/ComingSoon'
import { PageHeader } from '@/components/PageHeader'

export function WellsPage() {
  return (
    <div>
      <PageHeader
        title="Wells"
        description="Well locations captured in the field, with coordinate validation."
      />
      <ComingSoon
        icon={Gauge}
        title="Wells are coming soon"
        description="Once the backend exposes the wells endpoints, this page will list each tenant's wells, show their validated WGS84 coordinates and original projection, and flag transposed or out-of-bounds entries."
        endpoints={['POST /wells', 'GET /wells', 'GET /wells/{id}']}
      />
    </div>
  )
}
