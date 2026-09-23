'use client';

import { Calendar, Inbox, RefreshCw, User } from 'lucide-react';
import type { PredictionRecord } from '@/types/prediction';
import { ScoreBadge } from '@/components/ui/ScoreBadge';

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

function SkeletonRow() {
  return (
    <div className="card flex items-center justify-between gap-4">
      <div className="flex flex-1 items-center gap-4">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-4 w-24" />
      </div>
      <div className="skeleton h-7 w-16 rounded-full" />
    </div>
  );
}

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
      <div className="grid gap-3">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
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
    return (
      <div className="card flex flex-col items-center gap-2 py-10 text-center">
        <Inbox size={28} strokeWidth={1.5} className="text-ink/30" aria-hidden="true" />
        <p className="text-sm text-ink/60">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {onRefresh && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-bold text-navy hover:border-navy"
          >
            <RefreshCw size={13} strokeWidth={2.5} aria-hidden="true" />
            Actualiser
          </button>
        </div>
      )}
      {records.map((record) => (
        <div
          key={record.id}
          className="card card-hover flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex flex-wrap items-center gap-4 text-sm text-ink/70">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} strokeWidth={2} className="text-ink/40" aria-hidden="true" />
              {formatDate(record.created_at)}
            </span>
            {showUser && (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                <User size={14} strokeWidth={2} className="text-ink/40" aria-hidden="true" />
                {record.user_id}
              </span>
            )}
          </div>
          <ScoreBadge score={Number(record.predicted_score)} />
        </div>
      ))}
    </div>
  );
}
