'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { AuthSide } from '@/components/auth/AuthSide';
import { homeFor } from '@/components/layout/nav';
import { PasswordField } from '@/components/ui/PasswordField';
import { Banner } from '@/components/ui/Banner';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';

// Landing page of the link in the password-reset e-mail: Supabase opens a
// short-lived session from it, which is all this page needs to set a new password.
export default function ResetPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, loading, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setPasswordError('Le mot de passe doit contenir au moins 8 caractères.');
    setPasswordError('');
    setFormError('');
    setPending(true);
    const result = await updatePassword(password);
    setPending(false);
    if (!result.ok) return setFormError(result.error);
    toast('Mot de passe mis à jour.');
    router.replace(user ? homeFor(user.role) : '/login');
  };

  return (
    <div className="auth">
      <div className="auth-form">
        {loading ? (
          <div className="loading-screen" role="status">
            <div className="spin" aria-hidden="true" />
          </div>
        ) : !user ? (
          <div style={{ width: 'min(430px,100%)', display: 'grid', gap: '1rem' }}>
            <h1 className="display" style={{ fontSize: '2.4rem' }}>
              Ce lien n’est plus valable.
            </h1>
            <p className="muted">Il a expiré ou a déjà servi. Demandez-en un nouveau, il arrive en quelques secondes.</p>
            <Link className="btn" href="/forgot">
              Demander un nouveau lien <ArrowRight className="ar" size={18} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <form noValidate onSubmit={onSubmit}>
            <div>
              <span className="eyebrow">Nouveau mot de passe</span>
              <h1 className="display" style={{ fontSize: '2.6rem', marginTop: '.8rem' }}>
                Choisissez-en un nouveau.
              </h1>
            </div>
            {formError && <Banner tone="risk">{formError}</Banner>}
            <PasswordField id="new-password" label="Nouveau mot de passe" value={password} onChange={setPassword} autoComplete="new-password" error={passwordError} />
            <button className="btn" type="submit" disabled={pending}>
              {pending ? (
                <>
                  <span className="spin" /> Enregistrement…
                </>
              ) : (
                <>
                  Enregistrer <ArrowRight className="ar" size={18} aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
      <AuthSide>
        Un nouveau départ, <em>sans rien perdre</em>.
      </AuthSide>
    </div>
  );
}
