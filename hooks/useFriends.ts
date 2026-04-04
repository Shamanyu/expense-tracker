'use client'

import { useQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'
import type { Profile, Friendship } from '@/lib/types/database.types'

type FriendData = {
  profile: Profile
  friendship: Friendship | null
  status: 'accepted' | 'pending' | 'group_friend'
  is_requester: boolean
}

export function useFriends() {
  const supabase = createBrowserClient()

  return useQuery<FriendData[]>({
    queryKey: ['friends'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // Get explicit friendships
      const { data: friendships } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

      // Get all group members from user's groups
      const { data: myGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)

      const groupIds = (myGroups ?? []).map((g) => g.group_id)

      let groupFriendIds: string[] = []
      if (groupIds.length > 0) {
        const { data: groupMembers } = await supabase
          .from('group_members')
          .select('user_id')
          .in('group_id', groupIds)
          .neq('user_id', user.id)

        groupFriendIds = [...new Set((groupMembers ?? []).map((m) => m.user_id))]
      }

      // Collect all friend user IDs
      const friendUserIds = new Set<string>()
      const friendshipMap = new Map<string, Friendship>()

      for (const f of friendships ?? []) {
        const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id
        friendUserIds.add(friendId)
        friendshipMap.set(friendId, f)
      }
      for (const id of groupFriendIds) {
        friendUserIds.add(id)
      }

      if (friendUserIds.size === 0) return []

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', Array.from(friendUserIds))

      const profileMap = new Map<string, Profile>()
      for (const p of profiles ?? []) {
        profileMap.set(p.id, p)
      }

      const result: FriendData[] = []
      for (const id of friendUserIds) {
        const profile = profileMap.get(id)
        if (!profile) continue

        const friendship = friendshipMap.get(id) ?? null
        const isRequester = friendship?.requester_id === user.id

        let status: FriendData['status'] = 'group_friend'
        if (friendship) {
          status = friendship.status as 'accepted' | 'pending'
        }

        result.push({ profile, friendship, status, is_requester: isRequester })
      }

      return result
    },
  })
}
