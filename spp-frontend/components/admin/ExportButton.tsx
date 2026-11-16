'use client';

import { useState } from 'react';
import { Check, Download } from 'lucide-react';
import { downloadCsv } from '@/lib/csv';
import { useToast } from '@/components/ui/Toast';
import { FEATURES, LEVELS_FR, SHORT_LABELS } from '@/lib/features';
import { formatNumber } from '@/lib/format';
import { modelLabel } from '@/lib/predictions';
import type { PredictionRecord, ResourceLevel } from '@/types/prediction';
import { useI18n } from '@/lib/i18n';
import { intlLocale } from '@/lib/i18n/core';

type ExportButtonProps = {
  records: PredictionRecord[];
  emailOf: (userId: string) => string;
  ghost?: boolean;
};

export function ExportButton({ records, emailOf, ghost }: ExportButtonProps) {
  const toast = useToast();
  const { t, locale } = useI18n();
  const [done, setDone] = useState(false);

  const exportCsv = () => {
    const rows = records.map((r) => ({
      [t('Date')]: new Date(r.created_at).toLocaleString(intlLocale(locale)),
      [t('E-mail')]: emailOf(r.user_id),
      [t('Score')]: formatNumber(Number(r.predicted_score), 1, locale),
      [t(FEATURES[0].label)]: r.attendance,
      [t(FEATURES[1].label)]: r.hours_studied,
      [t(FEATURES[2].label)]: r.previous_scores,
      [t(FEATURES[3].label)]: r.tutoring_sessions,
      [t(FEATURES[4].label)]: t(LEVELS_FR[r.access_to_resources as ResourceLevel]),
      [t(FEATURES[5].label)]: t(LEVELS_FR[r.parental_involvement as ResourceLevel]),
      [t('Sous seuil')]: (r.below_threshold ?? []).map((k) => t(SHORT_LABELS[k] ?? k)).join(' / '),
      [t('Modèle')]: modelLabel(r),
    }));
    if (rows.length === 0) {
      toast(t('Aucune prédiction à exporter.'), { error: true });
      return;
    }
    downloadCsv('predictions-spp.csv', rows);
    toast(t('predictions-spp.csv téléchargé (accents et séparateurs « ; » corrects).'));
    setDone(true);
    setTimeout(() => setDone(false), 2200);
  };

  return (
    <button type="button" className={`btn${ghost ? ' ghost' : ''}`} onClick={exportCsv}>
      {done ? <Check size={18} aria-hidden="true" /> : <Download size={18} aria-hidden="true" />}
      {done ? t('Fichier prêt') : t('Exporter en CSV')}
    </button>
  );
}
