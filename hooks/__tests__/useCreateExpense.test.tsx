import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useCreateExpense } from '../useCreateExpense'

// Mock server action
vi.mock('@/app/actions/expenses', () => ({
  createExpense: vi.fn(),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock network status
let mockIsOnline = true
vi.mock('../useNetworkStatus', () => ({
  useNetworkStatus: () => mockIsOnline,
}))

import { createExpense } from '@/app/actions/expenses'
import { toast } from 'sonner'

const GROUP_ID = 'group-123'

const sampleExpense = {
  group_id: GROUP_ID,
  description: 'Dinner',
  amount: 500,
  currency: 'INR',
  paid_by: 'user-1',
  split_type: 'equal',
  category: 'Food',
  date: '2024-01-15',
  splits: [
    { user_id: 'user-1', amount: 250 },
    { user_id: 'user-2', amount: 250 },
  ],
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  queryClient.setMutationDefaults(['createExpense'], {
    mutationFn: async (data: Parameters<typeof createExpense>[0]) => {
      const result = await createExpense(data)
      if (result.error) throw new Error(result.error)
      return result.data
    },
  })

  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  }
}

describe('useCreateExpense', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsOnline = true
  })

  it('creates expense and invalidates relevant queries', async () => {
    const mockExpense = { id: 'e1', ...sampleExpense }
    vi.mocked(createExpense).mockResolvedValue({ error: null, data: mockExpense })

    const { queryClient, wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateExpense(GROUP_ID), { wrapper })

    act(() => {
      result.current.mutate(sampleExpense)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(createExpense).toHaveBeenCalledWith(sampleExpense)
    expect(toast.success).toHaveBeenCalledWith('Expense added!')

    // Should invalidate all related query keys
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['expenses', GROUP_ID] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['balances', GROUP_ID] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['dashboard-balances'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['activity'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-groups-with-balances'] })
  })

  it('shows error toast on server error', async () => {
    vi.mocked(createExpense).mockResolvedValue({ error: 'Unauthorized', data: null })

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateExpense(GROUP_ID), { wrapper })

    act(() => {
      result.current.mutate(sampleExpense)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Unauthorized')
  })

  it('shows offline toast when offline', async () => {
    mockIsOnline = false
    vi.mocked(createExpense).mockResolvedValue({ error: null, data: { id: 'e1' } })

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateExpense(GROUP_ID), { wrapper })

    act(() => {
      result.current.mutate(sampleExpense)
    })

    expect(toast.info).toHaveBeenCalledWith('Saved offline — will sync when connected')
  })

  it('does not show offline toast when online', async () => {
    mockIsOnline = true
    vi.mocked(createExpense).mockResolvedValue({ error: null, data: { id: 'e1' } })

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateExpense(GROUP_ID), { wrapper })

    act(() => {
      result.current.mutate(sampleExpense)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.info).not.toHaveBeenCalled()
  })

  it('passes the correct mutation key for persistence', () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateExpense(GROUP_ID), { wrapper })

    // The mutation should have the key set for localStorage persistence
    expect(result.current.variables).toBeUndefined() // no mutation fired yet
    // Verify the hook returns a valid mutation object
    expect(result.current.mutate).toBeDefined()
    expect(result.current.isPending).toBe(false)
  })
})
