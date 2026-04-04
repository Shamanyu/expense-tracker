'use client'

import { useQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'
import type { GroupMemberWithProfile } from '@/lib/types/app.types'

export function useGroupMembers(groupId: string) {
  const supabase = createBrowserClient()

  return useQuery<GroupMemberWithProfile[]>({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_members')
        .select('*, profile:profiles(*)')
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true })

      if (error) throw error
      return (data ?? []).map((m: Record<string, unknown>) => ({
        ...m,
        profile: m.profile,
      })) as GroupMemberWithProfile[]
    },
    enabled: !!groupId,
  })
}
