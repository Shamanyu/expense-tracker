'use client'

import { useQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'
import { computeNetBalances, simplifyDebts } from '@/lib/utils/balances'
import type { DebtSimplification } from '@/lib/types/app.types'

export function useBalances(groupId: string) {
  const supabase = createBrowserClient()

  return useQuery<{
    netBalances: Record<string, number>
    simplifiedDebts: DebtSimplification[]
  }>({
    queryKey: ['balances', groupId],
    queryFn: async () => {
      const [expensesRes, splitsRes, settlementsRes] = await Promise.all([
        supabase
          .from('expenses')
          .select('*')
          .eq('group_id', groupId)
          .is('deleted_at', null),
        supabase
          .from('expense_splits')
          .select('*, expense:expenses!inner(group_id, deleted_at)')
          .eq('expense.group_id', groupId)
          .is('expense.deleted_at', null),
        supabase
          .from('settlements')
          .select('*')
          .eq('group_id', groupId),
      ])

      if (expensesRes.error) throw expensesRes.error
      if (splitsRes.error) throw splitsRes.error
      if (settlementsRes.error) throw settlementsRes.error

      // Group splits by expense_id
      const splitsByExpense: Record<string, typeof splitsRes.data> = {}
      for (const split of splitsRes.data ?? []) {
        const eid = split.expense_id
        if (!splitsByExpense[eid]) splitsByExpense[eid] = []
        splitsByExpense[eid].push(split)
      }

      const expensesWithSplits = (expensesRes.data ?? []).map((e) => ({
        ...e,
        splits: splitsByExpense[e.id] ?? [],
      }))

      const netBalances = computeNetBalances(expensesWithSplits, settlementsRes.data ?? [])
      const simplifiedDebts = simplifyDebts(netBalances)

      return { netBalances, simplifiedDebts }
    },
    enabled: !!groupId,
  })
}
