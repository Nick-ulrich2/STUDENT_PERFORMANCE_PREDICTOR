'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { PredictionRecord } from '@/types/prediction';

type ListState = {
  loading: boolean;
  error: string | null;
  records: PredictionRecord[];
};

export function useAdminPredictions(token: string | null) {
  const [state, setState] = useState<ListState>({
    loading: true,
    error: null,
    records: [],
  });

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) {
        setState({ loading: false, error: 'Authentification requise.', records: [] });
        return;
      }
      setState((s) => ({ ...s, loading: true, error: null }));
      const response = await api.getAllPredictions({ token, signal });
      if (signal?.aborted) return;
      if (!response.ok) {
        setState({ loading: false, error: response.error.detail, records: [] });
        return;
      }
      setState({ loading: false, error: null, records: response.data });
    },
    [token],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return { ...state, refresh: () => load() };
}
