'use client';

import { useCallback, useState } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import type { RecommendationRequest } from '@/types/prediction';

type State = {
  loading: boolean;
  error: string | null;
  recommendation: string | null;
};

const initial: State = { loading: false, error: null, recommendation: null };

export function useRecommendation(token: string | null) {
  const [state, setState] = useState<State>(initial);
  const { locale } = useI18n();

  const fetchRecommendation = useCallback(
    async (payload: RecommendationRequest) => {
      setState({ loading: true, error: null, recommendation: null });
      const response = await api.getRecommendation(payload, { token }, locale);
      if (!response.ok) {
        setState({ loading: false, error: response.error.detail, recommendation: null });
        return;
      }
      setState({ loading: false, error: null, recommendation: response.data.recommendation });
    },
    [token, locale],
  );

  return { ...state, fetchRecommendation };
}
