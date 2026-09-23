'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ApiResponse, RequestOptions } from '@/types/api';
import type { PredictionRecord } from '@/types/prediction';

type Fetcher = (opts: RequestOptions) => Promise<ApiResponse<PredictionRecord[]>>;

type State = {
  loading: boolean;
  error: string | null;
  records: PredictionRecord[];
};

// Shared by usePredictionHistory (a student's own predictions) and
// useAdminPredictions (every prediction) — same loading/error/abort shape,
// the only real difference being which endpoint the caller passes in.
export function usePredictionList(fetcher: Fetcher, token: string | null) {
  const [state, setState] = useState<State>({ loading: true, error: null, records: [] });

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) {
        setState({ loading: false, error: 'Authentification requise.', records: [] });
        return;
      }
      setState((s) => ({ ...s, loading: true, error: null }));
      const response = await fetcher({ token, signal });
      if (signal?.aborted) return;
      if (!response.ok) {
        setState({ loading: false, error: response.error.detail, records: [] });
        return;
      }
      setState({ loading: false, error: null, records: response.data });
    },
    [token, fetcher],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return { ...state, refresh: () => load() };
}
