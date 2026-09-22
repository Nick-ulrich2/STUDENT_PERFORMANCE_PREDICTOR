'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { AggregatedFeatures } from '@/types/activity';
import type { PredictionOutput } from '@/types/prediction';

const DEFAULT_WINDOW_DAYS = 7;

type FeaturesState = {
  loading: boolean;
  error: string | null;
  features: AggregatedFeatures | null;
};

export function useFeatures(token: string | null, windowDays: number = DEFAULT_WINDOW_DAYS) {
  const [state, setState] = useState<FeaturesState>({
    loading: true,
    error: null,
    features: null,
  });

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) {
        setState({ loading: false, error: 'Authentification requise.', features: null });
        return;
      }
      setState((s) => ({ ...s, loading: true, error: null }));
      const response = await api.getMyFeatures(windowDays, { token, signal });
      if (signal?.aborted) return;
      if (!response.ok) {
        setState({ loading: false, error: response.error.detail, features: null });
        return;
      }
      setState({ loading: false, error: null, features: response.data });
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

type PredictState = {
  loading: boolean;
  error: string | null;
  result: PredictionOutput | null;
};

const initialPredict: PredictState = { loading: false, error: null, result: null };

export function usePredictFromActivity(token: string | null, windowDays: number = DEFAULT_WINDOW_DAYS) {
  const [state, setState] = useState<PredictState>(initialPredict);

  const submit = useCallback(async () => {
    setState({ loading: true, error: null, result: null });
    const response = await api.predictFromActivity(windowDays, { token });
    if (!response.ok) {
      setState({ loading: false, error: response.error.detail, result: null });
      return null;
    }
    setState({ loading: false, error: null, result: response.data });
    return response.data;
  }, [token, windowDays]);

  return { ...state, submit };
}
