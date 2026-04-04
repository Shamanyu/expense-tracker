'use client'

import { use } from 'react'
import { useGroup } from '@/hooks/useGroups'
import { useGroupMembers } from '@/hooks/useGroupMembers'
import { useBalances } from '@/hooks/useBalances'
import { SettleUpList } from '@/components/settle/SettleUpList'
import { SettleForm } from '@/components/settle/SettleForm'
import { ArrowLeft, Check } from 'lucide-react'
import Link from 'next/link'
import { PageSkeleton } from '@/components/common/LoadingSkeleton'
import { EmptyState } from '@/components/common/EmptyState'

export default function SettlePage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = use(params)
  const { data: group, isLoading: groupLoading } = useGroup(groupId)
  const { data: members = [] } = useGroupMembers(groupId)
  const { data: balanceData, isLoading: balancesLoading } = useBalances(groupId)

  if (groupLoading || balancesLoading) return <PageSkeleton />
  if (!group) return <div className="text-center py-12 text-slate-400">Group not found</div>

  const hasDebts = (balanceData?.simplifiedDebts?.length ?? 0) > 0
  const hasEnoughMembers = members.length >= 2

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/groups/${groupId}`}
          className="text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-[22px] font-semibold text-slate-100">
          Settle Up &mdash; {group.name}
        </h1>
      </div>

      {hasDebts ? (
        <>
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm p-4">
            <h2 className="text-[13px] font-medium uppercase tracking-wider text-slate-400 mb-3">
              Suggested Payments
            </h2>
            <SettleUpList groupId={groupId} />
          </div>

          {hasEnoughMembers && (
            <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm p-4">
              <SettleForm
                groupId={groupId}
                defaultCurrency={group.default_currency}
              />
            </div>
          )}
        </>
      ) : (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm p-6">
          <EmptyState
            icon={Check}
            title="All settled up!"
            description={
              hasEnoughMembers
                ? 'There are no outstanding balances in this group.'
                : 'Add more members to this group to start splitting expenses.'
            }
          />
        </div>
      )}
    </div>
  )
}
