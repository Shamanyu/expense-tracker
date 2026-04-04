'use client'

import { useState } from 'react'
import { useGroups } from '@/hooks/useGroups'
import { useUser } from '@/hooks/useUser'
import { GroupCard } from '@/components/groups/GroupCard'
import { GroupForm } from '@/components/groups/GroupForm'
import { createGroup } from '@/app/actions/groups'
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
import { Plus, Users } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createBrowserClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

function useGroupsWithMeta() {
  const supabase = createBrowserClient()

  return useQuery({
    queryKey: ['groups-with-meta'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // Get groups
      const { data: groups } = await supabase
        .from('groups')
        .select('*')
        .is('archived_at', null)
        .order('created_at', { ascending: false })

      if (!groups?.length) return []

      const groupIds = groups.map((g) => g.id)

      // Get member counts
      const { data: members } = await supabase
        .from('group_members')
        .select('group_id, user_id')
        .in('group_id', groupIds)

      const memberCounts: Record<string, number> = {}
      for (const m of members ?? []) {
        memberCounts[m.group_id] = (memberCounts[m.group_id] ?? 0) + 1
      }

      return groups.map((g) => ({
        group: g,
        memberCount: memberCounts[g.id] ?? 0,
        yourBalance: 0, // Simplified for list view
      }))
    },
  })
}

export default function GroupsPage() {
  const { data: groups, isLoading } = useGroupsWithMeta()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const handleCreateGroup = async (data: {
    name: string
    description?: string
    default_currency: string
  }) => {
    setIsSubmitting(true)
    try {
      const result = await createGroup(data)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Group created!')
        setOpen(false)
        queryClient.invalidateQueries({ queryKey: ['groups-with-meta'] })
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
        <h1 className="text-[22px] font-semibold text-slate-800">Groups</h1>
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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : !groups?.length ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map(({ group, memberCount, yourBalance }) => (
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
