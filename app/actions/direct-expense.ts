'use server'

import { createServerClient } from '@/lib/supabase/server'

/**
 * Gets or creates a 1:1 direct group between the current user and another user.
 * Returns the group ID.
 */
export async function getOrCreateDirectGroup(friendId: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', groupId: null }

  // Find existing 2-person groups where both users are members
  const { data: myGroups } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)

  const myGroupIds = (myGroups ?? []).map((g) => g.group_id)
  if (myGroupIds.length > 0) {
    const { data: friendGroups } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', friendId)
      .in('group_id', myGroupIds)

    const sharedGroupIds = (friendGroups ?? []).map((g) => g.group_id)

    // Check if any shared group has exactly 2 members and is a "direct" group
    for (const gid of sharedGroupIds) {
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', gid)

      const { data: group } = await supabase
        .from('groups')
        .select('name')
        .eq('id', gid)
        .single()

      if (members?.length === 2 && group?.name.startsWith('Direct:')) {
        return { error: null, groupId: gid }
      }
    }
  }

  // Fetch friend profile for naming
  const { data: friendProfile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', friendId)
    .single()

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('full_name, email, default_currency')
    .eq('id', user.id)
    .single()

  const friendName = friendProfile?.full_name ?? friendProfile?.email ?? 'Friend'
  const myName = myProfile?.full_name ?? myProfile?.email ?? 'Me'

  // Create a direct group
  const { data: group, error } = await supabase
    .from('groups')
    .insert({
      name: `Direct: ${myName} & ${friendName}`,
      description: null,
      default_currency: myProfile?.default_currency ?? 'INR',
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message, groupId: null }

  // Add both as members
  await supabase.from('group_members').insert([
    { group_id: group.id, user_id: user.id, role: 'admin' },
    { group_id: group.id, user_id: friendId, role: 'member' },
  ])

  return { error: null, groupId: group.id }
}
