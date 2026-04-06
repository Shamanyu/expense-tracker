'use client'

import { useSyncExternalStore } from 'react'

// Track offline state from both navigator.onLine AND failed network requests
let failedFetchOverride = false
const listeners = new Set<() => void>()

function notifyAll() {
  for (const cb of listeners) cb()
}

function subscribe(callback: () => void) {
  listeners.add(callback)

  const handleOnline = () => {
    failedFetchOverride = false
    notifyAll()
  }
  const handleOffline = () => {
    notifyAll()
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  return () => {
    listeners.delete(callback)
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

function getSnapshot() {
  return navigator.onLine && !failedFetchOverride
}

function getServerSnapshot() {
  return true
}

/**
 * Call this when a network request fails with a TypeError (network error).
 * This immediately flips the status to offline without waiting for
 * the browser's slow `offline` event.
 */
export function markOffline() {
  if (!failedFetchOverride) {
    failedFetchOverride = true
    notifyAll()
  }
}

export function useNetworkStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
