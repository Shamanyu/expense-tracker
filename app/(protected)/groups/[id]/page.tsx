'use client'

import { use, useState } from 'react'
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
import { Plus, Settings, HandCoins, Archive } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { removeMember, archiveGroup } from '@/app/actions/groups'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

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
  const router = useRouter()
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)

  if (groupLoading || membersLoading) return <PageSkeleton />
  if (!group) return <div className="text-center py-12 text-slate-500">Group not found</div>

  const currentMember = members.find((m) => m.user_id === user?.id)
  const isAdmin = currentMember?.role === 'admin'

  const handleRemoveMember = async (userId: string) => {
    try {
      const result = await removeMember(groupId, userId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Member removed')
        queryClient.invalidateQueries({ queryKey: ['group-members', groupId] })
      }
    } catch {
      toast.error('Failed to remove member')
    }
  }

  const handleArchive = async () => {
    try {
      const result = await archiveGroup(groupId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Group archived')
        router.push('/groups')
      }
    } catch {
      toast.error('Failed to archive group')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-800">
            {group.name}
          </h1>
          {group.description && (
            <p className="text-sm text-slate-500 mt-1">{group.description}</p>
          )}
          {/* Member avatars */}
          <div className="flex items-center gap-1 mt-2">
            {members.slice(0, 5).map((m) => (
              <UserAvatar
                key={m.user_id}
                profile={m.profile}
                className="h-7 w-7 -ml-1 first:ml-0 ring-2 ring-white"
              />
            ))}
            {members.length > 5 && (
              <span className="text-xs text-slate-500 ml-1">
                +{members.length - 5}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/settle/${groupId}`}>
            <Button
              variant="outline"
              className="rounded-xl border-slate-200"
            >
              <HandCoins className="w-4 h-4 mr-1" />
              Settle Up
            </Button>
          </Link>
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    className="rounded-xl border-slate-200"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setArchiveDialogOpen(true)} className="text-red-500">
                  <Archive className="w-4 h-4 mr-2" />
                  Archive Group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Balance summary */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <h2 className="text-[13px] font-medium uppercase tracking-wider text-slate-500 mb-3">
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
          {isAdmin && <InviteMemberForm groupId={groupId} />}
          <MemberList
            members={members}
            isAdmin={isAdmin}
            currentUserId={user?.id ?? ''}
            onRemove={handleRemoveMember}
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

      {/* Archive dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive group?</DialogTitle>
            <DialogDescription>
              This group will be hidden from your main list. You can unarchive it later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setArchiveDialogOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleArchive}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
