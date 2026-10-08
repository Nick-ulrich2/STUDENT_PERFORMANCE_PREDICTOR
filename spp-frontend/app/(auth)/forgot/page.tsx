'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AuthSide } from '@/components/auth/AuthSide';
import { EMAIL_PATTERN, EmailField } from '@/components/auth/EmailField';
import { Banner } from '@/components/ui/Banner';
import { useAuth } from '@/hooks/useAuth';

export default function ForgotPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = EMAIL_PATTERN.test(email.trim());
    setEmailError(ok ? '' : 'Saisissez une adresse e-mail valide.');
    setFormError('');
    if (!ok) return;
    setPending(true);
    const result = await requestPasswordReset(email.trim());
    setPending(false);
    if (!result.ok) return setFormError(result.error);
    setSent(true);
  };

  return (
    <div className="auth">
      <div className="auth-form">
        <form noValidate onSubmit={onSubmit}>
          <div>
            <span className="eyebrow">Récupération</span>
            <h1 className="display" style={{ fontSize: '2.6rem', marginTop: '.8rem' }}>
              On vous renvoie un lien.
            </h1>
          </div>
          <p className="muted">
            Saisissez votre e-mail : si un compte existe, vous recevrez un lien pour choisir un nouveau mot de passe.
          </p>
          <EmailField id="forgot-email" value={email} onChange={setEmail} error={emailError} />
          {formError && <Banner tone="risk">{formError}</Banner>}
          {sent && (
            <Banner tone="ok" title="Si un compte existe, un lien est parti.">
              Pensez à vérifier vos courriers indésirables.
            </Banner>
          )}
          <button className="btn" type="submit" disabled={pending}>
            {pending ? (
              <>
                <span className="spin" /> Envoi…
              </>
            ) : (
              <>
                Envoyer le lien <ArrowRight className="ar" size={18} aria-hidden="true" />
              </>
            )}
          </button>
          <Link className="link" href="/login" style={{ textAlign: 'center' }}>
            Retour à la connexion
          </Link>
        </form>
      </div>
      <AuthSide>
        Un oubli n’a jamais effacé <em>votre progression</em>.
      </AuthSide>
    </div>
  );
}
