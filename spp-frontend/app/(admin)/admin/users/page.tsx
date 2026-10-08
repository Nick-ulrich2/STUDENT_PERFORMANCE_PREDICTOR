'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Banner } from '@/components/ui/Banner';
import { Highlight } from '@/components/ui/Reveal';
import { useToast } from '@/components/ui/Toast';
import { useAdminUsers } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, relativeDay } from '@/lib/format';
import type { UserRole, UserSummary } from '@/types/auth';

type RowProps = {
  user: UserSummary;
  isSelf: boolean;
  confirming: boolean;
  busy: boolean;
  onAsk: () => void;
  onCancel: () => void;
  onConfirm: () => void;
};

function UserRow({ user, isSelf, confirming, busy, onAsk, onCancel, onConfirm }: RowProps) {
  const admin = user.role === 'admin';
  return (
    <tr>
      <td data-l="E-mail" className="em">
        <span>
          {user.email ?? '—'} {isSelf && <span className="pill ink">Vous</span>}
        </span>
      </td>
      <td data-l="Rôle">
        <span className={`role-tag${admin ? ' admin' : ''}`}>{user.role}</span>
      </td>
      <td data-l="Créé le">{user.created_at ? formatDate(user.created_at) : '—'}</td>
      <td data-l="Dernière connexion">{user.last_sign_in_at ? relativeDay(user.last_sign_in_at) : 'Jamais'}</td>
      <td data-l="E-mail confirmé">
        {user.email_confirmed_at ? <span className="pill excellent">Confirmé</span> : <span className="pill warn">En attente</span>}
      </td>
      <td data-l="Action" style={{ textAlign: 'right' }}>
        {isSelf ? (
          <span className="tip" data-tip="Vous ne pouvez pas modifier votre propre rôle">
            <button type="button" className="btn ghost sm is-disabled" disabled aria-disabled="true">
              Vous
            </button>
          </span>
        ) : confirming ? (
          <span className="confirm" role="alertdialog" aria-label="Confirmer le changement de rôle">
            {admin ? 'Rétrograder' : 'Promouvoir'} ?
            <button type="button" className="y" disabled={busy} onClick={onConfirm}>
              Confirmer
            </button>
            <button type="button" className="n" onClick={onCancel}>
              Annuler
            </button>
          </span>
        ) : (
          <button type="button" className="btn ghost sm" disabled={busy} onClick={onAsk}>
            {admin ? 'Rétrograder' : 'Promouvoir admin'}
          </button>
        )}
      </td>
    </tr>
  );
}

export default function AdminUsersPage() {
  const { user: me, token } = useAuth();
  const toast = useToast();
  const { users, loading, error, actionError, updatingId, setRole } = useAdminUsers(token);
  const [query, setQuery] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? users.filter((u) => (u.email ?? '').toLowerCase().includes(q)) : users;
  }, [users, query]);

  const change = async (target: UserSummary) => {
    const next: UserRole = target.role === 'admin' ? 'student' : 'admin';
    setConfirmId(null);
    const ok = await setRole(target.id, next);
    if (ok) toast(`${target.email} est maintenant ${next === 'admin' ? 'administrateur' : 'étudiant'}.`);
    else toast('Le rôle n’a pas pu être modifié.', { error: true });
  };

  return (
    <div className="page">
      <div className="wrap">
        <div className="page-h">
          <div>
            <span className="eyebrow">Comptes</span>
            <h1 className="display" style={{ marginTop: '.7rem' }}>
              Les <Highlight>utilisateurs</Highlight>.
            </h1>
          </div>
        </div>

        {(error || actionError) && (
          <Banner tone="risk" title="Action impossible" className="err-banner-inline">
            {actionError ?? error}
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
                placeholder="Rechercher par e-mail"
                aria-label="Rechercher par e-mail"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <span className="tiny muted">{users.length} comptes · le rôle s’écrit uniquement côté serveur</span>
          </div>
          {loading ? (
            <p className="muted">Chargement des comptes…</p>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl cards">
                <thead>
                  <tr>
                    <th>E-mail</th>
                    <th>Rôle</th>
                    <th>Créé le</th>
                    <th>Dernière connexion</th>
                    <th>E-mail confirmé</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {shown.length === 0 && (
                    <tr>
                      <td colSpan={6} className="muted" style={{ textAlign: 'center', padding: '2.4rem' }}>
                        Aucun utilisateur ne correspond à « {query} ».
                      </td>
                    </tr>
                  )}
                  {shown.map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      isSelf={u.id === me?.id}
                      confirming={confirmId === u.id}
                      busy={updatingId === u.id}
                      onAsk={() => setConfirmId(u.id)}
                      onCancel={() => setConfirmId(null)}
                      onConfirm={() => change(u)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
