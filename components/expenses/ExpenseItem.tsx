'use client'

import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/currency'
import { CATEGORY_COLORS, CATEGORY_EMOJI } from '@/lib/types/app.types'
import type { Expense, Profile } from '@/lib/types/database.types'
import { UserAvatar } from '@/components/common/UserAvatar'
import { format } from 'date-fns'

export function ExpenseItem({
  expense,
  paidByProfile,
  currentUserId,
  groupId,
}: {
  expense: Expense
  paidByProfile?: Profile
  currentUserId: string
  groupId: string
}) {
  const categoryStyle = CATEGORY_COLORS[expense.category] ?? CATEGORY_COLORS['Other']
  const emoji = CATEGORY_EMOJI[expense.category] ?? '📦'

  return (
    <Link href={`/groups/${groupId}/expenses/${expense.id}/edit`}>
      <div className="flex items-center gap-3 py-3 px-2 hover:bg-slate-700/50 rounded-xl transition-colors">
        {paidByProfile && (
          <UserAvatar profile={paidByProfile} className="h-9 w-9" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-200 truncate">
              {expense.description}
            </p>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text}`}
            >
              {emoji} {expense.category}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Paid by{' '}
            {expense.paid_by === currentUserId
              ? 'you'
              : paidByProfile?.full_name ?? 'someone'}{' '}
            &middot; {format(new Date(expense.date), 'MMM d, yyyy')}
          </p>
        </div>
        <span className="text-sm font-medium tabular-nums text-slate-200">
          {formatCurrency(Number(expense.amount), expense.currency)}
        </span>
      </div>
    </Link>
  )
}
