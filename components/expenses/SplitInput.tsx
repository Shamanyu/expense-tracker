'use client'

import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/common/UserAvatar'
import type { GroupMemberWithProfile } from '@/lib/types/app.types'
import type { SplitType } from '@/lib/types/app.types'
import { formatCurrency } from '@/lib/utils/currency'

// Need checkbox component - let me add it inline
function CheckboxInput({
  checked,
  onCheckedChange,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
        checked
          ? 'bg-indigo-600 border-indigo-600 text-white'
          : 'border-slate-600 bg-slate-800'
      }`}
    >
      {checked && (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  )
}

export function SplitInput({
  splitType,
  members,
  values,
  onChange,
  totalAmount,
  currency,
}: {
  splitType: SplitType
  members: GroupMemberWithProfile[]
  values: Record<string, number>
  onChange: (values: Record<string, number>) => void
  totalAmount: number
  currency: string
}) {
  const handleChange = (userId: string, value: number) => {
    onChange({ ...values, [userId]: value })
  }

  if (splitType === 'equal') {
    const includedCount = Object.values(values).filter((v) => v === 1).length
    const perPerson = includedCount > 0 ? totalAmount / includedCount : 0

    return (
      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.user_id} className="flex items-center gap-3 py-1.5">
            <CheckboxInput
              checked={values[m.user_id] === 1}
              onCheckedChange={(checked) =>
                handleChange(m.user_id, checked ? 1 : 0)
              }
            />
            <UserAvatar profile={m.profile} className="h-7 w-7" />
            <span className="flex-1 text-sm text-slate-200 truncate">
              {m.profile.full_name ?? m.profile.email}
            </span>
            {values[m.user_id] === 1 && (
              <span className="text-sm text-slate-500 tabular-nums font-mono">
                {formatCurrency(perPerson, currency)}
              </span>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (splitType === 'exact') {
    const total = Object.values(values).reduce((s, v) => s + v, 0)
    const diff = totalAmount - total

    return (
      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.user_id} className="flex items-center gap-3 py-1.5">
            <UserAvatar profile={m.profile} className="h-7 w-7" />
            <span className="flex-1 text-sm text-slate-200 truncate">
              {m.profile.full_name ?? m.profile.email}
            </span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={values[m.user_id] || ''}
              onChange={(e) =>
                handleChange(m.user_id, parseFloat(e.target.value) || 0)
              }
              className="w-28 rounded-xl border-slate-700 tabular-nums text-right"
            />
          </div>
        ))}
        <div className="flex justify-end pt-2 border-t border-slate-700">
          <span
            className={`text-sm font-medium tabular-nums ${
              Math.abs(diff) < 0.01
                ? 'text-indigo-600'
                : 'text-red-500'
            }`}
          >
            {Math.abs(diff) < 0.01
              ? 'Amounts match!'
              : `${formatCurrency(Math.abs(diff), currency)} ${diff > 0 ? 'remaining' : 'over'}`}
          </span>
        </div>
      </div>
    )
  }

  if (splitType === 'percentage') {
    const totalPct = Object.values(values).reduce((s, v) => s + v, 0)

    return (
      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.user_id} className="flex items-center gap-3 py-1.5">
            <UserAvatar profile={m.profile} className="h-7 w-7" />
            <span className="flex-1 text-sm text-slate-200 truncate">
              {m.profile.full_name ?? m.profile.email}
            </span>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={values[m.user_id] || ''}
                onChange={(e) =>
                  handleChange(m.user_id, parseFloat(e.target.value) || 0)
                }
                className="w-20 rounded-xl border-slate-700 tabular-nums text-right"
              />
              <span className="text-sm text-slate-500">%</span>
            </div>
            <span className="text-xs text-slate-400 tabular-nums font-mono w-20 text-right">
              {formatCurrency(
                totalAmount * ((values[m.user_id] || 0) / 100),
                currency
              )}
            </span>
          </div>
        ))}
        <div className="flex justify-end pt-2 border-t border-slate-700">
          <span
            className={`text-sm font-medium ${
              Math.abs(totalPct - 100) < 0.1
                ? 'text-indigo-600'
                : 'text-red-500'
            }`}
          >
            Total: {totalPct.toFixed(1)}%
          </span>
        </div>
      </div>
    )
  }

  // shares
  const totalShares = Object.values(values).reduce((s, v) => s + v, 0)

  return (
    <div className="space-y-2">
      {members.map((m) => {
        const share = values[m.user_id] || 0
        const amount =
          totalShares > 0 ? totalAmount * (share / totalShares) : 0

        return (
          <div key={m.user_id} className="flex items-center gap-3 py-1.5">
            <UserAvatar profile={m.profile} className="h-7 w-7" />
            <span className="flex-1 text-sm text-slate-200 truncate">
              {m.profile.full_name ?? m.profile.email}
            </span>
            <Input
              type="number"
              step="1"
              min="0"
              value={values[m.user_id] || ''}
              onChange={(e) =>
                handleChange(m.user_id, parseInt(e.target.value) || 0)
              }
              className="w-20 rounded-xl border-slate-700 tabular-nums text-right"
              placeholder="0"
            />
            <span className="text-xs text-slate-400 tabular-nums font-mono w-20 text-right">
              {formatCurrency(amount, currency)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
