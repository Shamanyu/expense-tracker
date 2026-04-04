'use client'

import { useQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'
import type { ExpenseSplit } from '@/lib/types/database.types'

export function useExpenseSplits(expenseId: string) {
  const supabase = createBrowserClient()

  return useQuery<ExpenseSplit[]>({
    queryKey: ['expense-splits', expenseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_splits')
        .select('*')
        .eq('expense_id', expenseId)

      if (error) throw error
      return data ?? []
    },
    enabled: !!expenseId,
  })
}
