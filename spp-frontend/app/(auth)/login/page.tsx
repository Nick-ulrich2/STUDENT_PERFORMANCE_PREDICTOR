'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { AppShell } from '@/components/layout/AppShell';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, error, user } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });

  if (!loading && user) {
    router.replace(user.role === 'admin' ? '/admin-dashboard' : '/student-dashboard');
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const ok = await login(form);
    if (ok) router.push(user?.role === 'admin' ? '/admin-dashboard' : '/student-dashboard');
  };

  return (
    <AppShell>
      <section className="container section-pad">
        <SectionIntro eyebrow="Connexion" title="Bienvenue" center />
        <form onSubmit={handleSubmit} className="card mx-auto mt-10 grid max-w-md gap-4">
          <div>
            <label className="form-label" htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" required
              className="form-input" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="form-label" htmlFor="password">Mot de passe</label>
            <input id="password" type="password" autoComplete="current-password" required
              className="form-input" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          <Button type="submit" disabled={loading} fullWidth>
            {loading ? <Spinner label="Connexion…" /> : 'Se connecter'}
          </Button>
          <p className="text-center text-sm text-ink/60">
            Pas de compte ?{' '}
            <Link href="/register" className="font-bold text-navy hover:underline">
              Inscription
            </Link>
          </p>
        </form>
      </section>
    </AppShell>
  );
}
