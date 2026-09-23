'use client';

import { api } from '@/lib/api';
import { usePredictionList } from '@/hooks/usePredictionList';

export function usePredictionHistory(token: string | null) {
  return usePredictionList(api.getMyPredictions, token);
}
