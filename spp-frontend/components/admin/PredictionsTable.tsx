'use client';

import { BelowChips, TierPill } from '@/components/ui/Pill';
import { formatNumber, formatTime, relativeDay } from '@/lib/format';
import { modelLabel } from '@/lib/predictions';
import { TONE_VARS, scoreTone } from '@/lib/scoreTone';
import type { PredictionRecord } from '@/types/prediction';
import { useI18n } from '@/lib/i18n';

type PredictionsTableProps = {
  records: PredictionRecord[];
  emailOf: (userId: string) => string;
  emptyText: string;
};

export function PredictionsTable({ records, emailOf, emptyText }: PredictionsTableProps) {
  const { t, locale } = useI18n();
  return (
    <div className="tbl-wrap">
      <table className="tbl cards">
        <thead>
          <tr>
            <th>{t('Date')}</th>
            <th>{t('Étudiant')}</th>
            <th>{t('Score')}</th>
            <th>{t('Sous seuil')}</th>
            <th>{t('Modèle')}</th>
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
                <td data-l={t('Date')}>
                  <span>
                    {relativeDay(r.created_at, locale)} <span className="muted tiny">{formatTime(r.created_at, locale)}</span>
                  </span>
                </td>
                <td data-l={t('Étudiant')} className="em">
                  {emailOf(r.user_id)}
                </td>
                <td data-l={t('Score')}>
                  <span>
                    <span className="sc" style={{ color: TONE_VARS[scoreTone(score).tone] }}>
                      {formatNumber(score, 1, locale)}
                    </span>{' '}
                    <TierPill score={score} />
                  </span>
                </td>
                <td data-l={t('Sous seuil')}>
                  <span>
                    <BelowChips keys={r.below_threshold} />
                  </span>
                </td>
                <td data-l={t('Modèle')} className="mono tiny">
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
