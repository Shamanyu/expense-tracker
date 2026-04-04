'use client'

import { useQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'

/** Returns a map of userId -> net balance (positive = they owe you) */
export function useFriendBalances() {
  const supabase = createBrowserClient()

  return useQuery<Record<string, number>>({
    queryKey: ['friend-balances'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return {}

      const { data: myGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)

      const groupIds = (myGroups ?? []).map((g) => g.group_id)
      if (groupIds.length === 0) return {}

      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .in('group_id', groupIds)
        .is('deleted_at', null)

      const expenseIds = (expenses ?? []).map((e) => e.id)
      const { data: splits } = expenseIds.length > 0
        ? await supabase
            .from('expense_splits')
            .select('*')
            .in('expense_id', expenseIds)
        : { data: [] }

      const { data: settlements } = await supabase
        .from('settlements')
        .select('*')
        .in('group_id', groupIds)

      const balances: Record<string, number> = {}

      for (const expense of expenses ?? []) {
        const expSplits = (splits ?? []).filter((s) => s.expense_id === expense.id)

        if (expense.paid_by === user.id) {
          for (const split of expSplits) {
            if (split.user_id !== user.id) {
              balances[split.user_id] = (balances[split.user_id] ?? 0) + Number(split.amount)
            }
          }
        } else {
          const mySplit = expSplits.find((s) => s.user_id === user.id)
          if (mySplit) {
            balances[expense.paid_by] = (balances[expense.paid_by] ?? 0) - Number(mySplit.amount)
          }
        }
      }

      for (const s of settlements ?? []) {
        if (s.payer_id === user.id) {
          balances[s.payee_id] = (balances[s.payee_id] ?? 0) + Number(s.amount)
        } else if (s.payee_id === user.id) {
          balances[s.payer_id] = (balances[s.payer_id] ?? 0) - Number(s.amount)
        }
      }

      return balances
    },
  })
}
