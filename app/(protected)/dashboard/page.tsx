'use client'

import { useUser } from '@/hooks/useUser'
import { ActivityFeed } from '@/components/activity/ActivityFeed'
import { formatCurrency } from '@/lib/utils/currency'
import { PageSkeleton } from '@/components/common/LoadingSkeleton'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { UserAvatar } from '@/components/common/UserAvatar'

function useDashboardBalances() {
  const supabase = createBrowserClient()

  return useQuery({
    queryKey: ['dashboard-balances'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { youAreOwed: 0, youOwe: 0, perPerson: [] }

      // Get user's groups
      const { data: myGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)

      const groupIds = (myGroups ?? []).map((g) => g.group_id)
      if (groupIds.length === 0) return { youAreOwed: 0, youOwe: 0, perPerson: [] }

      // Get all expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .in('group_id', groupIds)
        .is('deleted_at', null)

      // Get all splits
      const { data: splits } = await supabase
        .from('expense_splits')
        .select('*')

      // Get all settlements
      const { data: settlements } = await supabase
        .from('settlements')
        .select('*')
        .in('group_id', groupIds)

      // Compute per-person balances relative to current user
      const personBalances: Record<string, number> = {}

      for (const expense of expenses ?? []) {
        const expSplits = (splits ?? []).filter(
          (s) => s.expense_id === expense.id
        )

        if (expense.paid_by === user.id) {
          for (const split of expSplits) {
            if (split.user_id !== user.id) {
              personBalances[split.user_id] =
                (personBalances[split.user_id] ?? 0) + Number(split.amount)
            }
          }
        } else {
          const mySplit = expSplits.find((s) => s.user_id === user.id)
          if (mySplit) {
            personBalances[expense.paid_by] =
              (personBalances[expense.paid_by] ?? 0) - Number(mySplit.amount)
          }
        }
      }

      for (const s of settlements ?? []) {
        if (s.payer_id === user.id) {
          personBalances[s.payee_id] =
            (personBalances[s.payee_id] ?? 0) + Number(s.amount)
        } else if (s.payee_id === user.id) {
          personBalances[s.payer_id] =
            (personBalances[s.payer_id] ?? 0) - Number(s.amount)
        }
      }

      const personIds = Object.keys(personBalances).filter(
        (id) => Math.abs(personBalances[id]) > 0.01
      )

      let profiles: Record<string, { full_name: string | null; email: string; avatar_url: string | null }> = {}
      if (personIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', personIds)

        for (const p of profileData ?? []) {
          profiles[p.id] = p
        }
      }

      let youAreOwed = 0
      let youOwe = 0
      const perPerson: {
        userId: string
        profile: { full_name: string | null; email: string; avatar_url: string | null }
        amount: number
      }[] = []

      for (const [userId, amount] of Object.entries(personBalances)) {
        if (Math.abs(amount) < 0.01) continue
        if (amount > 0) youAreOwed += amount
        else youOwe += Math.abs(amount)

        const profile = profiles[userId]
        if (profile) {
          perPerson.push({ userId, profile, amount })
        }
      }

      perPerson.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))

      return { youAreOwed, youOwe, perPerson }
    },
  })
}

export default function DashboardPage() {
  const { data: user, isLoading: userLoading } = useUser()
  const { data: balances, isLoading: balancesLoading } = useDashboardBalances()

  if (userLoading || balancesLoading) return <PageSkeleton />

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-[22px] font-semibold text-slate-100">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm p-4">
          <p className="text-[13px] font-medium uppercase tracking-wider text-slate-400">
            You are owed
          </p>
          <p className="text-2xl font-semibold text-indigo-400 mt-1 tabular-nums">
            {formatCurrency(balances?.youAreOwed ?? 0, user?.default_currency ?? 'INR')}
          </p>
        </div>
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm p-4">
          <p className="text-[13px] font-medium uppercase tracking-wider text-slate-400">
            You owe
          </p>
          <p className="text-2xl font-semibold text-red-400 mt-1 tabular-nums">
            {formatCurrency(balances?.youOwe ?? 0, user?.default_currency ?? 'INR')}
          </p>
        </div>
      </div>

      {/* Per-person balances */}
      {(balances?.perPerson?.length ?? 0) > 0 && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm p-4">
          <h2 className="text-[13px] font-medium uppercase tracking-wider text-slate-400 mb-3">
            Balances
          </h2>
          <div className="space-y-1">
            {balances?.perPerson.map((p) => (
              <div
                key={p.userId}
                className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-slate-700/50"
              >
                <UserAvatar profile={p.profile} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {p.profile.full_name ?? p.profile.email}
                  </p>
                  <p className="text-xs text-slate-400">
                    {p.amount > 0 ? 'owes you' : 'you owe'}
                  </p>
                </div>
                <span
                  className={cn(
                    'text-sm font-medium tabular-nums',
                    p.amount > 0 ? 'text-indigo-400' : 'text-red-400'
                  )}
                >
                  {formatCurrency(
                    Math.abs(p.amount),
                    user?.default_currency ?? 'INR'
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm p-4">
        <h2 className="text-[13px] font-medium uppercase tracking-wider text-slate-400 mb-3">
          Recent Activity
        </h2>
        <ActivityFeed limit={10} />
      </div>

      {/* Mobile FAB */}
      <Link
        href="/groups"
        className="md:hidden fixed bottom-20 right-4 z-40 bg-indigo-600 text-white rounded-2xl shadow-lg p-4 hover:bg-indigo-700 transition-colors"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  )
}
