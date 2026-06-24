import { useQuery } from '@tanstack/react-query'
import { Building2, ChevronRight, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { authApi } from '@/lib/api/auth'
import { ROLE_LABELS } from '@/lib/roles'
import { messageForError } from '@/lib/errorCodes'
import { clearSession } from '@/lib/tokens'
import { useAuth } from '@/providers/auth-context'

export function SelectOrganisationPage() {
  const navigate = useNavigate()
  const { status, selectMembership } = useAuth()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [topError, setTopError] = useState<string | null>(null)

  const membershipsQuery = useQuery({
    queryKey: ['memberships'],
    queryFn: authApi.memberships,
    enabled: status === 'preauth',
  })

  if (status === 'authenticated') return <Navigate to="/" replace />
  if (status === 'unauthenticated') return <Navigate to="/login" replace />

  const choose = async (membershipId: string) => {
    setTopError(null)
    setPendingId(membershipId)
    try {
      await selectMembership(membershipId, navigator.userAgent.slice(0, 60))
      navigate('/', { replace: true })
    } catch (err) {
      setTopError(messageForError(err))
      setPendingId(null)
    }
  }

  const startOver = () => {
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <AuthLayout
      title="Choose an organisation"
      subtitle="Your account belongs to more than one organisation"
      footer={
        <button
          type="button"
          onClick={startOver}
          className="font-medium text-primary hover:underline"
        >
          Sign in as a different user
        </button>
      }
    >
      <div className="space-y-3">
        {topError && (
          <Alert variant="destructive">
            <AlertDescription>{topError}</AlertDescription>
          </Alert>
        )}

        {membershipsQuery.isLoading && (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        )}

        {membershipsQuery.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {messageForError(membershipsQuery.error)}
            </AlertDescription>
          </Alert>
        )}

        {membershipsQuery.data?.map((m) => (
          <button
            key={m.membership_id}
            type="button"
            onClick={() => choose(m.membership_id)}
            disabled={pendingId !== null}
            className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/50 disabled:opacity-60"
          >
            <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{m.client_name}</div>
              <Badge variant="muted" className="mt-1">
                {ROLE_LABELS[m.role]}
              </Badge>
            </div>
            {pendingId === m.membership_id ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <ChevronRight className="size-5 text-muted-foreground" />
            )}
          </button>
        ))}

        {membershipsQuery.data?.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No active organisations found for your account.
          </p>
        )}
      </div>
    </AuthLayout>
  )
}
