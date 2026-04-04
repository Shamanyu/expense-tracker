'use client'

import { useBalances } from '@/hooks/useBalances'
import { useGroupMembers } from '@/hooks/useGroupMembers'
import { BalanceRow } from './BalanceRow'
import { ListSkeleton } from '@/components/common/LoadingSkeleton'
import { useGroup } from '@/hooks/useGroups'

export function BalanceSummary({ groupId }: { groupId: string }) {
  const { data: balanceData, isLoading } = useBalances(groupId)
  const { data: members = [] } = useGroupMembers(groupId)
  const { data: group } = useGroup(groupId)

  if (isLoading) return <ListSkeleton count={3} />
  if (!balanceData) return null

  const { netBalances } = balanceData
  const profileMap = new Map(members.map((m) => [m.user_id, m.profile]))

  const sortedBalances = Object.entries(netBalances)
    .filter(([, amount]) => Math.abs(amount) > 0.01)
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))

  if (sortedBalances.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-4 text-center">
        All settled up!
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {sortedBalances.map(([userId, amount]) => {
        const profile = profileMap.get(userId)
        if (!profile) return null
        return (
          <BalanceRow
            key={userId}
            profile={profile}
            amount={amount}
            currency={group?.default_currency ?? 'USD'}
          />
        )
      })}
    </div>
  )
}
