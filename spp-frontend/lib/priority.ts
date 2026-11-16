import { FEATURES } from '@/lib/features';
import { formatNumber } from '@/lib/format';
import type { AggregatedFeatures } from '@/types/activity';
import type { Locale } from '@/lib/i18n/core';
import type { TFunction } from '@/lib/i18n';

export type PriorityAction = { title: string; text: string; cta: string; href: string };


// The single action the dashboard pushes: the measured variable furthest below
// its recommended threshold, relative to that threshold.
export function priorityAction(features: AggregatedFeatures | null, t: TFunction, locale: Locale): PriorityAction {
  const n = (v: number, d = 0) => formatNumber(v, d, locale);
  if (!features) {
    return {
      title: t('Complétez votre suivi.'),
      text: t('Marquez votre présence et renseignez votre profil : SPP pourra alors calculer vos 6 variables sur 7 jours.'),
      cta: t('Ouvrir le suivi'),
      href: '/tracking',
    };
  }

  const gaps = FEATURES.filter((f) => f.threshold !== undefined)
    .map((f) => ({ f, value: features[f.key] as number }))
    .filter(({ f, value }) => value < f.threshold!)
    .map(({ f, value }) => ({ f, value, gap: (f.threshold! - value) / f.threshold! }))
    .sort((a, b) => b.gap - a.gap);

  if (gaps.length === 0) {
    return {
      title: t('Tout est au vert. Gardez le rythme.'),
      text: t('Vos quatre habitudes mesurées dépassent les seuils recommandés. Une nouvelle estimation confirmera la tendance.'),
      cta: t('Nouvelle estimation'),
      href: '/predict',
    };
  }

  const { f, value } = gaps[0];
  switch (f.key) {
    case 'Attendance':
      return {
        title: t('Soyez présent·e un jour de plus cette semaine.'),
        text: t('Votre assiduité est à {value} %, sous le seuil de {threshold} %. C’est la variable qui pèse le plus dans votre estimation.', { value: n(value), threshold: f.threshold! }),
        cta: t('Marquer ma présence'),
        href: '/tracking',
      };
    case 'Hours_Studied':
      return {
        title: t('Ajoutez {hours} h d’étude cette semaine.', { hours: Math.ceil(f.threshold! - value) }),
        text: t('Vous cumulez {value} h sur 7 jours, sous le seuil de {threshold} h. Deux séances de 45 min suffisent pour passer la barre.', { value: n(value, 1), threshold: f.threshold! }),
        cta: t('Lancer un chrono'),
        href: '/tracking',
      };
    case 'Previous_Scores':
      return {
        title: t('Reprenez un sujet de votre dernier examen.'),
        text: t('Votre note précédente ({value}) est sous {threshold}. Repérez les chapitres où vous perdez le plus de points.', { value: n(value), threshold: f.threshold! }),
        cta: t('Mettre à jour mon profil'),
        href: '/tracking',
      };
    default:
      return {
        title: t('Réservez une séance de tutorat.'),
        text: t('Vous en avez {value} sur 7 jours, sous le seuil de {threshold}. Une séance de plus et vous passez au vert.', { value: n(value), threshold: f.threshold! }),
        cta: t('Démarrer une séance'),
        href: '/tracking',
      };
  }
}
