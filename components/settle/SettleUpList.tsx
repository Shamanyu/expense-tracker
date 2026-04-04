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
  if (error) return <p className="text-sm text-red-500 py-4 text-center">Failed to load balances. Please try again.</p>
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
      const result = await recordSettlement({
        group_id: groupId,
        payer_id: from,
        payee_id: to,
        amount,
        currency,
      })
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Payment recorded!')
        queryClient.invalidateQueries({ queryKey: ['balances', groupId] })
        queryClient.invalidateQueries({ queryKey: ['settlements', groupId] })
      }
    } catch {
      toast.error('Failed to record payment')
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
            className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200"
          >
            <UserAvatar profile={fromProfile} className="h-9 w-9" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-800">
                <span className="font-medium">
                  {fromProfile.full_name ?? fromProfile.email}
                </span>
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
            <UserAvatar profile={toProfile} className="h-9 w-9" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-800">
                <span className="font-medium">
                  {toProfile.full_name ?? toProfile.email}
                </span>
              </p>
            </div>
            <span className="text-sm font-medium tabular-nums text-slate-800 shrink-0">
              {formatCurrency(debt.amount, currency)}
            </span>
            <Button
              size="sm"
              onClick={() => handleSettle(debt.from, debt.to, debt.amount)}
              disabled={settlingId === key}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shrink-0"
            >
              {settlingId === key ? '...' : 'Settle'}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
