import { useCallback, useState } from 'react';

/**
 * NI-16: useErrorHandler
 *
 * Bridges async errors (API calls, promises, event handlers) into the React
 * error boundary system.  React's built-in ErrorBoundary only catches
 * synchronous render errors; this hook lets you promote async errors so they
 * surface in the nearest boundary with the same fallback UI.
 *
 * Usage:
 *   const { handleError } = useErrorHandler();
 *
 *   async function loadData() {
 *     try {
 *       const data = await fetchSomething();
 *       setData(data);
 *     } catch (err) {
 *       handleError(err);
 *     }
 *   }
 */
export function useErrorHandler() {
  const [, setError] = useState<Error | null>(null);

  const handleError = useCallback((err: unknown) => {
    const error = err instanceof Error ? err : new Error(String(err));
    // Throwing inside a setState callback causes React to route the error
    // through the nearest ErrorBoundary.
    setError(() => {
      throw error;
    });
  }, []);

  return { handleError };
}
