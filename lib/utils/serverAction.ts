import { markOffline } from '@/hooks/useNetworkStatus'

/**
 * Wraps a server action call to detect network failures instantly.
 * When a fetch fails with a TypeError (no network), we call markOffline()
 * so the offline banner appears immediately instead of waiting for the
 * browser's slow `offline` event.
 */
export async function callServerAction<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (error instanceof TypeError) {
      // TypeError from fetch = network is down
      markOffline()
    }
    throw error
  }
}
