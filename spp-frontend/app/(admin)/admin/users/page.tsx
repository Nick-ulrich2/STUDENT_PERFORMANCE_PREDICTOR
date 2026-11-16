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
import { useI18n } from '@/lib/i18n';

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
  const { t, locale } = useI18n();
  const admin = user.role === 'admin';
  return (
    <tr>
      <td data-l={t('E-mail')} className="em">
        <span>
          {user.email ?? '—'} {isSelf && <span className="pill ink">{t('Vous')}</span>}
        </span>
      </td>
      <td data-l={t('Rôle')}>
        <span className={`role-tag${admin ? ' admin' : ''}`}>{admin ? t('admin') : t('étudiant')}</span>
      </td>
      <td data-l={t('Créé le')}>{user.created_at ? formatDate(user.created_at, locale) : '—'}</td>
      <td data-l={t('Dernière connexion')}>{user.last_sign_in_at ? relativeDay(user.last_sign_in_at, locale) : t('Jamais')}</td>
      <td data-l={t('E-mail confirmé')}>
        {user.email_confirmed_at ? <span className="pill excellent">{t('Confirmé')}</span> : <span className="pill warn">{t('En attente')}</span>}
      </td>
      <td data-l={t('Action')} style={{ textAlign: 'right' }}>
        {isSelf ? (
          <span className="tip" data-tip={t('Vous ne pouvez pas modifier votre propre rôle')}>
            <button type="button" className="btn ghost sm is-disabled" disabled aria-disabled="true">
              {t('Vous')}
            </button>
          </span>
        ) : confirming ? (
          <span className="confirm" role="alertdialog" aria-label={t('Confirmer le changement de rôle')}>
            {admin ? t('Rétrograder') : t('Promouvoir')} ?
            <button type="button" className="y" disabled={busy} onClick={onConfirm}>
              {t('Confirmer')}
            </button>
            <button type="button" className="n" onClick={onCancel}>
              {t('Annuler')}
            </button>
          </span>
        ) : (
          <button type="button" className="btn ghost sm" disabled={busy} onClick={onAsk}>
            {admin ? t('Rétrograder') : t('Promouvoir admin')}
          </button>
        )}
      </td>
    </tr>
  );
}

export default function AdminUsersPage() {
  const { t } = useI18n();
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
    if (ok) toast(t('{email} est maintenant {role}.', { email: target.email ?? '', role: next === 'admin' ? t('administrateur') : t('étudiant') }));
    else toast(t('Le rôle n’a pas pu être modifié.'), { error: true });
  };

  return (
    <div className="page">
      <div className="wrap">
        <div className="page-h">
          <div>
            <span className="eyebrow">{t('Comptes')}</span>
            <h1 className="display" style={{ marginTop: '.7rem' }}>
              {t('Les')} <Highlight>{t('utilisateurs')}</Highlight>.
            </h1>
          </div>
        </div>

        {(error || actionError) && (
          <Banner tone="risk" title={t('Action impossible')} className="err-banner-inline">
            {t(actionError ?? error ?? '')}
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
                placeholder={t('Rechercher par e-mail')}
                aria-label={t('Rechercher par e-mail')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <span className="tiny muted">{t('{count} comptes · le rôle s’écrit uniquement côté serveur', { count: users.length })}</span>
          </div>
          {loading ? (
            <p className="muted">{t('Chargement des comptes…')}</p>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl cards">
                <thead>
                  <tr>
                    <th>{t('E-mail')}</th>
                    <th>{t('Rôle')}</th>
                    <th>{t('Créé le')}</th>
                    <th>{t('Dernière connexion')}</th>
                    <th>{t('E-mail confirmé')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {shown.length === 0 && (
                    <tr>
                      <td colSpan={6} className="muted" style={{ textAlign: 'center', padding: '2.4rem' }}>
                        {t('Aucun utilisateur ne correspond à « {query} ».', { query })}
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
