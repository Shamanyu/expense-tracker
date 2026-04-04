'use client'

import { UserAvatar } from '@/components/common/UserAvatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Profile } from '@/lib/types/database.types'
import { acceptFriendRequest, declineFriendRequest } from '@/app/actions/friends'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useState } from 'react'

export function FriendCard({
  profile,
  status,
  friendshipId,
  isRequester,
}: {
  profile: Profile
  status: 'accepted' | 'pending' | 'group_friend'
  friendshipId: string | null
  isRequester: boolean
}) {
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)

  const isPendingIncoming = status === 'pending' && !isRequester

  const handleAccept = async () => {
    if (!friendshipId) return
    setIsLoading(true)
    try {
      await acceptFriendRequest(friendshipId)
      toast.success('Friend request accepted!')
      queryClient.invalidateQueries({ queryKey: ['friends'] })
    } catch {
      toast.error('Failed to accept request')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDecline = async () => {
    if (!friendshipId) return
    setIsLoading(true)
    try {
      await declineFriendRequest(friendshipId)
      toast.success('Friend request declined')
      queryClient.invalidateQueries({ queryKey: ['friends'] })
    } catch {
      toast.error('Failed to decline request')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200">
      <UserAvatar profile={profile} className="h-10 w-10" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {profile.full_name ?? profile.email}
        </p>
        <p className="text-xs text-slate-500 truncate">{profile.email}</p>
      </div>
      {status === 'pending' && isRequester && (
        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-600">
          Pending
        </Badge>
      )}
      {status === 'group_friend' && (
        <Badge variant="secondary" className="text-xs">
          Group member
        </Badge>
      )}
      {isPendingIncoming && (
        <div className="flex gap-1.5">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs"
          >
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDecline}
            disabled={isLoading}
            className="rounded-xl text-xs"
          >
            Decline
          </Button>
        </div>
      )}
    </div>
  )
}
