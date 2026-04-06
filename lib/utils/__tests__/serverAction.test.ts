import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the useNetworkStatus module before importing callServerAction
vi.mock('@/hooks/useNetworkStatus', () => ({
  markOffline: vi.fn(),
  useNetworkStatus: () => true,
}))

import { callServerAction } from '../serverAction'
import { markOffline } from '@/hooks/useNetworkStatus'

describe('callServerAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the result of a successful server action', async () => {
    const action = vi.fn().mockResolvedValue({ data: 'ok', error: null })
    const result = await callServerAction(action)
    expect(result).toEqual({ data: 'ok', error: null })
    expect(markOffline).not.toHaveBeenCalled()
  })

  it('calls markOffline on TypeError (network failure)', async () => {
    const action = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(callServerAction(action)).rejects.toThrow('Failed to fetch')
    expect(markOffline).toHaveBeenCalledOnce()
  })

  it('does NOT call markOffline on non-TypeError errors', async () => {
    const action = vi.fn().mockRejectedValue(new Error('Server error'))
    await expect(callServerAction(action)).rejects.toThrow('Server error')
    expect(markOffline).not.toHaveBeenCalled()
  })

  it('re-throws the original error after marking offline', async () => {
    const originalError = new TypeError('Load failed')
    const action = vi.fn().mockRejectedValue(originalError)
    try {
      await callServerAction(action)
      expect.fail('Should have thrown')
    } catch (err) {
      expect(err).toBe(originalError)
    }
    expect(markOffline).toHaveBeenCalledOnce()
  })

  it('passes through void-returning server actions', async () => {
    const action = vi.fn().mockResolvedValue(undefined)
    const result = await callServerAction(action)
    expect(result).toBeUndefined()
    expect(markOffline).not.toHaveBeenCalled()
  })
})
