'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, IdCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { ProfileAttributesResponse } from '@/types/activity';
import type { ResourceLevel } from '@/types/prediction';

const LEVELS: ResourceLevel[] = ['Low', 'Medium', 'High'];

type SavePayload = {
  Previous_Scores: number;
  Access_to_Resources: ResourceLevel;
  Parental_Involvement: ResourceLevel;
};

type Props = {
  attributes: ProfileAttributesResponse;
  saving: boolean;
  onSave: (payload: SavePayload) => void;
};

export function ProfileAttributesForm({ attributes, saving, onSave }: Props) {
  const [previousScores, setPreviousScores] = useState(
    attributes.previous_scores !== null ? String(attributes.previous_scores) : '',
  );
  const [accessToResources, setAccessToResources] = useState<ResourceLevel>(
    attributes.access_to_resources ?? 'Medium',
  );
  const [parentalInvolvement, setParentalInvolvement] = useState<ResourceLevel>(
    attributes.parental_involvement ?? 'Medium',
  );

  // Sync local form state whenever a fresh copy of the profile is loaded
  // (initial load, or after a save round-trip).
  useEffect(() => {
    setPreviousScores(attributes.previous_scores !== null ? String(attributes.previous_scores) : '');
    setAccessToResources(attributes.access_to_resources ?? 'Medium');
    setParentalInvolvement(attributes.parental_involvement ?? 'Medium');
  }, [attributes]);

  const complete =
    attributes.previous_scores !== null &&
    attributes.access_to_resources !== null &&
    attributes.parental_involvement !== null;

  const parsedScore = Number(previousScores);
  const scoreIsValid = previousScores.trim() !== '' && !Number.isNaN(parsedScore);

  return (
    <div className="card grid gap-4">
      <div>
        <div className="eyebrow flex items-center gap-2">
          <IdCard size={14} strokeWidth={2.5} aria-hidden="true" />
          Profil
          {complete && (
            <CheckCircle2 size={14} strokeWidth={2.5} className="text-teal" aria-hidden="true" />
          )}
        </div>
        <h3 className="mt-1 font-display text-2xl text-navy">Vos informations stables</h3>
        <p className="mt-1 text-sm text-ink/60">
          Ces informations changent rarement : ce ne sont pas des activités à démarrer/arrêter.
          {!complete && ' Elles sont requises avant de lancer une prédiction.'}
        </p>
      </div>
      <div>
        <label className="form-label" htmlFor="previous_scores">
          Score précédent
        </label>
        <input
          id="previous_scores"
          type="number"
          min={0}
          max={100}
          step="0.1"
          className="form-input"
          value={previousScores}
          onChange={(e) => setPreviousScores(e.target.value)}
        />
      </div>
      <div>
        <label className="form-label" htmlFor="access_to_resources">
          Accès aux ressources
        </label>
        <select
          id="access_to_resources"
          className="form-input"
          value={accessToResources}
          onChange={(e) => setAccessToResources(e.target.value as ResourceLevel)}
        >
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="form-label" htmlFor="parental_involvement">
          Implication parentale
        </label>
        <select
          id="parental_involvement"
          className="form-input"
          value={parentalInvolvement}
          onChange={(e) => setParentalInvolvement(e.target.value as ResourceLevel)}
        >
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <Button
        disabled={saving || !scoreIsValid}
        onClick={() =>
          onSave({
            Previous_Scores: parsedScore,
            Access_to_Resources: accessToResources,
            Parental_Involvement: parentalInvolvement,
          })
        }
      >
        {saving ? <Spinner label="Enregistrement…" /> : 'Enregistrer'}
      </Button>
    </div>
  );
}
