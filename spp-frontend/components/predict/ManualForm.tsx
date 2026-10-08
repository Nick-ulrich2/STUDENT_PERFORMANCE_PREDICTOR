'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Seg } from '@/components/ui/Seg';
import { ThresholdList } from '@/components/predict/ThresholdList';
import { FEATURES, LEVELS, LEVELS_FR } from '@/lib/features';
import type { ResourceLevel, StudentInput } from '@/types/prediction';

type NumericKey = 'Attendance' | 'Hours_Studied' | 'Previous_Scores' | 'Tutoring_Sessions';
const NUMERIC = FEATURES.filter((f) => !f.categorical);

type ManualFormProps = {
  initial: StudentInput;
  busy: boolean;
  onSubmit: (input: StudentInput) => void;
};

export function ManualForm({ initial, busy, onSubmit }: ManualFormProps) {
  const [numbers, setNumbers] = useState<Record<NumericKey, string>>({
    Attendance: String(initial.Attendance),
    Hours_Studied: String(initial.Hours_Studied),
    Previous_Scores: String(initial.Previous_Scores),
    Tutoring_Sessions: String(initial.Tutoring_Sessions),
  });
  const [resources, setResources] = useState<ResourceLevel>(initial.Access_to_Resources);
  const [involvement, setInvolvement] = useState<ResourceLevel>(initial.Parental_Involvement);

  const errors = useMemo(() => {
    const out: Partial<Record<NumericKey, string>> = {};
    for (const f of NUMERIC) {
      const raw = numbers[f.key as NumericKey];
      const value = Number(raw);
      const integer = f.key === 'Tutoring_Sessions';
      if (raw.trim() === '' || Number.isNaN(value) || value < f.min! || value > f.max! || (integer && !Number.isInteger(value))) {
        out[f.key as NumericKey] = `${f.label} : entre ${f.min} et ${f.max}${integer ? ' (entier)' : ''}.`;
      }
    }
    return out;
  }, [numbers]);

  const live = Object.fromEntries(NUMERIC.map((f) => [f.key, numbers[f.key as NumericKey] === '' ? null : Number(numbers[f.key as NumericKey])]));
  const options = LEVELS.map((l) => ({ value: l, label: LEVELS_FR[l] }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0) return;
    onSubmit({
      Attendance: Number(numbers.Attendance),
      Hours_Studied: Number(numbers.Hours_Studied),
      Previous_Scores: Number(numbers.Previous_Scores),
      Tutoring_Sessions: Number(numbers.Tutoring_Sessions),
      Access_to_Resources: resources,
      Parental_Involvement: involvement,
    });
  };

  return (
    <form className="pform" noValidate onSubmit={submit}>
      <div className="card">
        <div className="card-h">
          <div>
            <h3 className="display">Vos 6 variables</h3>
            <p>Chaque champ est borné. Les valeurs inconnues sont refusées.</p>
          </div>
        </div>
        {FEATURES.map((f) => {
          const Icon = f.icon;
          if (f.categorical) {
            const value = f.key === 'Access_to_Resources' ? resources : involvement;
            const set = f.key === 'Access_to_Resources' ? setResources : setInvolvement;
            return (
              <div className="pfield" key={f.key}>
                <div className="top2">
                  <div className="nm">
                    <Icon size={22} strokeWidth={1.8} aria-hidden="true" /> {f.label}
                  </div>
                  <small className="muted tiny">{f.hint}</small>
                </div>
                <Seg value={value} options={options} onChange={set} label={f.label} />
              </div>
            );
          }
          const key = f.key as NumericKey;
          const raw = numbers[key];
          const pct = raw === '' ? 0 : Math.min(100, Math.max(0, ((Number(raw) - f.min!) / (f.max! - f.min!)) * 100));
          return (
            <div className="pfield" key={f.key}>
              <div className="top2">
                <div className="nm">
                  <Icon size={22} strokeWidth={1.8} aria-hidden="true" /> {f.label}{' '}
                  <small>
                    {f.min}–{f.max} {f.unit}
                  </small>
                </div>
                <input
                  className={`inp numin${errors[key] ? ' err' : ''}`}
                  type="number"
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={raw}
                  aria-label={f.label}
                  aria-invalid={Boolean(errors[key])}
                  onChange={(e) => setNumbers((n) => ({ ...n, [key]: e.target.value }))}
                />
              </div>
              <input
                className="range"
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                value={raw === '' ? f.min : Number(raw)}
                style={{ '--p': `${pct}%` } as CSSProperties}
                aria-label={`${f.label} (curseur)`}
                onChange={(e) => setNumbers((n) => ({ ...n, [key]: e.target.value }))}
              />
              <div className="err-msg" aria-live="polite">
                {errors[key] && (
                  <>
                    <AlertTriangle size={14} aria-hidden="true" /> {errors[key]}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <aside className="sticky-side stack" style={{ ['--s' as string]: '1rem' }}>
        <div className="card">
          <h3 className="display" style={{ fontSize: '1.25rem' }}>
            Seuils recommandés
          </h3>
          <p className="muted tiny" style={{ marginBottom: '.6rem' }}>
            Mis à jour en direct pendant votre saisie.
          </p>
          <ThresholdList values={live} />
        </div>
        <button className="btn block lg" type="submit" disabled={busy}>
          Obtenir mon estimation <span className="ar" aria-hidden="true">→</span>
        </button>
        <p className="tiny muted" style={{ textAlign: 'center' }}>
          Estimation indicative, sans valeur officielle.
        </p>
      </aside>
    </form>
  );
}
