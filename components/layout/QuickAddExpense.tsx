'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/common/UserAvatar'
import { Plus, Users, User, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useFriends } from '@/hooks/useFriends'
import { createBrowserClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { getOrCreateDirectGroup } from '@/app/actions/direct-expense'
import { callServerAction } from '@/lib/utils/serverAction'
import { toast } from 'sonner'

function useMyGroupsList() {
  const supabase = createBrowserClient()
  return useQuery({
    queryKey: ['my-groups-list'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)

      const groupIds = (memberships ?? []).map((m) => m.group_id)
      if (groupIds.length === 0) return []

      const { data: groups } = await supabase
        .from('groups')
        .select('id, name')
        .in('id', groupIds)
        .order('created_at', { ascending: false })

      return groups ?? []
    },
  })
}

export function QuickAddExpense() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { data: groups = [] } = useMyGroupsList()
  const { data: friends = [] } = useFriends()
  const router = useRouter()

  const q = search.toLowerCase()

  const filteredGroups = groups.filter((g) =>
    !q || g.name.toLowerCase().includes(q)
  )

  const allFriends = friends.filter(
    (f) => f.status === 'accepted' || f.status === 'group_friend'
  )
  const filteredFriends = allFriends.filter((f) =>
    !q ||
    (f.profile.full_name?.toLowerCase().includes(q)) ||
    f.profile.email.toLowerCase().includes(q)
  )

  const handleGroupClick = (groupId: string) => {
    setOpen(false)
    setSearch('')
    router.push(`/groups/${groupId}/expenses/new`)
  }

  const handleFriendClick = async (friendId: string) => {
    setIsLoading(true)
    try {
      const result = await callServerAction(() => getOrCreateDirectGroup(friendId))
      if (result?.error) {
        toast.error(result.error)
      } else if (result?.groupId) {
        setOpen(false)
        setSearch('')
        router.push(`/groups/${result.groupId}/expenses/new`)
      }
    } catch {
      toast.error('Network error — try again when online')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
          />
        }
      >
        <Plus className="w-4 h-4 mr-1" />
        <span className="hidden sm:inline">Add Expense</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-slate-700 bg-slate-900"
            placeholder="Search groups or friends..."
            autoFocus
          />
        </div>

        <div className="max-h-[50vh] overflow-y-auto space-y-4 mt-2">
          {/* Groups */}
          {filteredGroups.length > 0 && (
            <div>
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-2 px-1">
                Groups
              </h3>
              <div className="space-y-1">
                {filteredGroups.slice(0, 8).map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleGroupClick(g.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-700/50 transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded-full bg-indigo-950 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-indigo-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-200 truncate">
                      {g.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Friends */}
          {filteredFriends.length > 0 && (
            <div>
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-2 px-1">
                Friends
              </h3>
              <div className="space-y-1">
                {filteredFriends.slice(0, 8).map((f) => (
                  <button
                    key={f.profile.id}
                    onClick={() => handleFriendClick(f.profile.id)}
                    disabled={isLoading}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-700/50 transition-colors text-left disabled:opacity-50"
                  >
                    <UserAvatar profile={f.profile} className="h-8 w-8" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {f.profile.full_name ?? f.profile.email}
                      </p>
                      {f.profile.full_name && (
                        <p className="text-xs text-slate-500 truncate">{f.profile.email}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredGroups.length === 0 && filteredFriends.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">
              No matching groups or friends
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
