'use client'

import { useBalances } from '@/hooks/useBalances'
import { useGroupMembers } from '@/hooks/useGroupMembers'
import { useGroup } from '@/hooks/useGroups'
import { UserAvatar } from '@/components/common/UserAvatar'
import { Button } from '@/components/ui/button'
import { ArrowRight, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { ListSkeleton } from '@/components/common/LoadingSkeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { recordSettlement } from '@/app/actions/settlements'
import { callServerAction } from '@/lib/utils/serverAction'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useState } from 'react'

export function SettleUpList({ groupId }: { groupId: string }) {
  const { data: balanceData, isLoading, error } = useBalances(groupId)
  const { data: members = [] } = useGroupMembers(groupId)
  const { data: group } = useGroup(groupId)
  const queryClient = useQueryClient()
  const [settlingId, setSettlingId] = useState<string | null>(null)

  const profileMap = new Map(members.map((m) => [m.user_id, m.profile]))

  if (isLoading) return <ListSkeleton count={3} />
  if (error) return <p className="text-sm text-red-400 py-4 text-center">Failed to load balances. Please try again.</p>
  if (!balanceData) return null

  const { simplifiedDebts } = balanceData
  const currency = group?.default_currency ?? 'INR'

  if (simplifiedDebts.length === 0) {
    return (
      <EmptyState
        icon={Check}
        title="All settled up!"
        description="There are no outstanding balances in this group."
      />
    )
  }

  const handleSettle = async (from: string, to: string, amount: number) => {
    const key = `${from}-${to}`
    setSettlingId(key)
    try {
      const result = await callServerAction(() => recordSettlement({
        group_id: groupId,
        payer_id: from,
        payee_id: to,
        amount,
        currency,
      }))
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Payment recorded!')
        queryClient.invalidateQueries({ queryKey: ['balances', groupId] })
        queryClient.invalidateQueries({ queryKey: ['settlements', groupId] })
        queryClient.invalidateQueries({ queryKey: ['dashboard-balances'] })
        queryClient.invalidateQueries({ queryKey: ['my-groups-with-balances'] })
      }
    } catch {
      toast.error('Network error — try again when online')
    } finally {
      setSettlingId(null)
    }
  }

  return (
    <div className="space-y-3">
      {simplifiedDebts.map((debt) => {
        const fromProfile = profileMap.get(debt.from)
        const toProfile = profileMap.get(debt.to)
        if (!fromProfile || !toProfile) return null
        const key = `${debt.from}-${debt.to}`

        return (
          <div
            key={key}
            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-slate-700/50 rounded-2xl border border-slate-600"
          >
            <div className="flex items-center gap-2 min-w-0">
              <UserAvatar profile={fromProfile} className="h-8 w-8 shrink-0" />
              <span className="text-sm font-medium text-slate-200 truncate">
                {fromProfile.full_name ?? fromProfile.email}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              <UserAvatar profile={toProfile} className="h-8 w-8 shrink-0" />
              <span className="text-sm font-medium text-slate-200 truncate">
                {toProfile.full_name ?? toProfile.email}
              </span>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:ml-auto">
              <span className="text-sm font-medium tabular-nums text-slate-200">
                {formatCurrency(debt.amount, currency)}
              </span>
              <Button
                size="sm"
                onClick={() => handleSettle(debt.from, debt.to, debt.amount)}
                disabled={settlingId === key}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
              >
                {settlingId === key ? '...' : 'Settle'}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
