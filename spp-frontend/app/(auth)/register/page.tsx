'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Mail, User } from 'lucide-react';
import { AuthSide } from '@/components/auth/AuthSide';
import { EMAIL_PATTERN, EmailField } from '@/components/auth/EmailField';
import { PasswordField } from '@/components/ui/PasswordField';
import { Banner } from '@/components/ui/Banner';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';

const METER_COLORS = ['#A92A2A', '#9A4A03', '#2457A6', '#17684A'];
const METER_LABELS = ['', 'Faible', 'Correct', 'Solide', 'Excellent'];

function passwordStrength(value: string): number {
  return [
    value.length >= 8,
    /[A-Z]/.test(value) && /[a-z]/.test(value),
    /\d/.test(value),
    /[^\w\s]/.test(value) || value.length >= 12,
  ].filter(Boolean).length;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);
  const [shake, setShake] = useState(false);
  const [confirmSentTo, setConfirmSentTo] = useState<string | null>(null);

  const strength = passwordStrength(password);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailOk = EMAIL_PATTERN.test(email.trim());
    const passwordOk = password.length >= 8;
    setEmailError(emailOk ? '' : 'Saisissez une adresse e-mail valide.');
    setPasswordError(passwordOk ? '' : 'Le mot de passe doit contenir au moins 8 caractères.');
    setFormError('');
    if (!emailOk || !passwordOk) return setShake(true);

    setPending(true);
    const result = await register({ email: email.trim(), password });
    setPending(false);
    if (result.status === 'error') {
      setFormError(result.error);
      return setShake(true);
    }
    if (result.status === 'confirm') {
      setConfirmSentTo(email.trim());
      return;
    }
    toast('Compte créé. Bienvenue !');
  };

  return (
    <div className="auth">
      <div className="auth-form">
        {confirmSentTo ? (
          <div style={{ width: 'min(430px,100%)', textAlign: 'center', display: 'grid', gap: '1rem' }}>
            <div className="avatar" style={{ width: 72, height: 72, margin: 'auto', background: 'var(--mark)', color: 'var(--ink)' }}>
              <Mail size={34} aria-hidden="true" />
            </div>
            <h1 className="display" style={{ fontSize: '2.4rem' }}>
              Vérifiez votre boîte mail.
            </h1>
            <p className="muted">
              Nous avons envoyé un lien de confirmation à <b style={{ color: 'var(--ink)' }}>{confirmSentTo}</b>. Votre compte est créé avec le rôle{' '}
              <b style={{ color: 'var(--ink)' }}>Étudiant</b>.
            </p>
            <Link className="btn" href="/login">
              Aller à la connexion <ArrowRight className="ar" size={18} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <form noValidate onSubmit={onSubmit} className={shake ? 'shake' : ''} onAnimationEnd={() => setShake(false)}>
            <div>
              <span className="eyebrow">Inscription</span>
              <h1 className="display" style={{ fontSize: '2.8rem', marginTop: '.8rem' }}>
                Créez votre espace.
              </h1>
            </div>
            {formError && (
              <Banner tone="risk" title="Inscription impossible">
                {formError}
              </Banner>
            )}
            <EmailField id="register-email" value={email} onChange={setEmail} error={emailError} />
            <PasswordField
              id="register-password"
              label="Mot de passe"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              error={passwordError}
              extra={
                <>
                  <div className="pw-meter" aria-hidden="true">
                    {[0, 1, 2, 3].map((n) => (
                      <i key={n} style={{ background: n < strength ? METER_COLORS[strength - 1] : undefined }} />
                    ))}
                  </div>
                  <span className="hint tiny muted">
                    {password.length < 8 ? 'Au moins 8 caractères.' : METER_LABELS[strength]}
                  </span>
                </>
              }
            />
            <div className="banner info" style={{ padding: '.7rem 1rem' }}>
              <span className="ic">
                <User size={18} aria-hidden="true" />
              </span>
              <div className="tiny">
                Votre compte sera créé avec le rôle <b>Étudiant</b>. Les droits d’administration ne se demandent pas.
              </div>
            </div>
            <button className="btn" type="submit" disabled={pending}>
              {pending ? (
                <>
                  <span className="spin" /> Création…
                </>
              ) : (
                <>
                  Créer mon compte <ArrowRight className="ar" size={18} aria-hidden="true" />
                </>
              )}
            </button>
            <p className="muted" style={{ textAlign: 'center', fontSize: '.92rem' }}>
              Déjà inscrit·e ?{' '}
              <Link className="link" href="/login">
                Se connecter
              </Link>
            </p>
          </form>
        )}
      </div>
      <AuthSide>
        Vos habitudes sont déjà là. <em>Il ne reste qu’à les lire</em>.
      </AuthSide>
    </div>
  );
}
