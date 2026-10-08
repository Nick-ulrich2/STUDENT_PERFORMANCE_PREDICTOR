import { FEATURES } from '@/lib/features';
import { formatNumber } from '@/lib/format';
import type { AggregatedFeatures } from '@/types/activity';

export type PriorityAction = { title: string; text: string; cta: string; href: string };

const NEEDS_TRACKING: PriorityAction = {
  title: 'Complétez votre suivi.',
  text: 'Marquez votre présence et renseignez votre profil : SPP pourra alors calculer vos 6 variables sur 7 jours.',
  cta: 'Ouvrir le suivi',
  href: '/tracking',
};

// The single action the dashboard pushes: the measured variable furthest below
// its recommended threshold, relative to that threshold.
export function priorityAction(features: AggregatedFeatures | null): PriorityAction {
  if (!features) return NEEDS_TRACKING;

  const gaps = FEATURES.filter((f) => f.threshold !== undefined)
    .map((f) => ({ f, value: features[f.key] as number }))
    .filter(({ f, value }) => value < f.threshold!)
    .map(({ f, value }) => ({ f, value, gap: (f.threshold! - value) / f.threshold! }))
    .sort((a, b) => b.gap - a.gap);

  if (gaps.length === 0) {
    return {
      title: 'Tout est au vert. Gardez le rythme.',
      text: 'Vos quatre habitudes mesurées dépassent les seuils recommandés. Une nouvelle estimation confirmera la tendance.',
      cta: 'Nouvelle estimation',
      href: '/predict',
    };
  }

  const { f, value } = gaps[0];
  switch (f.key) {
    case 'Attendance':
      return {
        title: 'Soyez présent·e un jour de plus cette semaine.',
        text: `Votre assiduité est à ${formatNumber(value)} %, sous le seuil de ${f.threshold} %. C’est la variable qui pèse le plus dans votre estimation.`,
        cta: 'Marquer ma présence',
        href: '/tracking',
      };
    case 'Hours_Studied':
      return {
        title: `Ajoutez ${Math.ceil(f.threshold! - value)} h d’étude cette semaine.`,
        text: `Vous cumulez ${formatNumber(value, 1)} h sur 7 jours, sous le seuil de ${f.threshold} h. Deux séances de 45 min suffisent pour passer la barre.`,
        cta: 'Lancer un chrono',
        href: '/tracking',
      };
    case 'Previous_Scores':
      return {
        title: 'Reprenez un sujet de votre dernier examen.',
        text: `Votre note précédente (${formatNumber(value)}) est sous ${f.threshold}. Repérez les chapitres où vous perdez le plus de points.`,
        cta: 'Mettre à jour mon profil',
        href: '/tracking',
      };
    default:
      return {
        title: 'Réservez une séance de tutorat.',
        text: `Vous en avez ${formatNumber(value)} sur 7 jours, sous le seuil de ${f.threshold}. Une séance de plus et vous passez au vert.`,
        cta: 'Démarrer une séance',
        href: '/tracking',
      };
  }
}
