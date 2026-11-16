'use client';

import type { ReactNode } from 'react';
import { useT } from '@/lib/i18n';

export function AuthSide({ children }: { children: ReactNode }) {
  const t = useT();
  return (
    <aside className="auth-side">
      <div className="orb" style={{ width: 300, height: 300, background: '#FFD84D', right: -80, top: -60 }} />
      <div className="orb" style={{ width: 220, height: 220, background: '#A92A2A', left: -60, bottom: -40, animationDelay: '-4s', opacity: 0.35 }} />
      <blockquote style={{ position: 'relative' }}>{children}</blockquote>
      <p className="mono tiny" style={{ marginTop: '2rem', color: '#9c9580', letterSpacing: '.1em', position: 'relative' }}>
        {t('SPP · ESTIMATION, PAS VERDICT')}
      </p>
    </aside>
  );
}
