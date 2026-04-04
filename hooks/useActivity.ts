'use client'

import { useQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'
import type { ActivityItem } from '@/lib/types/app.types'

export type ActivityItemWithImpact = ActivityItem & {
  /** positive = you are owed, negative = you owe, 0 = neutral */
  userImpact: number
}

export function useActivity(page = 1, pageSize = 20) {
  const supabase = createBrowserClient()

  return useQuery<{ items: ActivityItemWithImpact[]; hasMore: boolean }>({
    queryKey: ['activity', page],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { items: [], hasMore: false }

      // Get user's group IDs
      const { data: myGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)

      const groupIds = (myGroups ?? []).map((g) => g.group_id)
      if (groupIds.length === 0) return { items: [], hasMore: false }

      // Fetch groups for names
      const { data: groups } = await supabase
        .from('groups')
        .select('id, name')
        .in('id', groupIds)

      const groupMap = new Map(
        (groups ?? []).map((g) => [g.id, g.name])
      )

      const from = (page - 1) * pageSize
      const to = from + pageSize

      // Fetch recent expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .in('group_id', groupIds)
        .order('created_at', { ascending: false })
        .range(from, to)

      // Fetch splits for these expenses to determine user impact
      const expenseIds = (expenses ?? []).map((e) => e.id)
      const { data: splits } = expenseIds.length > 0
        ? await supabase
            .from('expense_splits')
            .select('*')
            .in('expense_id', expenseIds)
        : { data: [] }

      const splitsByExpense: Record<string, Array<{ expense_id: string; user_id: string; amount: number }>> = {}
      for (const s of splits ?? []) {
        if (!splitsByExpense[s.expense_id]) splitsByExpense[s.expense_id] = []
        splitsByExpense[s.expense_id].push(s)
      }

      // Fetch recent settlements
      const { data: settlements } = await supabase
        .from('settlements')
        .select('*')
        .in('group_id', groupIds)
        .order('settled_at', { ascending: false })
        .range(from, to)

      // Fetch all relevant profiles
      const profileIds = new Set<string>()
      for (const e of expenses ?? []) profileIds.add(e.created_by)
      for (const s of settlements ?? []) profileIds.add(s.created_by)

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', Array.from(profileIds))

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, p])
      )

      const items: ActivityItemWithImpact[] = []

      for (const e of expenses ?? []) {
        const actor = profileMap.get(e.created_by)
        if (!actor) continue

        let type: ActivityItem['type'] = 'expense_added'
        let description = `added "${e.description}"`

        if (e.deleted_at) {
          type = 'expense_deleted'
          description = `deleted "${e.description}"`
        } else if (e.updated_at !== e.created_at) {
          type = 'expense_updated'
          description = `updated "${e.description}"`
        }

        // Compute user impact: positive = you're owed, negative = you owe
        let userImpact = 0
        const expSplits = splitsByExpense[e.id] ?? []
        const mySplit = expSplits.find((s) => s.user_id === user.id)

        if (e.deleted_at) {
          userImpact = 0 // deleted — neutral
        } else if (e.paid_by === user.id) {
          // I paid — others owe me (total - my share)
          const myShare = mySplit ? Number(mySplit.amount) : 0
          userImpact = Number(e.amount) - myShare
        } else if (mySplit) {
          // Someone else paid — I owe my share
          userImpact = -Number(mySplit.amount)
        }

        items.push({
          id: e.id,
          type,
          actor,
          group_id: e.group_id,
          group_name: groupMap.get(e.group_id) ?? 'Unknown',
          description,
          amount: Number(e.amount),
          currency: e.currency,
          created_at: e.deleted_at ?? e.updated_at ?? e.created_at,
          userImpact,
        })
      }

      for (const s of settlements ?? []) {
        const actor = profileMap.get(s.created_by)
        if (!actor) continue

        // Settlement impact: if I'm payer, I paid off debt (positive). If I'm payee, I got paid (negative — reduces what's owed to me)
        let userImpact = 0
        if (s.payer_id === user.id) {
          userImpact = Number(s.amount) // I paid — reducing my debt
        } else if (s.payee_id === user.id) {
          userImpact = -Number(s.amount) // I received — reducing what's owed to me
        }

        items.push({
          id: s.id,
          type: 'settlement',
          actor,
          group_id: s.group_id,
          group_name: groupMap.get(s.group_id) ?? 'Unknown',
          description: 'recorded a payment',
          amount: Number(s.amount),
          currency: s.currency,
          created_at: s.settled_at,
          userImpact,
        })
      }

      // Sort by date
      items.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      const limited = items.slice(0, pageSize)

      return { items: limited, hasMore: items.length > pageSize }
    },
  })
}
