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
}: {
  members: GroupMemberWithProfile[]
  isAdmin: boolean
  currentUserId: string
  onRemove: (userId: string) => void
}) {
  const adminCount = members.filter((m) => m.role === 'admin').length

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const canRemove =
          isAdmin &&
          member.user_id !== currentUserId &&
          !(member.role === 'admin' && adminCount <= 1)

        return (
          <div
            key={member.id}
            className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-50"
          >
            <UserAvatar profile={member.profile} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {member.profile.full_name ?? member.profile.email}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {member.profile.email}
              </p>
            </div>
            {member.role === 'admin' && (
              <Badge variant="secondary" className="text-xs">
                Admin
              </Badge>
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
