'use client'

import { use } from 'react'
import { useGroup } from '@/hooks/useGroups'
import { SettleUpList } from '@/components/settle/SettleUpList'
import { SettleForm } from '@/components/settle/SettleForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PageSkeleton } from '@/components/common/LoadingSkeleton'
import { Separator } from '@/components/ui/separator'

export default function SettlePage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = use(params)
  const { data: group, isLoading } = useGroup(groupId)

  if (isLoading) return <PageSkeleton />
  if (!group) return <div className="text-center py-12 text-slate-500">Group not found</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/groups/${groupId}`}
          className="text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-[22px] font-semibold text-slate-800">
          Settle Up &mdash; {group.name}
        </h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <h2 className="text-[13px] font-medium uppercase tracking-wider text-slate-500 mb-3">
          Suggested Payments
        </h2>
        <SettleUpList groupId={groupId} />
      </div>

      <Separator />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <SettleForm
          groupId={groupId}
          defaultCurrency={group.default_currency}
        />
      </div>
    </div>
  )
}
