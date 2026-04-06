'use client'

import Link from 'next/link'
import { Users, Archive, ArchiveRestore } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export function GroupCard({
  group,
  memberCount,
  yourBalance,
  archived = false,
  onArchive,
  onUnarchive,
}: {
  group: {
    id: string
    name: string
    description: string | null
    default_currency: string
    [key: string]: unknown
  }
  memberCount: number
  yourBalance: number
  archived?: boolean
  onArchive?: (groupId: string) => Promise<void>
  onUnarchive?: (groupId: string) => Promise<void>
}) {
  const [loading, setLoading] = useState(false)

  const handleArchiveClick = async (e: React.MouseEvent) => {
    e.preventDefault() // prevent Link navigation
    e.stopPropagation()
    setLoading(true)
    try {
      if (archived && onUnarchive) {
        await onUnarchive(group.id)
      } else if (!archived && onArchive) {
        await onArchive(group.id)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Link href={`/groups/${group.id}`}>
      <div className={cn(
        "bg-slate-800 rounded-2xl border shadow-sm p-4 hover:border-slate-600 transition-colors relative group/card",
        archived ? "border-slate-700/50 opacity-70" : "border-slate-700"
      )}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-semibold text-slate-100 truncate">
                {group.name}
              </h3>
              {archived && (
                <Archive className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
            </div>
            {group.description && (
              <p className="text-sm text-slate-400 truncate mt-0.5">
                {group.description}
              </p>
            )}
          </div>
          {/* Archive/unarchive button — visible on hover */}
          <button
            onClick={handleArchiveClick}
            disabled={loading}
            className={cn(
              "p-1.5 rounded-lg transition-all shrink-0 ml-2",
              "opacity-0 group-hover/card:opacity-100 focus:opacity-100",
              archived
                ? "text-indigo-400 hover:bg-indigo-500/20"
                : "text-slate-500 hover:bg-slate-700 hover:text-slate-300",
              loading && "opacity-50"
            )}
            title={archived ? 'Unarchive group' : 'Archive group'}
          >
            {archived ? (
              <ArchiveRestore className="w-4 h-4" />
            ) : (
              <Archive className="w-4 h-4" />
            )}
          </button>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <Users className="w-4 h-4" />
            <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
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
