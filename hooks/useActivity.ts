'use client'

import { useQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'
import type { ActivityItem } from '@/lib/types/app.types'

export function useActivity(page = 1, pageSize = 20) {
  const supabase = createBrowserClient()

  return useQuery<{ items: ActivityItem[]; hasMore: boolean }>({
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

      const items: ActivityItem[] = []

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
        })
      }

      for (const s of settlements ?? []) {
        const actor = profileMap.get(s.created_by)
        if (!actor) continue

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
