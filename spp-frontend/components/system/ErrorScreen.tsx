'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useT } from '@/lib/i18n';

export function ForbiddenScreen({ homeHref }: { homeHref: string }) {
  const t = useT();
  return (
    <div className="sys">
      <div>
        <div className="big">
          403<span className="stamp-x">{t('NON.')}</span>
        </div>
        <h1 className="display" style={{ fontSize: '2.2rem', margin: '1.4rem 0 .6rem' }}>
          {t('Cet espace est réservé aux administrateurs.')}
        </h1>
        <p className="muted" style={{ maxWidth: '30rem', margin: '0 auto 1.8rem' }}>
          {t('Votre rôle ne permet pas d’ouvrir cette page. Le contrôle est fait côté serveur : masquer un lien ne suffirait pas.')}
        </p>
        <Link className="btn" href={homeHref}>
          {t('Retour à mon espace')} <ArrowRight className="ar" size={18} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

export function NotFoundScreen() {
  const t = useT();
  return (
    <div className="sys">
      <div>
        <div className="big">404</div>
        <h1 className="display" style={{ fontSize: '2.2rem', margin: '1.4rem 0 .6rem' }}>
          {t('Cette page n’est pas dans le programme.')}
        </h1>
        <p className="muted" style={{ marginBottom: '1.8rem' }}>
          {t('Le lien est peut-être erroné ou la page a été déplacée.')}
        </p>
        <Link className="btn" href="/">
          {t('Retour à l’accueil')} <ArrowRight className="ar" size={18} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
