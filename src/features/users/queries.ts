import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { usersApi, type ListUsersParams } from '@/lib/api/users'

/** A page of the platform-wide user directory (super-admin). */
export function usePlatformUsers(params: ListUsersParams) {
  return useQuery({
    queryKey: ['platform-users', params],
    queryFn: () => usersApi.list(params),
    placeholderData: keepPreviousData,
  })
}
