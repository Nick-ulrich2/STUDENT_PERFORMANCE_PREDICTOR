'use client';

import { useState } from 'react';
import { Check, Download } from 'lucide-react';
import { downloadCsv } from '@/lib/csv';
import { useToast } from '@/components/ui/Toast';
import { FEATURES, LEVELS_FR, SHORT_LABELS } from '@/lib/features';
import { formatNumber } from '@/lib/format';
import { modelLabel } from '@/lib/predictions';
import type { PredictionRecord, ResourceLevel } from '@/types/prediction';

type ExportButtonProps = {
  records: PredictionRecord[];
  emailOf: (userId: string) => string;
  ghost?: boolean;
};

export function ExportButton({ records, emailOf, ghost }: ExportButtonProps) {
  const toast = useToast();
  const [done, setDone] = useState(false);

  const exportCsv = () => {
    const rows = records.map((r) => ({
      Date: new Date(r.created_at).toLocaleString('fr-FR'),
      'E-mail': emailOf(r.user_id),
      Score: formatNumber(Number(r.predicted_score), 1),
      [FEATURES[0].label]: r.attendance,
      [FEATURES[1].label]: r.hours_studied,
      [FEATURES[2].label]: r.previous_scores,
      [FEATURES[3].label]: r.tutoring_sessions,
      [FEATURES[4].label]: LEVELS_FR[r.access_to_resources as ResourceLevel],
      [FEATURES[5].label]: LEVELS_FR[r.parental_involvement as ResourceLevel],
      'Sous seuil': (r.below_threshold ?? []).map((k) => SHORT_LABELS[k] ?? k).join(' / '),
      Modèle: modelLabel(r),
    }));
    if (rows.length === 0) {
      toast('Aucune prédiction à exporter.', { error: true });
      return;
    }
    downloadCsv('predictions-spp.csv', rows);
    toast('predictions-spp.csv téléchargé (accents et séparateurs « ; » corrects).');
    setDone(true);
    setTimeout(() => setDone(false), 2200);
  };

  return (
    <button type="button" className={`btn${ghost ? ' ghost' : ''}`} onClick={exportCsv}>
      {done ? <Check size={18} aria-hidden="true" /> : <Download size={18} aria-hidden="true" />}
      {done ? 'Fichier prêt' : 'Exporter en CSV'}
    </button>
  );
}
