import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetworkStatus } from './useNetworkStatus';

const QUEUE_STORAGE_KEY = '@agrotrade/offline_queue';

export interface QueuedAction<T = unknown> {
  id: string;
  timestamp: number;
  action: () => Promise<T>;
  /** Human-readable label for logging / UI */
  label: string;
}

interface OfflineQueueState {
  pending: number;
  isProcessing: boolean;
}

/**
 * NI-17: useOfflineQueue
 *
 * Queues async actions (e.g. API mutations) when the device is offline and
 * auto-retries them in FIFO order as soon as connectivity is restored.
 *
 * Persistence: queue metadata is persisted in AsyncStorage so it survives
 * app restarts.  The action functions themselves are re-hydrated from the
 * in-memory list on the current session; actions from previous sessions are
 * not re-run automatically (they should be re-queued on next relevant user
 * interaction).
 *
 * Usage:
 *   const { enqueue, state } = useOfflineQueue();
 *
 *   async function submitOffer(data: OfferPayload) {
 *     enqueue({
 *       label: 'Submit offer',
 *       action: () => api.offers.create(data),
 *     });
 *   }
 */
export function useOfflineQueue() {
  const { isConnected } = useNetworkStatus();
  const queueRef = useRef<QueuedAction[]>([]);
  const [state, setState] = useState<OfflineQueueState>({ pending: 0, isProcessing: false });

  // ── Persist queue length to AsyncStorage ──────────────────────────────────
  const persistQueueMeta = useCallback(async (queue: QueuedAction[]) => {
    try {
      const meta = queue.map(({ id, timestamp, label }) => ({ id, timestamp, label }));
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(meta));
    } catch {
      // Non-critical; swallow storage errors
    }
  }, []);

  // ── Process the queue when online ─────────────────────────────────────────
  const processQueue = useCallback(async () => {
    if (state.isProcessing || queueRef.current.length === 0) return;

    setState((s) => ({ ...s, isProcessing: true }));

    // Process items one at a time, removing successful ones
    while (queueRef.current.length > 0) {
      const item = queueRef.current[0];
      try {
        await item.action();
        queueRef.current = queueRef.current.slice(1);
        await persistQueueMeta(queueRef.current);
        setState({ pending: queueRef.current.length, isProcessing: true });
      } catch (err) {
        console.warn(`[useOfflineQueue] Failed to process "${item.label}":`, err);
        // Stop processing on failure; will retry when connection is restored again
        break;
      }
    }

    setState({ pending: queueRef.current.length, isProcessing: false });
  }, [state.isProcessing, persistQueueMeta]);

  // ── Auto-retry when coming back online ────────────────────────────────────
  useEffect(() => {
    if (isConnected && queueRef.current.length > 0) {
      processQueue();
    }
  }, [isConnected, processQueue]);

  // ── Public API ────────────────────────────────────────────────────────────
  const enqueue = useCallback(
    (item: Omit<QueuedAction, 'id' | 'timestamp'>) => {
      const entry: QueuedAction = {
        ...item,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: Date.now(),
      };
      queueRef.current = [...queueRef.current, entry];
      persistQueueMeta(queueRef.current);
      setState((s) => ({ ...s, pending: queueRef.current.length }));

      // If we're already online, process immediately
      if (isConnected) {
        processQueue();
      }
    },
    [isConnected, persistQueueMeta, processQueue]
  );

  const clearQueue = useCallback(async () => {
    queueRef.current = [];
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
    setState({ pending: 0, isProcessing: false });
  }, []);

  return { enqueue, clearQueue, state };
}
