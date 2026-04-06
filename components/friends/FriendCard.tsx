'use client'

import { UserAvatar } from '@/components/common/UserAvatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Profile } from '@/lib/types/database.types'
import {
  acceptFriendRequest,
  declineFriendRequest,
  sendFriendRequest,
  resendFriendRequest,
} from '@/app/actions/friends'
import { getOrCreateDirectGroup } from '@/app/actions/direct-expense'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Plus, Check, Send } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { cn } from '@/lib/utils'

export function FriendCard({
  profile,
  status,
  friendshipId,
  isRequester,
  balance,
  currency,
}: {
  profile: Profile
  status: 'accepted' | 'pending' | 'group_friend'
  friendshipId: string | null
  isRequester: boolean
  balance?: number
  currency?: string
}) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [requestSent, setRequestSent] = useState(false)

  const isPendingIncoming = status === 'pending' && !isRequester
  const hasBalance = balance !== undefined && Math.abs(balance) > 0.01

  const handleAccept = async () => {
    if (!friendshipId) return
    setIsLoading(true)
    try {
      const result = await acceptFriendRequest(friendshipId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Friend request accepted!')
        queryClient.invalidateQueries({ queryKey: ['friends'] })
      }
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
      const result = await declineFriendRequest(friendshipId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Friend request declined')
        queryClient.invalidateQueries({ queryKey: ['friends'] })
      }
    } catch {
      toast.error('Failed to decline request')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFriend = async () => {
    setIsLoading(true)
    try {
      const result = await sendFriendRequest(profile.email)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Friend request sent!')
        setRequestSent(true)
        queryClient.invalidateQueries({ queryKey: ['friends'] })
      }
    } catch {
      toast.error('Failed to send friend request')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!friendshipId) return
    setIsLoading(true)
    try {
      const result = await resendFriendRequest(friendshipId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Friend request resent!')
      }
    } catch {
      toast.error('Failed to resend request')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddExpense = async () => {
    setIsLoading(true)
    try {
      const result = await getOrCreateDirectGroup(profile.id)
      if (result?.error) {
        toast.error(result.error)
      } else if (result?.groupId) {
        router.push(`/groups/${result.groupId}/expenses/new`)
      }
    } catch {
      toast.error('Failed to create expense')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-2xl border border-slate-700">
      <UserAvatar profile={profile} className="h-10 w-10" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">
          {profile.full_name ?? profile.email}
        </p>
        <p className="text-xs text-slate-400 truncate">{profile.email}</p>
        {hasBalance && currency && (
          <p className={cn(
            'text-xs font-medium mt-0.5 tabular-nums',
            balance > 0 ? 'text-indigo-400' : 'text-red-400'
          )}>
            {balance > 0
              ? `owes you ${formatCurrency(balance, currency)}`
              : `you owe ${formatCurrency(Math.abs(balance), currency)}`}
          </p>
        )}
      </div>
      {/* Accepted friend: show balance + add expense */}
      {status === 'accepted' && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddExpense}
          disabled={isLoading}
          className="rounded-xl text-xs border-slate-700 text-slate-300 hover:bg-slate-700"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Expense
        </Button>
      )}
      {status === 'pending' && isRequester && (
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="text-xs bg-amber-900/50 text-amber-400">
            Pending
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResend}
            disabled={isLoading}
            className="rounded-xl text-xs border-slate-700 text-slate-300 hover:bg-slate-700"
          >
            <Send className="w-3.5 h-3.5 mr-1" />
            Resend
          </Button>
        </div>
      )}
      {status === 'group_friend' && !requestSent && (
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddExpense}
            disabled={isLoading}
            className="rounded-xl text-xs border-slate-700 text-slate-300 hover:bg-slate-700"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Expense
          </Button>
          <Button
            size="sm"
            onClick={handleAddFriend}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </div>
      )}
      {status === 'group_friend' && requestSent && (
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddExpense}
            disabled={isLoading}
            className="rounded-xl text-xs border-slate-700 text-slate-300 hover:bg-slate-700"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Expense
          </Button>
          <Badge variant="secondary" className="text-xs bg-amber-900/50 text-amber-400">
            Sent
          </Badge>
        </div>
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
