'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useNetworkStatus } from './useNetworkStatus'
import type { createExpense } from '@/app/actions/expenses'

type CreateExpenseInput = Parameters<typeof createExpense>[0]

export function useCreateExpense(groupId: string) {
  const queryClient = useQueryClient()
  const isOnline = useNetworkStatus()

  return useMutation<unknown, Error, CreateExpenseInput>({
    mutationKey: ['createExpense'],
    // mutationFn inherited from setMutationDefaults in providers.tsx
    onMutate: () => {
      if (!isOnline) {
        toast.info('Saved offline — will sync when connected')
      }
    },
    onSuccess: () => {
      toast.success('Expense added!')
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] })
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-balances'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
      queryClient.invalidateQueries({ queryKey: ['my-groups-with-balances'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add expense')
    },
  })
}
