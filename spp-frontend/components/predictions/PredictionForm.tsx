'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrediction } from '@/hooks/usePrediction';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { ResourceLevel, StudentInput } from '@/types/prediction';

type FormState = {
  Attendance: string;
  Hours_Studied: string;
  Previous_Scores: string;
  Tutoring_Sessions: string;
  Access_to_Resources: ResourceLevel;
  Parental_Involvement: ResourceLevel;
};

const initial: FormState = {
  Attendance: '85',
  Hours_Studied: '20',
  Previous_Scores: '70',
  Tutoring_Sessions: '1',
  Access_to_Resources: 'Medium',
  Parental_Involvement: 'Medium',
};

const LEVELS: ResourceLevel[] = ['Low', 'Medium', 'High'];

function parseInput(state: FormState): StudentInput | { error: string } {
  const numbers = {
    Attendance: Number(state.Attendance),
    Hours_Studied: Number(state.Hours_Studied),
    Previous_Scores: Number(state.Previous_Scores),
    Tutoring_Sessions: Number(state.Tutoring_Sessions),
  };
  for (const [key, value] of Object.entries(numbers)) {
    if (Number.isNaN(value)) return { error: `Valeur numérique invalide: ${key}` };
  }
  if (numbers.Attendance < 0 || numbers.Attendance > 100)
    return { error: 'Assiduité doit être entre 0 et 100.' };
  if (numbers.Hours_Studied < 0 || numbers.Hours_Studied > 45)
    return { error: 'Heures d’étude doivent être entre 0 et 45.' };
  if (numbers.Previous_Scores < 0 || numbers.Previous_Scores > 100)
    return { error: 'Score précédent doit être entre 0 et 100.' };
  if (numbers.Tutoring_Sessions < 0 || numbers.Tutoring_Sessions > 8)
    return { error: 'Séances de tutorat doivent être entre 0 et 8.' };
  return {
    Attendance: numbers.Attendance,
    Hours_Studied: numbers.Hours_Studied,
    Previous_Scores: numbers.Previous_Scores,
    Tutoring_Sessions: numbers.Tutoring_Sessions,
    Access_to_Resources: state.Access_to_Resources,
    Parental_Involvement: state.Parental_Involvement,
  };
}

type Props = { token: string | null };

export function PredictionForm({ token }: Props) {
  const router = useRouter();
  const { submit, loading, error } = usePrediction(token);
  const [form, setForm] = useState<FormState>(initial);

  const handleChange = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value as string }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = parseInput(form);
    if ('error' in parsed) return;
    const result = await submit(parsed);
    if (result) {
      try {
        sessionStorage.setItem('spp:lastPrediction', JSON.stringify(result));
      } catch {
        // ignore storage errors (private mode, quota)
      }
      router.push('/predict/result');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card grid gap-5 md:grid-cols-2">
      <div className="md:col-span-2">
        <h3 className="font-display text-2xl text-navy">Vos habitudes d’apprentissage</h3>
        <p className="mt-1 text-sm text-ink/60">
          Tous les champs sont obligatoires. Les valeurs sont validées par le modèle.
        </p>
      </div>

      <div>
        <label className="form-label" htmlFor="Attendance">Assiduité (%)</label>
        <input id="Attendance" type="number" min={0} max={100} step="0.1"
          className="form-input" value={form.Attendance} onChange={handleChange('Attendance')} required />
      </div>
      <div>
        <label className="form-label" htmlFor="Hours_Studied">Heures d’étude / semaine</label>
        <input id="Hours_Studied" type="number" min={0} max={45} step="0.1"
          className="form-input" value={form.Hours_Studied} onChange={handleChange('Hours_Studied')} required />
      </div>
      <div>
        <label className="form-label" htmlFor="Previous_Scores">Score précédent</label>
        <input id="Previous_Scores" type="number" min={0} max={100} step="0.1"
          className="form-input" value={form.Previous_Scores} onChange={handleChange('Previous_Scores')} required />
      </div>
      <div>
        <label className="form-label" htmlFor="Tutoring_Sessions">Séances de tutorat</label>
        <input id="Tutoring_Sessions" type="number" min={0} max={8} step="1"
          className="form-input" value={form.Tutoring_Sessions} onChange={handleChange('Tutoring_Sessions')} required />
      </div>
      <div>
        <label className="form-label" htmlFor="Access_to_Resources">Accès aux ressources</label>
        <select id="Access_to_Resources" className="form-input"
          value={form.Access_to_Resources} onChange={handleChange('Access_to_Resources')}>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <div>
        <label className="form-label" htmlFor="Parental_Involvement">Implication parentale</label>
        <select id="Parental_Involvement" className="form-input"
          value={form.Parental_Involvement} onChange={handleChange('Parental_Involvement')}>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {error && <div className="alert alert-error md:col-span-2" role="alert">{error}</div>}

      <div className="md:col-span-2 flex flex-col items-start gap-3">
        <Button type="submit" disabled={loading} fullWidth>
          {loading ? <Spinner label="Prédiction en cours…" /> : 'Lancer la prédiction'}
        </Button>
        <p className="text-xs text-ink/50">
          Vos données sont envoyées à l’API FastAPI avec un jeton d’authentification.
        </p>
      </div>
    </form>
  );
}
