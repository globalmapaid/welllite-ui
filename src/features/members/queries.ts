import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  membersApi,
  type AssignMemberPayload,
  type ListMembersParams,
  type UpdateMemberPayload,
} from '@/lib/api/members'

const MEMBERS_KEY = ['members'] as const

/** A page of the current tenant's members. Keeps the previous page visible
 *  while the next one loads, for flicker-free paging. */
export function useMembers(params: ListMembersParams) {
  return useQuery({
    queryKey: [...MEMBERS_KEY, params],
    queryFn: () => membersApi.list(params),
    placeholderData: keepPreviousData,
  })
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
