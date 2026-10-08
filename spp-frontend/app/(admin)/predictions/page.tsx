'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { ExportButton } from '@/components/admin/ExportButton';
import { PredictionsTable } from '@/components/admin/PredictionsTable';
import { useEmailLookup } from '@/components/admin/useEmailLookup';
import { Banner } from '@/components/ui/Banner';
import { Highlight } from '@/components/ui/Reveal';
import { useAdminPredictions, useAdminUsers } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { newestFirst } from '@/lib/predictions';

export default function AdminPredictionsPage() {
  const { token } = useAuth();
  const predictions = useAdminPredictions(token);
  const users = useAdminUsers(token);
  const emailOf = useEmailLookup(users.users);
  const [query, setQuery] = useState('');

  const all = useMemo(() => newestFirst(predictions.records), [predictions.records]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? all.filter((r) => emailOf(r.user_id).toLowerCase().includes(q)) : all;
  }, [all, query, emailOf]);

  const loading = predictions.loading || users.loading;
  const error = predictions.error ?? users.error;

  return (
    <div className="page">
      <div className="wrap">
        <div className="page-h">
          <div>
            <span className="eyebrow">Prédictions</span>
            <h1 className="display" style={{ marginTop: '.7rem' }}>
              Toutes les <Highlight>prédictions</Highlight>.
            </h1>
          </div>
          <ExportButton records={shown} emailOf={emailOf} />
        </div>

        {error && (
          <Banner tone="risk" title="Données indisponibles" className="err-banner-inline">
            {error}
          </Banner>
        )}

        <article className="card">
          <div className="row" style={{ marginBottom: '1rem', justifyContent: 'space-between' }}>
            <div className="search">
              <span aria-hidden="true">
                <Search size={18} />
              </span>
              <input
                className="inp"
                type="search"
                placeholder="Filtrer par e-mail"
                aria-label="Filtrer par e-mail"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <span className="tiny muted">
              {loading ? 'Chargement…' : query ? `${shown.length} prédictions affichées` : `${all.length} prédictions · du plus récent au plus ancien`}
            </span>
          </div>
          {loading ? (
            <p className="muted">Chargement…</p>
          ) : (
            <PredictionsTable records={shown} emailOf={emailOf} emptyText="Aucune prédiction pour cet e-mail." />
          )}
          <p className="tiny muted" style={{ marginTop: '1rem' }}>
            Pagination prévue en version 1.1 : cette vue charge pour l’instant toutes les lignes.
          </p>
        </article>
      </div>
    </div>
  );
}
