'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Seg } from '@/components/ui/Seg';
import { FEATURE_BY_KEY, LEVELS, LEVELS_FR } from '@/lib/features';
import type { ProfileAttributesInput, ProfileAttributesResponse } from '@/types/activity';
import type { ResourceLevel } from '@/types/prediction';

type ProfileFormProps = {
  attributes: ProfileAttributesResponse;
  saving: boolean;
  onSave: (payload: ProfileAttributesInput) => Promise<boolean>;
};

export function ProfileForm({ attributes, saving, onSave }: ProfileFormProps) {
  const [score, setScore] = useState(attributes.previous_scores?.toString() ?? '');
  const [resources, setResources] = useState<ResourceLevel | null>(attributes.access_to_resources);
  const [involvement, setInvolvement] = useState<ResourceLevel | null>(attributes.parental_involvement);
  const [errors, setErrors] = useState<{ score?: string; levels?: string }>({});

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(score);
    const next: typeof errors = {};
    if (score.trim() === '' || Number.isNaN(value) || value < 0 || value > 100) {
      next.score = 'La note doit être comprise entre 0 et 100.';
    }
    if (!resources || !involvement) next.levels = 'Choisissez un niveau pour chaque ligne.';
    setErrors(next);
    if (next.score || next.levels) return;
    await onSave({ Previous_Scores: value, Access_to_Resources: resources!, Parental_Involvement: involvement! });
  };

  const options = LEVELS.map((l) => ({ value: l, label: LEVELS_FR[l] }));

  return (
    <form className="grid g3" style={{ ['--g' as string]: '1.4rem', alignItems: 'start' }} noValidate onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="previous-score">
          Note précédente <span className="hint">0 à 100</span>
        </label>
        <input
          id="previous-score"
          className={`inp${errors.score ? ' err' : ''}`}
          type="number"
          min={0}
          max={100}
          value={score}
          aria-invalid={Boolean(errors.score)}
          onChange={(e) => setScore(e.target.value)}
        />
        <div className="err-msg" aria-live="polite">
          {errors.score && (
            <>
              <AlertTriangle size={14} aria-hidden="true" /> {errors.score}
            </>
          )}
        </div>
      </div>
      <div className="field">
        <span className="lbl">{FEATURE_BY_KEY.Access_to_Resources.label}</span>
        <Seg value={resources} options={options} onChange={setResources} label={FEATURE_BY_KEY.Access_to_Resources.label} />
        <span className="hint tiny muted">{FEATURE_BY_KEY.Access_to_Resources.hint}</span>
      </div>
      <div className="field">
        <span className="lbl">{FEATURE_BY_KEY.Parental_Involvement.label}</span>
        <Seg value={involvement} options={options} onChange={setInvolvement} label={FEATURE_BY_KEY.Parental_Involvement.label} />
        <span className="hint tiny muted">{FEATURE_BY_KEY.Parental_Involvement.hint}</span>
      </div>
      {errors.levels && (
        <div className="err-msg" style={{ gridColumn: '1/-1' }} aria-live="polite">
          <AlertTriangle size={14} aria-hidden="true" /> {errors.levels}
        </div>
      )}
      <div style={{ gridColumn: '1/-1' }}>
        <button className="btn" type="submit" disabled={saving}>
          {saving ? (
            <>
              <span className="spin" /> Enregistrement…
            </>
          ) : (
            'Enregistrer le profil'
          )}
        </button>
      </div>
    </form>
  );
}
