import { BelowChips, TierPill } from '@/components/ui/Pill';
import { formatNumber, formatTime, relativeDay } from '@/lib/format';
import { modelLabel } from '@/lib/predictions';
import { TONE_VARS, scoreTone } from '@/lib/scoreTone';
import type { PredictionRecord } from '@/types/prediction';

type PredictionsTableProps = {
  records: PredictionRecord[];
  emailOf: (userId: string) => string;
  emptyText: string;
};

export function PredictionsTable({ records, emailOf, emptyText }: PredictionsTableProps) {
  return (
    <div className="tbl-wrap">
      <table className="tbl cards">
        <thead>
          <tr>
            <th>Date</th>
            <th>Étudiant</th>
            <th>Score</th>
            <th>Sous seuil</th>
            <th>Modèle</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 && (
            <tr>
              <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
                {emptyText}
              </td>
            </tr>
          )}
          {records.map((r) => {
            const score = Number(r.predicted_score);
            return (
              <tr key={r.id}>
                <td data-l="Date">
                  {relativeDay(r.created_at)} <span className="muted tiny">{formatTime(r.created_at)}</span>
                </td>
                <td data-l="Étudiant" className="em">
                  {emailOf(r.user_id)}
                </td>
                <td data-l="Score">
                  <span className="sc" style={{ color: TONE_VARS[scoreTone(score).tone] }}>
                    {formatNumber(score, 1)}
                  </span>{' '}
                  <TierPill score={score} />
                </td>
                <td data-l="Sous seuil">
                  <BelowChips keys={r.below_threshold} />
                </td>
                <td data-l="Modèle" className="mono tiny">
                  {modelLabel(r)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
