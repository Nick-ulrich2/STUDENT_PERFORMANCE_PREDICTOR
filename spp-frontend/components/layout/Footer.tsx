'use client';

import Link from 'next/link';
import { LogoMark } from '@/components/ui/Logo';
import { useT } from '@/lib/i18n';

export function Footer() {
  const t = useT();
  return (
    <footer className="foot">
      <div className="wrap cols">
        <div>
          <Link className="logo" href="/" style={{ marginBottom: '.8rem' }}>
            <LogoMark />
            <span>SPP</span>
          </Link>
          <p style={{ maxWidth: '26rem' }}>
            {t('Student Performance Predictor. Projet académique réalisé par Ulrich Mvongo. L’estimation fournie est indicative.')}
          </p>
        </div>
        <div>
          <b>{t('Produit')}</b>
          <p>
            <Link href="/#how">{t('Comment ça marche')}</Link>
            <br />
            <Link href="/#faq">{t('FAQ')}</Link>
            <br />
            <Link href="/login">{t('Connexion')}</Link>
          </p>
        </div>
        <div>
          <b>{t('Technique')}</b>
          <p>
            Next.js · FastAPI
            <br />
            Supabase · Groq
            <br />
            {t('Hébergé sur Vercel et Render')}
          </p>
        </div>
      </div>
    </footer>
  );
}
