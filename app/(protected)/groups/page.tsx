'use client'

import { useState } from 'react'
import { GroupCard } from '@/components/groups/GroupCard'
import { GroupForm } from '@/components/groups/GroupForm'
import { createGroup, addMember } from '@/app/actions/groups'
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
import { Plus, Users, Eye, EyeOff } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createBrowserClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { computeNetBalances } from '@/lib/utils/balances'

function useMyGroups() {
  const supabase = createBrowserClient()

  return useQuery({
    queryKey: ['my-groups-with-balances'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // Get groups the user is a member of
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)

      const groupIds = (memberships ?? []).map((m) => m.group_id)
      if (groupIds.length === 0) return []

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

      // Get expenses and splits for balance computation
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .in('group_id', groupIds)
        .is('deleted_at', null)

      const { data: splits } = await supabase
        .from('expense_splits')
        .select('*')

      const { data: settlements } = await supabase
        .from('settlements')
        .select('*')
        .in('group_id', groupIds)

      // Compute per-group balance for current user
      return groups.map((g) => {
        const groupExpenses = (expenses ?? []).filter((e) => e.group_id === g.id)
        const expenseIds = new Set(groupExpenses.map((e) => e.id))
        const groupSplits = (splits ?? []).filter((s) => expenseIds.has(s.expense_id))
        const groupSettlements = (settlements ?? []).filter((s) => s.group_id === g.id)

        const expensesWithSplits = groupExpenses.map((e) => ({
          ...e,
          splits: groupSplits.filter((s) => s.expense_id === e.id),
        }))

        const netBalances = computeNetBalances(expensesWithSplits, groupSettlements)
        const yourBalance = netBalances[user.id] ?? 0

        return {
          group: g,
          memberCount: memberCounts[g.id] ?? 0,
          yourBalance: Math.round(yourBalance * 100) / 100,
        }
      })
    },
  })
}

export default function GroupsPage() {
  const { data: allGroups, isLoading } = useMyGroups()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSettled, setShowSettled] = useState(false)
  const queryClient = useQueryClient()

  const activeGroups = (allGroups ?? []).filter((g) => Math.abs(g.yourBalance) > 0.01)
  const settledGroups = (allGroups ?? []).filter((g) => Math.abs(g.yourBalance) <= 0.01)
  const displayedGroups = showSettled ? (allGroups ?? []) : activeGroups

  const handleCreateGroup = async (data: {
    name: string
    description?: string
    default_currency: string
    memberEmails?: string[]
  }) => {
    setIsSubmitting(true)
    try {
      const result = await createGroup({
        name: data.name,
        description: data.description,
        default_currency: data.default_currency,
      })
      if (result?.error) {
        toast.error(result.error)
      } else {
        // Add members if any
        if (data.memberEmails?.length && result?.data?.id) {
          for (const email of data.memberEmails) {
            if (email.trim()) {
              await addMember(result.data.id, email.trim())
            }
          }
        }
        toast.success('Group created!')
        setOpen(false)
        queryClient.invalidateQueries({ queryKey: ['my-groups-with-balances'] })
        queryClient.invalidateQueries({ queryKey: ['groups'] })
      }
    } catch {
      toast.error('Failed to create group')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold text-slate-100">Groups</h1>
        <div className="flex gap-2">
          {settledGroups.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettled(!showSettled)}
              className="rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              {showSettled ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {showSettled ? 'Hide settled' : `Show settled (${settledGroups.length})`}
            </Button>
          )}
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
              <GroupForm onSubmit={handleCreateGroup} isSubmitting={isSubmitting} />
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
          description="All your groups have zero balance. Click 'Show settled' to see them."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedGroups.map(({ group, memberCount, yourBalance }) => (
            <GroupCard
              key={group.id}
              group={group}
              memberCount={memberCount}
              yourBalance={yourBalance}
            />
          ))}
        </div>
      )}
    </div>
  )
}
