'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from '@/hooks/useInView';
import { tween } from '@/lib/motion';
import { formatNumber } from '@/lib/format';
import { previewScore } from '@/lib/model';
import { scoreTone } from '@/lib/scoreTone';
import { PenCircle } from '@/components/ui/PenCircle';
import { useI18n } from '@/lib/i18n';

const FIXED = {
  Previous_Scores: 70,
  Tutoring_Sessions: 1,
  Access_to_Resources: 'Medium',
  Parental_Involvement: 'Medium',
} as const;

// The only place a score is computed in the browser: a public, account-free
// preview with two sliders. Real estimates always come from the API.
export function HeroDemo() {
  const { t, locale } = useI18n();
  const [hours, setHours] = useState(18);
  const [attendance, setAttendance] = useState(80);
  const [shown, setShown] = useState(0);
  const [stamped, setStamped] = useState(false);
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const shownRef = useRef(0);
  const firstRun = useRef(true);

  const score = previewScore({ ...FIXED, Attendance: attendance, Hours_Studied: hours });
  const tone = scoreTone(score);

  useEffect(() => {
    if (!inView) return;
    const first = firstRun.current;
    firstRun.current = false;
    const from = shownRef.current;
    const anim = tween(
      first ? 1400 : 260,
      (p) => {
        const v = from + (score - from) * p;
        shownRef.current = v;
        setShown(v);
      },
      { delay: first ? 300 : 0 },
    );
    const stampTimer = setTimeout(() => setStamped(true), first ? 1500 : 0);
    return () => {
      anim.cancel();
      clearTimeout(stampTimer);
    };
  }, [inView, score]);

  return (
    <div ref={ref} className={`demo-copie copie ${tone.className}`}>
      <span className="sticker">{t('Essayez')}</span>
      <div className="mono tiny muted" style={{ letterSpacing: '.08em' }}>
        {t('COPIE D’APERÇU · 2 CURSEURS')}
      </div>
      <div className="score-spot">
        <PenCircle delay={900} />
        <div className="num">
          <span aria-live="polite" aria-atomic="true">{formatNumber(shown, 1, locale)}</span>
          <small>/100</small>
        </div>
      </div>
      <div style={{ textAlign: 'center', minHeight: '2.6rem' }}>
        <span className={`tier-stamp${stamped ? ' show' : ''}`}>{t(tone.label)}</span>
      </div>
      <div className="mini-ctl">
        <label>
          <div className="row">
            <span>{t('Heures d’étude / semaine')}</span>
            <output>{hours} {t('h')}</output>
          </div>
          <input
            className="range"
            type="range"
            min={0}
            max={45}
            value={hours}
            style={{ '--p': `${(hours / 45) * 100}%` } as React.CSSProperties}
            onChange={(e) => setHours(Number(e.target.value))}
            aria-label={t('Heures d’étude par semaine')}
          />
        </label>
        <label>
          <div className="row">
            <span>{t('Assiduité')}</span>
            <output>{attendance} %</output>
          </div>
          <input
            className="range"
            type="range"
            min={50}
            max={100}
            value={attendance}
            style={{ '--p': `${((attendance - 50) / 50) * 100}%` } as React.CSSProperties}
            onChange={(e) => setAttendance(Number(e.target.value))}
            aria-label={t('Assiduité en pourcentage')}
          />
        </label>
      </div>
      <p className="tiny muted" style={{ marginTop: '.9rem' }}>
        {t('Aperçu pédagogique : les 4 autres variables sont fixées à une valeur moyenne. Le vrai calcul utilise vos 6 variables.')}
      </p>
      <span className="margin-note" style={{ position: 'absolute', left: -12, bottom: -30, fontSize: '1.5rem' }}>
        {t('bouge les curseurs ↑')}
      </span>
    </div>
  );
}
