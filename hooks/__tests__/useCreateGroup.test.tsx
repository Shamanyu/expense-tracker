import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useCreateGroup, addMembersToGroup } from '../useCreateGroup'

// Mock server actions
vi.mock('@/app/actions/groups', () => ({
  createGroup: vi.fn(),
  addMember: vi.fn(),
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

import { createGroup, addMember } from '@/app/actions/groups'
import { toast } from 'sonner'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  // Register mutation defaults like providers.tsx does
  queryClient.setMutationDefaults(['createGroup'], {
    mutationFn: async (data: Parameters<typeof createGroup>[0]) => {
      const result = await createGroup(data)
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

describe('useCreateGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsOnline = true
  })

  it('calls createGroup server action and invalidates queries on success', async () => {
    const mockGroup = { id: 'g1', name: 'Test Group' }
    vi.mocked(createGroup).mockResolvedValue({ error: null, data: mockGroup })

    const { queryClient, wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateGroup(), { wrapper })

    act(() => {
      result.current.mutate({
        name: 'Test Group',
        default_currency: 'INR',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(createGroup).toHaveBeenCalledWith({
      name: 'Test Group',
      default_currency: 'INR',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-groups-with-balances'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['groups'] })
  })

  it('shows error toast on failure', async () => {
    vi.mocked(createGroup).mockResolvedValue({ error: 'Name is required', data: null })

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateGroup(), { wrapper })

    act(() => {
      result.current.mutate({
        name: '',
        default_currency: 'INR',
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Name is required')
  })

  it('shows offline toast when offline', async () => {
    mockIsOnline = false
    vi.mocked(createGroup).mockResolvedValue({ error: null, data: { id: 'g1' } })

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateGroup(), { wrapper })

    act(() => {
      result.current.mutate({
        name: 'Offline Group',
        default_currency: 'INR',
      })
    })

    // onMutate fires synchronously
    expect(toast.info).toHaveBeenCalledWith('Saved offline — will sync when connected')
  })

  it('does not show offline toast when online', async () => {
    mockIsOnline = true
    vi.mocked(createGroup).mockResolvedValue({ error: null, data: { id: 'g1' } })

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateGroup(), { wrapper })

    act(() => {
      result.current.mutate({
        name: 'Online Group',
        default_currency: 'INR',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.info).not.toHaveBeenCalled()
  })
})

describe('addMembersToGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds multiple members and counts results', async () => {
    vi.mocked(addMember)
      .mockResolvedValueOnce({ error: null, invited: false })
      .mockResolvedValueOnce({ error: null, invited: true })

    const result = await addMembersToGroup('g1', ['alice@test.com', 'bob@test.com'])

    expect(result.added).toBe(1)
    expect(result.invited).toBe(1)
    expect(result.errors).toHaveLength(0)
    expect(addMember).toHaveBeenCalledTimes(2)
  })

  it('collects errors per member', async () => {
    vi.mocked(addMember)
      .mockResolvedValueOnce({ error: null, invited: false })
      .mockResolvedValueOnce({ error: 'Already a member' })

    const result = await addMembersToGroup('g1', ['alice@test.com', 'bob@test.com'])

    expect(result.added).toBe(1)
    expect(result.invited).toBe(0)
    expect(result.errors).toEqual(['bob@test.com: Already a member'])
  })

  it('skips empty email strings', async () => {
    vi.mocked(addMember).mockResolvedValue({ error: null, invited: false })

    const result = await addMembersToGroup('g1', ['alice@test.com', '', '  '])

    expect(addMember).toHaveBeenCalledTimes(1)
    expect(result.added).toBe(1)
  })
})
