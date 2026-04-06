'use client'

import Link from 'next/link'
import { Users, Archive } from 'lucide-react'
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
  const isArchived = !!group.archived_at

  return (
    <Link href={`/groups/${group.id}`}>
      <div className={cn(
        "bg-slate-800 rounded-2xl border shadow-sm p-4 hover:border-slate-600 transition-colors",
        isArchived ? "border-slate-700/50 opacity-70" : "border-slate-700"
      )}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-semibold text-slate-100 truncate">
                {group.name}
              </h3>
              {isArchived && (
                <Archive className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
            </div>
            {group.description && (
              <p className="text-sm text-slate-400 truncate mt-0.5">
                {group.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <Users className="w-4 h-4" />
            <span>{memberCount} members</span>
          </div>
          {yourBalance !== 0 && (
            <span
              className={cn(
                'text-sm font-medium tabular-nums',
                yourBalance > 0 ? 'text-indigo-400' : 'text-red-400'
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
