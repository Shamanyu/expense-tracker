'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { addMember } from '@/app/actions/groups'
import { useQueryClient } from '@tanstack/react-query'

export function InviteMemberForm({ groupId }: { groupId: string }) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    try {
      const result = await addMember(groupId, email.trim())
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(
          result?.invited
            ? 'Invite sent! They\'ll be added when they join Settl.'
            : 'Member added successfully!'
        )
        setEmail('')
        queryClient.invalidateQueries({ queryKey: ['group-members', groupId] })
      }
    } catch {
      toast.error('Failed to add member')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="email"
        placeholder="Enter email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 rounded-xl border-slate-700 bg-slate-800"
      />
      <Button
        type="submit"
        disabled={isLoading}
        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
      >
        <UserPlus className="w-4 h-4 mr-1" />
        Add
      </Button>
    </form>
  )
}
