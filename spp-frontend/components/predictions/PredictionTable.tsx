'use client';

import type { PredictionRecord } from '@/types/prediction';
import { Spinner } from '@/components/ui/Spinner';

type Column = {
  key: keyof PredictionRecord | 'actions';
  label: string;
};

const COLUMNS: Column[] = [
  { key: 'created_at', label: 'Date' },
  { key: 'user_id', label: 'Utilisateur' },
  { key: 'predicted_score', label: 'Score prédit' },
  { key: 'actions', label: '' },
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

type Props = {
  records: PredictionRecord[];
  loading: boolean;
  error: string | null;
  emptyMessage?: string;
  showUser?: boolean;
  onRefresh?: () => void;
};

export function PredictionTable({
  records,
  loading,
  error,
  emptyMessage = 'Aucune prédiction à afficher.',
  showUser = true,
  onRefresh,
}: Props) {
  if (loading) {
    return (
      <div className="card flex items-center gap-3">
        <Spinner label="Chargement…" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="alert alert-error" role="alert">
        {error}
      </div>
    );
  }
  if (records.length === 0) {
    return <div className="card text-sm text-ink/60">{emptyMessage}</div>;
  }
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-ink/60">
            {COLUMNS.filter((c) => (c.key === 'user_id' ? showUser : true)).map((c) => (
              <th key={c.key} className="py-2 pr-4 font-semibold">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-b border-line/60 last:border-0">
              <td className="py-3 pr-4">{formatDate(record.created_at)}</td>
              {showUser && <td className="py-3 pr-4 font-mono text-xs">{record.user_id}</td>}
              <td className="py-3 pr-4 font-bold text-navy">
                {Number(record.predicted_score).toFixed(1)}
              </td>
              <td className="py-3 pr-4 text-right">
                {onRefresh && (
                  <button
                    type="button"
                    onClick={onRefresh}
                    className="rounded-full border border-line px-3 py-1 text-xs font-bold text-navy hover:border-navy"
                  >
                    Actualiser
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
