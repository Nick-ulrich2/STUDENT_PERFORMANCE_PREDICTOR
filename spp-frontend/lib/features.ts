import {
  BookOpen,
  Box,
  Check,
  House,
  Star,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { ResourceLevel, StudentInput } from '@/types/prediction';

export type FeatureKey = keyof StudentInput;

export type FeatureDef = {
  key: FeatureKey;
  label: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  threshold?: number;
  icon: LucideIcon;
  hint: string;
  categorical?: boolean;
};

// Bounds mirror app/schemas.py::StudentInput, thresholds mirror
// app/main.py::THRESHOLDS: the form rejects exactly what the API would.
export const FEATURES: FeatureDef[] = [
  { key: 'Attendance', label: 'Assiduité', unit: '%', min: 0, max: 100, step: 1, threshold: 70, icon: Check, hint: 'Part de jours présents' },
  { key: 'Hours_Studied', label: 'Heures d’étude', unit: 'h / sem.', min: 0, max: 45, step: 0.5, threshold: 10, icon: BookOpen, hint: 'Cumul sur 7 jours' },
  { key: 'Previous_Scores', label: 'Note précédente', unit: '/100', min: 0, max: 100, step: 1, threshold: 60, icon: Star, hint: 'Votre dernier examen' },
  { key: 'Tutoring_Sessions', label: 'Séances de tutorat', unit: '/ sem.', min: 0, max: 8, step: 1, threshold: 2, icon: Users, hint: 'Entier de 0 à 8' },
  { key: 'Access_to_Resources', label: 'Accès aux ressources', icon: Box, hint: 'Livres, internet, matériel', categorical: true },
  { key: 'Parental_Involvement', label: 'Implication parentale', icon: House, hint: 'Soutien de la famille', categorical: true },
];

export const FEATURE_BY_KEY = Object.fromEntries(FEATURES.map((f) => [f.key, f])) as Record<FeatureKey, FeatureDef>;

export const LEVELS: ResourceLevel[] = ['Low', 'Medium', 'High'];
export const LEVELS_FR: Record<ResourceLevel, string> = { Low: 'Faible', Medium: 'Moyen', High: 'Élevé' };

export const SHORT_LABELS: Record<string, string> = {
  Attendance: 'Assiduité',
  Hours_Studied: 'Heures',
  Previous_Scores: 'Note préc.',
  Tutoring_Sessions: 'Tutorat',
};

export function labelOf(key: string): string {
  return FEATURE_BY_KEY[key as FeatureKey]?.label ?? key;
}

export function isBelowThreshold(def: FeatureDef, value: number | undefined | null): boolean {
  return def.threshold !== undefined && value !== undefined && value !== null && value < def.threshold;
}
