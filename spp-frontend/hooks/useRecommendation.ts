'use client';

import { useCallback, useState } from 'react';
import { api } from '@/lib/api';
import type { RecommendationRequest } from '@/types/prediction';

type State = {
  loading: boolean;
  error: string | null;
  recommendation: string | null;
};

const initial: State = { loading: false, error: null, recommendation: null };

export function useRecommendation(token: string | null) {
  const [state, setState] = useState<State>(initial);

  const fetchRecommendation = useCallback(
    async (payload: RecommendationRequest) => {
      setState({ loading: true, error: null, recommendation: null });
      const response = await api.getRecommendation(payload, { token });
      if (!response.ok) {
        setState({ loading: false, error: response.error.detail, recommendation: null });
        return;
      }
      setState({ loading: false, error: null, recommendation: response.data.recommendation });
    },
    [token],
  );

  return { ...state, fetchRecommendation };
}
