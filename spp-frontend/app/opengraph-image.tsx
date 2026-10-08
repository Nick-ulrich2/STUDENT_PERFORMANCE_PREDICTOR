import { ImageResponse } from 'next/og';

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
          backgroundColor: '#1B1A17',
          padding: 72,
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 620 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#F5EFE3', fontSize: 30, fontWeight: 700 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: '#FFD84D',
                color: '#1B1A17',
                fontSize: 30,
              }}
            >
              S
            </div>
            SPP
          </div>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 700, color: '#F5EFE3', lineHeight: 1.04 }}>
            Votre note de demain se prépare aujourd’hui.
          </div>
          <div style={{ display: 'flex', fontSize: 26, color: '#cfc7b3' }}>Estimation, jamais verdict.</div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: 400,
            height: 400,
            backgroundColor: '#FFFDF7',
            borderRadius: 12,
            transform: 'rotate(3deg)',
            border: '2px solid #CFC3A8',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 270,
              height: 190,
              border: '9px solid #2457A6',
              borderRadius: 140,
              color: '#1B1A17',
              fontSize: 104,
              fontWeight: 800,
            }}
          >
            66,0
          </div>
          <div style={{ display: 'flex', marginTop: 28, fontSize: 28, color: '#2457A6', fontWeight: 700, letterSpacing: 4 }}>
            BON
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
