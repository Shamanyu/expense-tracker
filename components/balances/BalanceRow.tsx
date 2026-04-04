'use client'

import { UserAvatar } from '@/components/common/UserAvatar'
import { formatCurrency } from '@/lib/utils/currency'
import type { Profile } from '@/lib/types/database.types'
import { cn } from '@/lib/utils'

export function BalanceRow({
  profile,
  amount,
  currency,
}: {
  profile: Profile
  amount: number
  currency: string
}) {
  const isPositive = amount > 0

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-50">
      <UserAvatar profile={profile} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {profile.full_name ?? profile.email}
        </p>
        <p className="text-xs text-slate-500">
          {isPositive ? 'gets back' : 'owes'}
        </p>
      </div>
      <span
        className={cn(
          'text-sm font-medium tabular-nums',
          isPositive ? 'text-indigo-600' : 'text-red-500'
        )}
      >
        {formatCurrency(Math.abs(amount), currency)}
      </span>
    </div>
  )
}
