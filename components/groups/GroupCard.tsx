'use client'

import Link from 'next/link'
import { Users } from 'lucide-react'
import type { Group } from '@/lib/types/database.types'
import { formatCurrency } from '@/lib/utils/currency'
import { cn } from '@/lib/utils'

export function GroupCard({
  group,
  memberCount,
  yourBalance,
}: {
  group: Group
  memberCount: number
  yourBalance: number
}) {
  return (
    <Link href={`/groups/${group.id}`}>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-slate-800 truncate">
              {group.name}
            </h3>
            {group.description && (
              <p className="text-sm text-slate-500 truncate mt-0.5">
                {group.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Users className="w-4 h-4" />
            <span>{memberCount} members</span>
          </div>
          {yourBalance !== 0 && (
            <span
              className={cn(
                'text-sm font-medium tabular-nums',
                yourBalance > 0 ? 'text-indigo-600' : 'text-red-500'
              )}
            >
              {yourBalance > 0 ? '+' : ''}
              {formatCurrency(yourBalance, group.default_currency)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
