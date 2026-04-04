'use client'

import { useQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'
import type { Expense } from '@/lib/types/database.types'

export function useExpenses(groupId: string, page = 1, pageSize = 20) {
  const supabase = createBrowserClient()

  return useQuery<{ data: Expense[]; count: number }>({
    queryKey: ['expenses', groupId, page],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, error, count } = await supabase
        .from('expenses')
        .select('*', { count: 'exact' })
        .eq('group_id', groupId)
        .is('deleted_at', null)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error
      return { data: data ?? [], count: count ?? 0 }
    },
    enabled: !!groupId,
  })
}

export function useExpense(expenseId: string) {
  const supabase = createBrowserClient()

  return useQuery<Expense | null>({
    queryKey: ['expense', expenseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expenseId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!expenseId,
  })
}
