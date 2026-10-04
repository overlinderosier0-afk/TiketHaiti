import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: '#FAF6EF',
          color: '#16130E',
          fontFamily: 'system-ui, sans-serif',
          border: '12px solid #16130E'
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 8, color: '#D93A2B' }}>
          LA BILLETTERIE D&apos;HAÏTI
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 16 }}>
          <div style={{ fontSize: 110, fontWeight: 900, letterSpacing: -2 }}>TIKE</div>
          <div style={{ fontSize: 110, fontWeight: 900, letterSpacing: -2, color: '#D93A2B' }}>AYITI</div>
        </div>
        <div style={{ marginTop: 20, fontSize: 40, fontWeight: 800 }}>
          Le konpa t&apos;attend.
        </div>
        <div style={{ marginTop: 12, fontSize: 28, color: '#6B6355' }}>
          Billets QR sécurisés · MonCash · NatCash
        </div>
      </div>
    ),
    { ...size }
  );
}
