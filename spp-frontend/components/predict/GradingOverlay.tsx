'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n';

const WIDTHS = [92, 70, 58];

// "Je corrige votre copie…" — shown while the estimate is computed. The lines
// are decorative; the prediction itself is not slowed down by this animation.
export function GradingOverlay() {
  const [go, setGo] = useState(false);
  const t = useT();

  useEffect(() => {
    const id = requestAnimationFrame(() => setGo(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="grading" role="status" aria-live="polite">
      <div className="copie sheet">
        <div className="mono tiny muted" style={{ letterSpacing: '.1em' }}>
          {t('CORRECTION EN COURS')}
        </div>
        <div style={{ margin: '1.4rem 0 .6rem' }} aria-hidden="true">
          {WIDTHS.map((w, i) => (
            <div
              key={i}
              className="ln"
              style={{
                width: go ? `${w}%` : 0,
                transitionDelay: `${i * 0.26}s`,
                background: i === 2 ? 'var(--mark-deep)' : undefined,
              }}
            />
          ))}
        </div>
        <p>{t('Je corrige votre copie…')}</p>
      </div>
    </div>
  );
}
