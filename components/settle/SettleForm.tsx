'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CurrencySelect } from '@/components/common/CurrencySelect'
import { useGroupMembers } from '@/hooks/useGroupMembers'
import { recordSettlement } from '@/app/actions/settlements'
import { callServerAction } from '@/lib/utils/serverAction'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function SettleForm({
  groupId,
  defaultCurrency,
}: {
  groupId: string
  defaultCurrency: string
}) {
  const { data: members = [] } = useGroupMembers(groupId)
  const queryClient = useQueryClient()
  const [payerId, setPayerId] = useState('')
  const [payeeId, setPayeeId] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState(defaultCurrency)
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payerId || !payeeId || !amount || payerId === payeeId) return

    setIsLoading(true)
    try {
      const result = await callServerAction(() => recordSettlement({
        group_id: groupId,
        payer_id: payerId,
        payee_id: payeeId,
        amount: parseFloat(amount),
        currency,
        notes: notes || undefined,
      }))
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Payment recorded!')
        queryClient.invalidateQueries({ queryKey: ['balances', groupId] })
        queryClient.invalidateQueries({ queryKey: ['settlements', groupId] })
        queryClient.invalidateQueries({ queryKey: ['dashboard-balances'] })
        queryClient.invalidateQueries({ queryKey: ['my-groups-with-balances'] })
        setPayerId('')
        setPayeeId('')
        setAmount('')
        setNotes('')
      }
    } catch {
      toast.error('Network error — try again when online')
    } finally {
      setIsLoading(false)
    }
  }

  const memberName = (id: string) => {
    const m = members.find((m) => m.user_id === id)
    return m ? (m.profile.full_name ?? m.profile.email) : null
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">
        Record custom payment
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Payer</Label>
          <Select value={payerId} onValueChange={(v) => v && setPayerId(v)}>
            <SelectTrigger className="mt-1 rounded-xl border-slate-700 bg-slate-800">
              <SelectValue placeholder="Who paid?">
                {(value) => memberName(value as string) ?? 'Who paid?'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.user_id} value={m.user_id}>
                  {m.profile.full_name ?? m.profile.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Payee</Label>
          <Select value={payeeId} onValueChange={(v) => v && setPayeeId(v)}>
            <SelectTrigger className="mt-1 rounded-xl border-slate-700 bg-slate-800">
              <SelectValue placeholder="Who received?">
                {(value) => memberName(value as string) ?? 'Who received?'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {members
                .filter((m) => m.user_id !== payerId)
                .map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.profile.full_name ?? m.profile.email}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Amount</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 rounded-xl border-slate-700 bg-slate-900 tabular-nums"
            placeholder="0.00"
          />
        </div>
        <div>
          <Label>Currency</Label>
          <div className="mt-1">
            <CurrencySelect value={currency} onValueChange={setCurrency} />
          </div>
        </div>
      </div>

      <div>
        <Label>Notes (optional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 rounded-xl border-slate-700 bg-slate-900"
          rows={2}
          placeholder="e.g. Venmo payment"
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading || !payerId || !payeeId || !amount || payerId === payeeId}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
      >
        {isLoading ? 'Recording...' : 'Record Payment'}
      </Button>
    </form>
  )
}
