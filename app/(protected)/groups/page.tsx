'use client'

import { useState } from 'react'
import { GroupCard } from '@/components/groups/GroupCard'
import { GroupForm } from '@/components/groups/GroupForm'
import { EmptyState } from '@/components/common/EmptyState'
import { CardSkeleton } from '@/components/common/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Users, Archive } from 'lucide-react'
import { toast } from 'sonner'
import { createBrowserClient } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { computeNetBalances } from '@/lib/utils/balances'
import { cn } from '@/lib/utils'
import { useCreateGroup, addMembersToGroup } from '@/hooks/useCreateGroup'
import { archiveGroup, unarchiveGroup } from '@/app/actions/groups'

type GroupListItem = {
  group: {
    id: string
    name: string
    description: string | null
    default_currency: string
    created_at: string
    archived_at: string | null
    [key: string]: unknown
  }
  memberCount: number
  yourBalance: number
  lastActivity: string // ISO date of most recent expense/settlement
  userArchived: boolean // whether this user manually archived it
}

function useMyGroups() {
  const supabase = createBrowserClient()

  return useQuery({
    queryKey: ['my-groups-with-balances'],
    queryFn: async (): Promise<GroupListItem[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // Get groups the user is a member of (including per-user archived_at)
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id, archived_at')
        .eq('user_id', user.id)

      const groupIds = (memberships ?? []).map((m) => m.group_id)
      if (groupIds.length === 0) return []

      const userArchivedMap: Record<string, string | null> = {}
      for (const m of memberships ?? []) {
        userArchivedMap[m.group_id] = m.archived_at ?? null
      }

      // Get group details
      const { data: groups } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false })

      if (!groups?.length) return []

      // Get member counts
      const { data: allMembers } = await supabase
        .from('group_members')
        .select('group_id, user_id')
        .in('group_id', groupIds)

      const memberCounts: Record<string, number> = {}
      for (const m of allMembers ?? []) {
        memberCounts[m.group_id] = (memberCounts[m.group_id] ?? 0) + 1
      }

      // Get expenses and splits for balance computation + last activity
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .in('group_id', groupIds)
        .is('deleted_at', null)

      const expenseIds = (expenses ?? []).map((e) => e.id)
      const { data: splits } = expenseIds.length > 0
        ? await supabase
            .from('expense_splits')
            .select('*')
            .in('expense_id', expenseIds)
        : { data: [] }

      const { data: settlements } = await supabase
        .from('settlements')
        .select('*')
        .in('group_id', groupIds)

      // Compute per-group balance and last activity
      return groups.map((g) => {
        const groupExpenses = (expenses ?? []).filter((e) => e.group_id === g.id)
        const groupExpenseIds = new Set(groupExpenses.map((e) => e.id))
        const groupSplits = (splits ?? []).filter((s) => groupExpenseIds.has(s.expense_id))
        const groupSettlements = (settlements ?? []).filter((s) => s.group_id === g.id)

        const expensesWithSplits = groupExpenses.map((e) => ({
          ...e,
          splits: groupSplits.filter((s) => s.expense_id === e.id),
        }))

        const netBalances = computeNetBalances(expensesWithSplits, groupSettlements)
        const yourBalance = netBalances[user.id] ?? 0

        // Last activity = most recent expense or settlement date
        const dates: string[] = [
          g.created_at,
          ...groupExpenses.map((e) => e.created_at),
          ...groupSettlements.map((s) => s.settled_at),
        ]
        const lastActivity = dates.sort().reverse()[0] ?? g.created_at

        return {
          group: g,
          memberCount: memberCounts[g.id] ?? 0,
          yourBalance: Math.round(yourBalance * 100) / 100,
          lastActivity,
          userArchived: !!userArchivedMap[g.id],
        }
      })
    },
  })
}

