'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { AppShell } from '@/components/layout/AppShell';

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading, error } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const ok = await register({ ...form, role: 'student' });
    if (ok) router.push('/student-dashboard');
  };

  return (
    <AppShell>
      <section className="container section-pad">
        <SectionIntro eyebrow="Inscription" title="Créer un compte" center />
        <form onSubmit={handleSubmit} className="card mx-auto mt-10 grid max-w-md gap-4">
          <div>
            <label className="form-label" htmlFor="fullName">Nom complet</label>
            <input id="fullName" type="text" autoComplete="name" required
              className="form-input" value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <label className="form-label" htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" required
              className="form-input" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="form-label" htmlFor="password">Mot de passe</label>
            <input id="password" type="password" autoComplete="new-password" minLength={8} required
              className="form-input" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          <Button type="submit" disabled={loading} fullWidth>
            {loading ? <Spinner label="Création…" /> : 'Créer mon compte'}
          </Button>
          <p className="text-center text-sm text-ink/60">
            Déjà inscrit ?{' '}
            <Link href="/login" className="font-bold text-navy hover:underline">
              Connexion
            </Link>
          </p>
        </form>
      </section>
    </AppShell>
  );
}
