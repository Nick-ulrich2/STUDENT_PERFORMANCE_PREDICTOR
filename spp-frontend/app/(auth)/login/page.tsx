'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { AppShell } from '@/components/layout/AppShell';
import { PasswordField } from '@/components/ui/PasswordField';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, error, user } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    if (!loading && user) {
      router.replace(user.role === 'admin' ? '/admin-dashboard' : '/student-dashboard');
    }
  }, [loading, user, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await login(form);
  };

  return (
    <AppShell>
      <section className="container section-pad">
        <SectionIntro icon={<LogIn size={14} strokeWidth={2.5} aria-hidden="true" />} eyebrow="Connexion" title="Bienvenue" center />
        <form onSubmit={handleSubmit} className="card mx-auto mt-10 grid max-w-md gap-4">
          <div>
            <label className="form-label" htmlFor="email">Email</label>
            <div className="relative">
              <Mail size={16} strokeWidth={2} className="form-field-icon" aria-hidden="true" />
              <input id="email" type="email" autoComplete="email" required
                className="form-input form-input-icon" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="form-label" htmlFor="password">Mot de passe</label>
            <PasswordField
              id="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(password) => setForm({ ...form, password })}
            />
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
