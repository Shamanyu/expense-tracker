'use client'

import { useUser } from '@/hooks/useUser'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function TopBar() {
  const { data: user } = useUser()
  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 md:px-6">
      <div className="md:hidden">
        <h1 className="text-lg font-semibold text-slate-800">Splitwise</h1>
      </div>
      <div className="hidden md:block" />
      <Avatar className="h-8 w-8">
        <AvatarImage src={user?.avatar_url ?? undefined} alt={user?.full_name ?? 'User'} />
        <AvatarFallback className="bg-indigo-600 text-white text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>
    </header>
  )
}
