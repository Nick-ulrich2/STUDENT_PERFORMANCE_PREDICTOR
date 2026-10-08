import type { PredictionRecord } from '@/types/prediction';

// The API returns predictions unordered; every screen wants most recent first.
export function newestFirst(records: PredictionRecord[]): PredictionRecord[] {
  return [...records].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function modelLabel(record: PredictionRecord): string {
  return `Ridge v${record.model_version_id}`;
}
