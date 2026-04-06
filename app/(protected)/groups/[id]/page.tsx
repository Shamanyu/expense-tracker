'use client'

import { use } from 'react'
import { useGroup } from '@/hooks/useGroups'
import { useGroupMembers } from '@/hooks/useGroupMembers'
import { useUser } from '@/hooks/useUser'
import { ExpenseList } from '@/components/expenses/ExpenseList'
import { BalanceSummary } from '@/components/balances/BalanceSummary'
import { MemberList } from '@/components/groups/MemberList'
import { InviteMemberForm } from '@/components/groups/InviteMemberForm'
import { UserAvatar } from '@/components/common/UserAvatar'
import { PageSkeleton } from '@/components/common/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, HandCoins, Archive } from 'lucide-react'
import Link from 'next/link'
import { removeMember, archiveGroup, unarchiveGroup } from '@/app/actions/groups'
import { callServerAction } from '@/lib/utils/serverAction'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useBalances } from '@/hooks/useBalances'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: groupId } = use(params)
  const { data: group, isLoading: groupLoading } = useGroup(groupId)
  const { data: members = [], isLoading: membersLoading } = useGroupMembers(groupId)
  const { data: user } = useUser()
  const queryClient = useQueryClient()
  const { data: balanceData } = useBalances(groupId)
  const [archiving, setArchiving] = useState(false)
  const router = useRouter()

  if (groupLoading || membersLoading) return <PageSkeleton />
  if (!group) return <div className="text-center py-12 text-slate-400">Group not found</div>

  const currentMember = members.find((m) => m.user_id === user?.id)
  const isAdmin = currentMember?.role === 'admin'

  // Members with non-zero balance can't be removed
  const membersWithBalance = new Set(
    Object.entries(balanceData?.netBalances ?? {})
      .filter(([, bal]) => Math.abs(bal) > 0.01)
      .map(([id]) => id)
  )

  const isSettled = membersWithBalance.size === 0
  const isArchived = !!currentMember?.archived_at

  const handleArchive = async () => {
    setArchiving(true)
    try {
      const result = await callServerAction(() => archiveGroup(groupId))
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Group archived for you')
        queryClient.invalidateQueries({ queryKey: ['my-groups-with-balances'] })
        router.push('/groups')
      }
    } catch {
      toast.error('Network error — try again when online')
    } finally {
      setArchiving(false)
    }
  }

  const handleUnarchive = async () => {
    setArchiving(true)
    try {
      const result = await callServerAction(() => unarchiveGroup(groupId))
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Group unarchived')
        queryClient.invalidateQueries({ queryKey: ['my-groups-with-balances'] })
        queryClient.invalidateQueries({ queryKey: ['group-members', groupId] })
      }
    } catch {
      toast.error('Network error — try again when online')
    } finally {
      setArchiving(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      const result = await callServerAction(() => removeMember(groupId, userId))
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Member removed')
        queryClient.invalidateQueries({ queryKey: ['group-members', groupId] })
      }
    } catch {
      toast.error('Network error — try again when online')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-100">
            {group.name}
          </h1>
          {group.description && (
            <p className="text-sm text-slate-400 mt-1">{group.description}</p>
          )}
          {/* Member avatars */}
          <div className="flex items-center gap-1 mt-2">
            {members.slice(0, 5).map((m) => (
              <UserAvatar
                key={m.user_id}
                profile={m.profile}
                className="h-7 w-7 -ml-1 first:ml-0 ring-2 ring-slate-900"
              />
            ))}
            {members.length > 5 && (
              <span className="text-xs text-slate-400 ml-1">
                +{members.length - 5}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {isArchived ? (
            <Button
              variant="outline"
              onClick={handleUnarchive}
              disabled={archiving}
              className="rounded-xl border-slate-700 text-slate-400 hover:bg-slate-800"
            >
              <Archive className="w-4 h-4 mr-1" />
              {archiving ? 'Unarchiving...' : 'Unarchive'}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleArchive}
              disabled={archiving}
              className="rounded-xl border-slate-700 text-slate-400 hover:bg-slate-800"
            >
              <Archive className="w-4 h-4 mr-1" />
              {archiving ? 'Archiving...' : 'Archive'}
            </Button>
          )}
          <Link href={`/settle/${groupId}`}>
            <Button
              variant="outline"
              className="rounded-xl border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              <HandCoins className="w-4 h-4 mr-1" />
              Settle Up
            </Button>
          </Link>
        </div>
      </div>

      {/* Balance summary */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm p-4">
        <h2 className="text-[13px] font-medium uppercase tracking-wider text-slate-400 mb-3">
          Balances
        </h2>
        <BalanceSummary groupId={groupId} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="expenses">
        <TabsList className="w-full">
          <TabsTrigger value="expenses" className="flex-1">
            Expenses
          </TabsTrigger>
          <TabsTrigger value="members" className="flex-1">
            Members ({members.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="expenses" className="mt-4">
          <div className="flex justify-end mb-3">
            <Link href={`/groups/${groupId}/expenses/new`}>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
                <Plus className="w-4 h-4 mr-1" />
                Add Expense
              </Button>
            </Link>
          </div>
          <ExpenseList groupId={groupId} />
        </TabsContent>
        <TabsContent value="members" className="mt-4 space-y-4">
          <InviteMemberForm groupId={groupId} />
          <MemberList
            members={members}
            isAdmin={isAdmin}
            currentUserId={user?.id ?? ''}
            onRemove={handleRemoveMember}
            membersWithBalance={membersWithBalance}
          />
        </TabsContent>
      </Tabs>

      {/* Mobile FAB */}
      <Link
        href={`/groups/${groupId}/expenses/new`}
        className="md:hidden fixed bottom-20 right-4 z-40 bg-indigo-600 text-white rounded-2xl shadow-lg p-4 hover:bg-indigo-700 transition-colors"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  )
}