export default function GroupsPage() {
  const { data: allGroups, isLoading } = useMyGroups()
  const [open, setOpen] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const createGroupMutation = useCreateGroup()
  const queryClient = useQueryClient()

  const handleArchive = async (groupId: string) => {
    const result = await archiveGroup(groupId)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Group archived')
      queryClient.invalidateQueries({ queryKey: ['my-groups-with-balances'] })
    }
  }

  const handleUnarchive = async (groupId: string) => {
    const result = await unarchiveGroup(groupId)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Group unarchived')
      queryClient.invalidateQueries({ queryKey: ['my-groups-with-balances'] })
    }
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Filter out direct (1:1) groups — those are managed via Friends tab
  const regularGroups = (allGroups ?? []).filter(
    (g) => !g.group.name.startsWith('Direct:')
  )

  // A group is "archived" if:
  //  1) The user manually archived it, OR
  //  2) No activity in 30 days AND balance is zero (auto-archived)
  // BUT: any group with a non-zero balance always shows as active (resurfaces)
  const isArchived = (g: GroupListItem) => {
    // Non-zero balance → always active, even if manually archived
    if (Math.abs(g.yourBalance) > 0.01) return false
    // User explicitly archived it
    if (g.userArchived) return true
    // Auto-archive: no activity in 30 days and settled
    if (new Date(g.lastActivity) <= thirtyDaysAgo) return true
    return false
  }

  const activeGroups = regularGroups.filter((g) => !isArchived(g))
  const archivedGroups = regularGroups.filter((g) => isArchived(g))

  const displayedGroups = showArchived
    ? regularGroups
    : activeGroups

  const handleCreateGroup = (data: {
    name: string
    description?: string
    default_currency: string
    memberEmails?: string[]
  }) => {
    createGroupMutation.mutate(
      {
        name: data.name,
        description: data.description,
        default_currency: data.default_currency,
      },
      {
        onSuccess: async (group) => {
          // Add members (requires group ID from server, so only works online)
          if (data.memberEmails?.length && group?.id) {
            const { added, invited, errors } = await addMembersToGroup(
              group.id,
              data.memberEmails,
            )
            for (const err of errors) toast.error(err)
            const parts: string[] = ['Group created!']
            if (added > 0) parts.push(`${added} member${added > 1 ? 's' : ''} added.`)
            if (invited > 0) parts.push(`${invited} invite${invited > 1 ? 's' : ''} sent — they'll be added when they join Settl.`)
            toast.success(parts.join(' '))
          } else {
            toast.success('Group created!')
          }
          setOpen(false)
        },
      },
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold text-slate-100">Groups</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className={cn(
              "rounded-xl border-slate-700 hover:bg-slate-800",
              showArchived ? "text-indigo-400 border-indigo-500/50" : "text-slate-300"
            )}
          >
            <Archive className="w-4 h-4 mr-1" />
            {showArchived ? 'Hide archived' : `Archived${archivedGroups.length > 0 ? ` (${archivedGroups.length})` : ''}`}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl" />
              }
            >
              <Plus className="w-4 h-4 mr-1" />
              New Group
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new group</DialogTitle>
              </DialogHeader>
              <GroupForm onSubmit={handleCreateGroup} isSubmitting={createGroupMutation.isPending} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : !allGroups?.length ? (
        <EmptyState
          icon={Users}
          title="No groups yet"
          description="Create your first group to start splitting expenses."
          action={
            <Button
              onClick={() => setOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create Group
            </Button>
          }
        />
      ) : displayedGroups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="All groups settled!"
          description={archivedGroups.length > 0
            ? `You have ${archivedGroups.length} archived group${archivedGroups.length > 1 ? 's' : ''}. Click 'Archived' to view them.`
            : 'All your groups have zero balance.'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedGroups.map((item) => (
            <GroupCard
              key={item.group.id}
              group={item.group}
              memberCount={item.memberCount}
              yourBalance={item.yourBalance}
              archived={isArchived(item)}
              onArchive={handleArchive}
              onUnarchive={handleUnarchive}
            />
          ))}
        </div>
      )}
    </div>
  )
}
