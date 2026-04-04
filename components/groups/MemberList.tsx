'use client'

import { UserAvatar } from '@/components/common/UserAvatar'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { GroupMemberWithProfile } from '@/lib/types/app.types'
import { Badge } from '@/components/ui/badge'

export function MemberList({
  members,
  isAdmin,
  currentUserId,
  onRemove,
  membersWithBalance,
}: {
  members: GroupMemberWithProfile[]
  isAdmin: boolean
  currentUserId: string
  onRemove: (userId: string) => void
  membersWithBalance?: Set<string>
}) {
  const adminCount = members.filter((m) => m.role === 'admin').length

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const hasBalance = membersWithBalance?.has(member.user_id) ?? false
        const canRemove =
          isAdmin &&
          member.user_id !== currentUserId &&
          !(member.role === 'admin' && adminCount <= 1) &&
          !hasBalance

        return (
          <div
            key={member.id}
            className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-700/50"
          >
            <UserAvatar profile={member.profile} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {member.profile.full_name ?? member.profile.email}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {member.profile.email}
              </p>
            </div>
            {member.role === 'admin' && (
              <Badge variant="secondary" className="text-xs">
                Admin
              </Badge>
            )}
            {isAdmin && member.user_id !== currentUserId && hasBalance && (
              <span
                className="text-xs text-slate-500 cursor-default"
                title="Settle all balances before removing this member"
              >
                Has balance
              </span>
            )}
            {canRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(member.user_id)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}
