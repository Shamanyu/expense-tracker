import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNetworkStatus } from '../useNetworkStatus'

describe('useNetworkStatus', () => {
  const originalOnLine = navigator.onLine

  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: originalOnLine,
    })
  })

  it('returns true when online', () => {
    Object.defineProperty(navigator, 'onLine', { value: true })
    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current).toBe(true)
  })

  it('returns false when offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false })
    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current).toBe(false)
  })

  it('updates when going offline', () => {
    Object.defineProperty(navigator, 'onLine', { writable: true, value: true })
    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current).toBe(true)

    act(() => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: false })
      window.dispatchEvent(new Event('offline'))
    })

    expect(result.current).toBe(false)
  })

  it('updates when going back online', () => {
    Object.defineProperty(navigator, 'onLine', { writable: true, value: false })
    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current).toBe(false)

    act(() => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: true })
      window.dispatchEvent(new Event('online'))
    })

    expect(result.current).toBe(true)
  })

  it('cleans up event listeners on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useNetworkStatus())

    expect(addSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(addSpy).toHaveBeenCalledWith('offline', expect.any(Function))

    unmount()

    expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function))

    addSpy.mockRestore()
    removeSpy.mockRestore()
  })
})
