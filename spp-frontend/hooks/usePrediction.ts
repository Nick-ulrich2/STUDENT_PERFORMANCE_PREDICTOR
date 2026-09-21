'use client';

import { useCallback, useState } from 'react';
import { api } from '@/lib/api';
import type { PredictionOutput, StudentInput } from '@/types/prediction';

type SubmitState = {
  loading: boolean;
  error: string | null;
  result: PredictionOutput | null;
};

const initial: SubmitState = { loading: false, error: null, result: null };

export function usePrediction(token: string | null) {
  const [state, setState] = useState<SubmitState>(initial);

  const submit = useCallback(
    async (input: StudentInput) => {
      setState({ loading: true, error: null, result: null });
      const response = await api.predict(input, { token });
      if (!response.ok) {
        setState({ loading: false, error: response.error.detail, result: null });
        return null;
      }
      setState({ loading: false, error: null, result: response.data });
      return response.data;
    },
    [token],
  );

  const reset = useCallback(() => setState(initial), []);

  return { ...state, submit, reset };
}
