import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// We need to reset the module state between tests since markOffline sets
// module-level state (failedFetchOverride)
let useNetworkStatus: typeof import('../useNetworkStatus').useNetworkStatus
let markOffline: typeof import('../useNetworkStatus').markOffline

describe('useNetworkStatus', () => {
  const originalOnLine = navigator.onLine

  beforeEach(async () => {
    // Re-import to reset module-level state
    vi.resetModules()
    const mod = await import('../useNetworkStatus')
    useNetworkStatus = mod.useNetworkStatus
    markOffline = mod.markOffline

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

  it('updates when going offline via browser event', () => {
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

  it('markOffline() immediately flips status to offline', () => {
    Object.defineProperty(navigator, 'onLine', { writable: true, value: true })
    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current).toBe(true)

    act(() => {
      markOffline()
    })

    // Even though navigator.onLine is still true, markOffline overrides it
    expect(result.current).toBe(false)
  })

  it('online event resets markOffline override', () => {
    Object.defineProperty(navigator, 'onLine', { writable: true, value: true })
    const { result } = renderHook(() => useNetworkStatus())

    act(() => {
      markOffline()
    })
    expect(result.current).toBe(false)

    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(result.current).toBe(true)
  })

  it('markOffline() is idempotent — multiple calls do not throw', () => {
    const { result } = renderHook(() => useNetworkStatus())

    act(() => {
      markOffline()
      markOffline()
      markOffline()
    })

    expect(result.current).toBe(false)
  })
})
