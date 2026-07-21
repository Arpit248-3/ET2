/**
 * useApi — Generic async data-fetching hook.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi(fetchState);
 *   const { data, execute } = useApi(optimizeProcurement, { manual: true });
 *
 * Options:
 *   manual    — if true, does NOT auto-fetch on mount; call execute() manually
 *   onSuccess — callback fired with data when fetch succeeds
 *   onError   — callback fired with error when fetch fails
 *   fallback  — value returned as `data` when backend is unreachable
 *   deps      — additional dependency array items that re-trigger auto-fetch
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export default function useApi(
  apiFn,
  {
    manual = false,
    onSuccess,
    onError,
    fallback = null,
    deps = [],
    args = [],       // initial args for auto-fetch (spread into apiFn)
  } = {}
) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(!manual);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(
    async (...callArgs) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFn(...(callArgs.length ? callArgs : args));
        if (mountedRef.current) {
          setData(result);
          setLoading(false);
          onSuccess?.(result);
        }
        return result;
      } catch (err) {
        if (mountedRef.current) {
          setError(err);
          setLoading(false);
          if (fallback !== null) setData(fallback);
          onError?.(err);
        }
        throw err;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiFn, ...deps]
  );

  useEffect(() => {
    if (!manual) {
      execute(...args).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manual, execute]);

  return { data, loading, error, refetch: execute, execute };
}
