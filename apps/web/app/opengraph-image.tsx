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
          background: 'linear-gradient(120deg, #2F5BFF 0%, #1E3FAE 55%, #0F172A 100%)',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #2F5BFF, #1E3FAE 60%, #F4B942 130%)',
              fontSize: 52
            }}
          >
            🎟️
          </div>
          <div style={{ fontSize: 64, fontWeight: 900 }}>Tikè Ayiti</div>
        </div>
        <div style={{ marginTop: 28, fontSize: 40, fontWeight: 700, opacity: 0.92 }}>
          Tikè ou, nan poch ou.
        </div>
        <div style={{ marginTop: 12, fontSize: 28, opacity: 0.75 }}>
          Peye ak MonCash oswa NatCash • Bilyè QR sekirize
        </div>
      </div>
    ),
    { ...size }
  );
}
