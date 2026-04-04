'use client'

import { useFriends } from '@/hooks/useFriends'
import { FriendCard } from '@/components/friends/FriendCard'
import { FriendSearch } from '@/components/friends/FriendSearch'
import { EmptyState } from '@/components/common/EmptyState'
import { ListSkeleton } from '@/components/common/LoadingSkeleton'
import { UserCircle } from 'lucide-react'

export default function FriendsPage() {
  const { data: friends, isLoading } = useFriends()

  const pendingIncoming = friends?.filter(
    (f) => f.status === 'pending' && !f.is_requester
  )
  const accepted = friends?.filter((f) => f.status === 'accepted')
  const groupOnly = friends?.filter((f) => f.status === 'group_friend')
  const pendingOutgoing = friends?.filter(
    (f) => f.status === 'pending' && f.is_requester
  )

  const hasAnyone =
    (pendingIncoming?.length ?? 0) +
    (accepted?.length ?? 0) +
    (groupOnly?.length ?? 0) +
    (pendingOutgoing?.length ?? 0) > 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-[22px] font-semibold text-slate-100">Friends</h1>

      <FriendSearch />

      {isLoading ? (
        <ListSkeleton />
      ) : (
        <>
          {/* Pending incoming requests */}
          {(pendingIncoming?.length ?? 0) > 0 && (
            <div>
              <h2 className="text-[13px] font-medium uppercase tracking-wider text-slate-400 mb-3">
                Friend Requests
              </h2>
              <div className="space-y-2">
                {pendingIncoming?.map((f) => (
                  <FriendCard
                    key={f.profile.id}
                    profile={f.profile}
                    status={f.status}
                    friendshipId={f.friendship?.id ?? null}
                    isRequester={f.is_requester}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Accepted friends */}
          {(accepted?.length ?? 0) > 0 && (
            <div>
              <h2 className="text-[13px] font-medium uppercase tracking-wider text-slate-400 mb-3">
                Your Friends
              </h2>
              <div className="space-y-2">
                {accepted?.map((f) => (
                  <FriendCard
                    key={f.profile.id}
                    profile={f.profile}
                    status={f.status}
                    friendshipId={f.friendship?.id ?? null}
                    isRequester={f.is_requester}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Group contacts — not yet friends */}
          {(groupOnly?.length ?? 0) > 0 && (
            <div>
              <h2 className="text-[13px] font-medium uppercase tracking-wider text-slate-400 mb-3">
                People from your groups
              </h2>
              <div className="space-y-2">
                {groupOnly?.map((f) => (
                  <FriendCard
                    key={f.profile.id}
                    profile={f.profile}
                    status={f.status}
                    friendshipId={f.friendship?.id ?? null}
                    isRequester={f.is_requester}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pending outgoing */}
          {(pendingOutgoing?.length ?? 0) > 0 && (
            <div>
              <h2 className="text-[13px] font-medium uppercase tracking-wider text-slate-400 mb-3">
                Sent Requests
              </h2>
              <div className="space-y-2">
                {pendingOutgoing?.map((f) => (
                  <FriendCard
                    key={f.profile.id}
                    profile={f.profile}
                    status={f.status}
                    friendshipId={f.friendship?.id ?? null}
                    isRequester={f.is_requester}
                  />
                ))}
              </div>
            </div>
          )}

          {!hasAnyone && (
            <EmptyState
              icon={UserCircle}
              title="No friends yet"
              description="Add friends by email or join a group to connect with others."
            />
          )}
        </>
      )}
    </div>
  )
}
