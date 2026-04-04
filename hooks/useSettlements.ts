'use client'

import { useQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'
import type { Settlement } from '@/lib/types/database.types'

export function useSettlements(groupId: string) {
  const supabase = createBrowserClient()

  return useQuery<Settlement[]>({
    queryKey: ['settlements', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .eq('group_id', groupId)
        .order('settled_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
    enabled: !!groupId,
  })
}
