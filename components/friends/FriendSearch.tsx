'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'
import { sendFriendRequest } from '@/app/actions/friends'
import { callServerAction } from '@/lib/utils/serverAction'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function FriendSearch() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    try {
      const result = await callServerAction(() => sendFriendRequest(email.trim()))
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(
          result?.invited
            ? 'Invite sent! They\'ll be added when they join Settl.'
            : 'Friend request sent!'
        )
        setEmail('')
        queryClient.invalidateQueries({ queryKey: ['friends'] })
      }
    } catch {
      toast.error('Network error — try again when online')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="email"
        placeholder="Add friend by email..."
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 rounded-xl border-slate-700 bg-slate-800"
      />
      <Button
        type="submit"
        disabled={isLoading || !email.trim()}
        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
      >
        <Send className="w-4 h-4 mr-1" />
        Send
      </Button>
    </form>
  )
}
