import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#0f172a', color: 'white', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
          <span style={{ fontSize: 80, fontWeight: 800, color: '#e2e8f0' }}>git.</span>
          <span style={{ fontSize: 80, fontWeight: 800, color: '#dc2626' }}>exposed</span>
        </div>
        <div style={{ fontSize: 28, color: '#94a3b8', marginTop: 20 }}>Is your code exposed?</div>
        <div style={{ fontSize: 22, color: '#64748b', marginTop: 16, maxWidth: 600, textAlign: 'center' }}>
          Scan any public GitHub repo for security vulnerabilities, exposed secrets, and code quality issues.
        </div>
      </div>
    ),
    { ...size },
  );
}
