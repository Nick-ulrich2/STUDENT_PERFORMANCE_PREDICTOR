import type { PredictionOutput, StudentInput } from '@/types/prediction';

const KEY = 'spp:lastPrediction';

export type LastPrediction = { output: PredictionOutput; vars: StudentInput; at: number };

export function saveLastPrediction(value: LastPrediction): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode, quota): the result page shows its empty state
  }
}

export function loadLastPrediction(): LastPrediction | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LastPrediction) : null;
  } catch {
    return null;
  }
}
