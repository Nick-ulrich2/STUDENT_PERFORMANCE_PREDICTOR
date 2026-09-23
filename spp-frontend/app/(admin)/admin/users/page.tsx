'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Mail, ShieldCheck, Users, X } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useAdminUsers } from '@/hooks/useAdmin';
import { formatDateTime } from '@/lib/format';
import type { UserRole, UserSummary } from '@/types/auth';

function UserRow({
  target,
  isSelf,
  busy,
  onSetRole,
}: {
  target: UserSummary;
  isSelf: boolean;
  busy: boolean;
  onSetRole: (id: string, role: UserRole) => Promise<boolean>;
}) {
  const [confirming, setConfirming] = useState(false);
  const nextRole: UserRole = target.role === 'admin' ? 'student' : 'admin';

  return (
    <div className="card card-hover flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-sky text-navy">
          <Mail size={16} strokeWidth={2} aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-bold text-navy">{target.email ?? target.id}</p>
          <p className="text-xs text-ink/55">
            Inscrit {target.created_at ? formatDateTime(target.created_at) : '—'} · Dernière connexion{' '}
            {target.last_sign_in_at ? formatDateTime(target.last_sign_in_at) : 'jamais'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            target.role === 'admin' ? 'bg-mint text-teal' : 'bg-sky text-navy'
          }`}
        >
          {target.role === 'admin' ? 'Admin' : 'Étudiant'}
        </span>

        {isSelf ? (
          <span className="text-xs font-semibold text-ink/40">Vous</span>
        ) : confirming ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-ink/55">
              {nextRole === 'admin' ? 'Promouvoir' : 'Rétrograder'} ?
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                const ok = await onSetRole(target.id, nextRole);
                if (ok) setConfirming(false);
              }}
              aria-label="Confirmer"
              className="grid h-7 w-7 place-items-center rounded-full bg-navy text-white disabled:opacity-50"
            >
              <CheckCircle2 size={14} strokeWidth={2.5} aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirming(false)}
              aria-label="Annuler"
              className="grid h-7 w-7 place-items-center rounded-full border border-line text-ink/55 hover:border-navy"
            >
              <X size={14} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs font-bold text-navy hover:border-navy"
          >
            <ShieldCheck size={12} strokeWidth={2.5} aria-hidden="true" />
            {target.role === 'admin' ? 'Rétrograder' : 'Promouvoir admin'}
          </button>
        )}
      </div>
    </div>
  );
}

function AdminUsers() {
  const { user, token } = useAuth();
  const { users, loading, error, updatingId, actionError, setRole } = useAdminUsers(token);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => (u.email ?? '').toLowerCase().includes(q));
  }, [users, search]);

  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <AppShell>
      <section className="container section-pad">
        <SectionIntro
          icon={<Users size={14} strokeWidth={2.5} aria-hidden="true" />}
          eyebrow="Administration"
          title="Utilisateurs"
          description={`${users.length} compte${users.length > 1 ? 's' : ''} · ${adminCount} administrateur${adminCount > 1 ? 's' : ''}.`}
        />

        <div className="mt-8">
          <input
            type="search"
            placeholder="Rechercher un email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input max-w-sm"
          />
        </div>

        {actionError && (
          <div className="alert alert-error mt-4" role="alert">
            {actionError}
          </div>
        )}

        <div className="mt-6 grid gap-3">
          {loading && (
            <div className="card flex items-center gap-3">
              <Spinner label="Chargement…" />
            </div>
          )}
          {!loading && error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="card text-sm text-ink/60">Aucun utilisateur ne correspond à cette recherche.</div>
          )}
          {!loading &&
            !error &&
            filtered.map((target) => (
              <UserRow
                key={target.id}
                target={target}
                isSelf={target.id === user?.id}
                busy={updatingId === target.id}
                onSetRole={setRole}
              />
            ))}
        </div>
      </section>
    </AppShell>
  );
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute role="admin" redirectTo="/login">
      <AdminUsers />
    </ProtectedRoute>
  );
}
