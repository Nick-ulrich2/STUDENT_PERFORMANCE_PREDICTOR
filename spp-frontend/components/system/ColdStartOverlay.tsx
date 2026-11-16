'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Moon } from 'lucide-react';
import { hasSlowRequest, subscribeSlow } from '@/lib/pending';
import { useI18n } from '@/lib/i18n';

const EXPECTED_WAKE_MS = 60_000;

function Overlay() {
  const { t, number } = useI18n();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - start), 250);
    return () => clearInterval(id);
  }, []);

  // Asymptotic: the bar never claims to be done before the server answers.
  const pct = Math.round((1 - Math.exp(-elapsed / (EXPECTED_WAKE_MS / 2.2))) * 96);

  return (
    <div className="overlay" role="alertdialog" aria-live="polite" aria-label={t('Le serveur se réveille')}>
      <div>
        <div className="zz" aria-hidden="true">
          <span>z</span>
          <span>z</span>
          <span>Z</span>
        </div>
        <Moon size={64} strokeWidth={1.8} style={{ color: 'var(--mark)', margin: '1rem auto 0', display: 'block' }} aria-hidden="true" />
        <h2 className="display" style={{ fontSize: '2.2rem', margin: '1rem 0 .6rem' }}>
          {t('Le serveur se réveille…')}
        </h2>
        <p style={{ color: '#cfc7b3', maxWidth: '26rem', margin: 'auto' }}>
          {t('L’offre gratuite met l’API en veille après environ 15 minutes. Le réveil prend')} <b>{t('30 à 60 secondes')}</b>. {t('Votre saisie est conservée.')}
        </p>
        <div className="bootbar">
          <i style={{ width: `${pct}%`, transition: 'width .3s linear' }} />
        </div>
        <p className="mono tiny" style={{ color: 'var(--mark)' }}>
          {t('Démarrage…')} {number(pct)} %
        </p>
      </div>
    </div>
  );
}

export function ColdStartOverlay() {
  const slow = useSyncExternalStore(subscribeSlow, hasSlowRequest, () => false);
  return slow ? <Overlay /> : null;
}
