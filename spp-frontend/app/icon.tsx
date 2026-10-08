import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 32,
          backgroundColor: '#FFD84D',
          border: '4px solid #1B1A17',
          color: '#1B1A17',
          fontSize: 38,
          fontWeight: 800,
          fontFamily: 'serif',
        }}
      >
        S
      </div>
    ),
    { ...size },
  );
}
