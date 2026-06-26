import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  membersApi,
  type AssignMemberPayload,
  type UpdateMemberPayload,
} from '@/lib/api/members'

const MEMBERS_KEY = ['members'] as const

/** All members of the current tenant (active + soft-removed). */
export function useMembers() {
  return useQuery({ queryKey: MEMBERS_KEY, queryFn: membersApi.list })
}

export function useAssignMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: AssignMemberPayload) => membersApi.assign(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: MEMBERS_KEY }),
  })
}

export function useUpdateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string
      payload: UpdateMemberPayload
    }) => membersApi.update(userId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: MEMBERS_KEY }),
  })
}

export function useRemoveMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => membersApi.remove(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: MEMBERS_KEY }),
  })
}
