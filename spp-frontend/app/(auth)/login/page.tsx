'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { AuthSide } from '@/components/auth/AuthSide';
import { EMAIL_PATTERN, EmailField } from '@/components/auth/EmailField';
import { safeNext } from '@/components/auth/Guard';
import { PasswordField } from '@/components/ui/PasswordField';
import { Banner } from '@/components/ui/Banner';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';

function LoginForm() {
  const { login } = useAuth();
  const toast = useToast();
  const redirected = safeNext(useSearchParams().get('next')) !== null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);
  const [shake, setShake] = useState(false);

  const fail = () => setShake(true);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailOk = EMAIL_PATTERN.test(email.trim());
    setEmailError(emailOk ? '' : 'Saisissez une adresse e-mail valide.');
    setPasswordError(password ? '' : 'Saisissez votre mot de passe.');
    setFormError('');
    if (!emailOk || !password) return fail();

    setPending(true);
    const result = await login({ email: email.trim(), password });
    setPending(false);
    if (!result.ok) {
      setFormError(result.error);
      return fail();
    }
    toast('Connexion réussie.');
  };

  return (
    <div className="auth">
      <div className="auth-form">
        <form noValidate onSubmit={onSubmit} className={shake ? 'shake' : ''} onAnimationEnd={() => setShake(false)}>
          <div>
            <span className="eyebrow">Connexion</span>
            <h1 className="display" style={{ fontSize: '2.8rem', marginTop: '.8rem' }}>
              Content de vous revoir.
            </h1>
          </div>
          {redirected && (
            <Banner tone="info" lock>
              Connectez-vous pour accéder à cette page.
            </Banner>
          )}
          {formError && (
            <Banner tone="risk" title="Connexion impossible">
              {formError}
            </Banner>
          )}
          <EmailField id="login-email" value={email} onChange={setEmail} error={emailError} />
          <PasswordField id="login-password" label="Mot de passe" value={password} onChange={setPassword} autoComplete="current-password" error={passwordError} />
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <Link className="link tiny" href="/forgot">
              Mot de passe oublié ?
            </Link>
          </div>
          <button className="btn" type="submit" disabled={pending}>
            {pending ? (
              <>
                <span className="spin" /> Connexion…
              </>
            ) : (
              <>
                Se connecter <ArrowRight className="ar" size={18} aria-hidden="true" />
              </>
            )}
          </button>
          <p className="muted" style={{ textAlign: 'center', fontSize: '.92rem' }}>
            Pas encore de compte ?{' '}
            <Link className="link" href="/register">
              Créer un compte
            </Link>
          </p>
        </form>
      </div>
      <AuthSide>
        Chaque habitude compte, <em>même la plus petite</em>.
      </AuthSide>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
