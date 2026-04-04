'use client'

import { useQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'
import type { Group } from '@/lib/types/database.types'

export function useGroups(includeArchived = false) {
  const supabase = createBrowserClient()

  return useQuery<Group[]>({
    queryKey: ['groups', includeArchived],
    queryFn: async () => {
      let query = supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false })

      if (!includeArchived) {
        query = query.is('archived_at', null)
      }

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
  })
}

export function useGroup(groupId: string) {
  const supabase = createBrowserClient()

  return useQuery<Group | null>({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!groupId,
  })
}
