'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useNetworkStatus } from './useNetworkStatus'
import { addMember } from '@/app/actions/groups'
import type { createGroup } from '@/app/actions/groups'

type CreateGroupInput = Parameters<typeof createGroup>[0]
type GroupResult = { id: string } | null

export function useCreateGroup() {
  const queryClient = useQueryClient()
  const isOnline = useNetworkStatus()

  return useMutation<GroupResult, Error, CreateGroupInput>({
    mutationKey: ['createGroup'],
    // mutationFn inherited from setMutationDefaults in providers.tsx
    onMutate: () => {
      if (!isOnline) {
        toast.info('Saved offline — will sync when connected')
      }
    },
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ['my-groups-with-balances'] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      return group
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create group')
    },
  })
}

/** Add members to a group after creation (online only, called from onSuccess) */
export async function addMembersToGroup(
  groupId: string,
  emails: string[],
): Promise<{ added: number; invited: number; errors: string[] }> {
  let added = 0
  let invited = 0
  const errors: string[] = []

  for (const email of emails) {
    if (!email.trim()) continue
    const result = await addMember(groupId, email.trim())
    if (result?.error) {
      errors.push(`${email}: ${result.error}`)
    } else if (result?.invited) {
      invited++
    } else {
      added++
    }
  }

  return { added, invited, errors }
}
