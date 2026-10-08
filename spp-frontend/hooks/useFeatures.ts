'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { AggregatedFeatures } from '@/types/activity';

const DEFAULT_WINDOW_DAYS = 7;

type FeaturesState = {
  loading: boolean;
  error: string | null;
  errorStatus: number | null;
  features: AggregatedFeatures | null;
};

export function useFeatures(token: string | null, windowDays: number = DEFAULT_WINDOW_DAYS) {
  const [state, setState] = useState<FeaturesState>({
    loading: true,
    error: null,
    errorStatus: null,
    features: null,
  });

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) {
        setState({ loading: false, error: 'Authentification requise.', errorStatus: 401, features: null });
        return;
      }
      setState((s) => ({ ...s, loading: true, error: null, errorStatus: null }));
      const response = await api.getMyFeatures(windowDays, { token, signal });
      if (signal?.aborted) return;
      if (!response.ok) {
        setState({
          loading: false,
          error: response.error.detail,
          errorStatus: response.error.status ?? null,
          features: null,
        });
        return;
      }
      setState({ loading: false, error: null, errorStatus: null, features: response.data });
    },
    [token, windowDays],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return { ...state, refresh: () => load() };
}
