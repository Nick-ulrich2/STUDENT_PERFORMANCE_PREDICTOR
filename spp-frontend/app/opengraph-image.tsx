import { ImageResponse } from 'next/og';
import { SITE_DESCRIPTION } from '@/lib/seo';

export const alt = 'SPP — Student Performance Predictor';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          backgroundColor: '#f8f8f3',
          backgroundImage:
            'radial-gradient(circle at 85% 15%, rgba(215,238,228,0.9) 0%, rgba(215,238,228,0) 55%), radial-gradient(circle at 10% 90%, rgba(223,240,244,0.9) 0%, rgba(223,240,244,0) 55%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: '#123d59',
              color: 'white',
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            S
          </div>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 800, color: '#12212b' }}>
            SPP<span style={{ color: '#2d7770' }}>.</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 980 }}>
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, color: '#123d59', lineHeight: 1.1 }}>
            Comprenez vos habitudes d’apprentissage.
          </div>
          <div style={{ display: 'flex', fontSize: 28, color: 'rgba(18,33,43,0.65)', lineHeight: 1.4 }}>
            {SITE_DESCRIPTION.slice(0, 140)}…
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {['Suivi d’habitudes', 'Prédiction ML', 'Recommandations IA'].map((label) => (
            <div
              key={label}
              style={{
                display: 'flex',
                padding: '10px 20px',
                borderRadius: 999,
                backgroundColor: 'rgba(45,119,112,0.12)',
                color: '#2d7770',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
