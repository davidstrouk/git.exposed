import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: '#0F172A',
        color: 'white',
        fontFamily: 'sans-serif',
        padding: '60px 80px',
        alignItems: 'center',
      }}>
        {/* Left side — text */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontSize: 72, fontWeight: 800, color: '#F8FAFC' }}>git.</span>
            <span style={{ fontSize: 72, fontWeight: 800, color: '#EF4444' }}>exposed</span>
          </div>
          <div style={{ fontSize: 28, color: '#CBD5E1', marginTop: 16, lineHeight: 1.4 }}>
            Find exposed secrets and vulnerabilities in any GitHub repo.
          </div>
          <div style={{ fontSize: 18, color: '#64748B', marginTop: 12 }}>
            150+ secret patterns · 3,000+ security rules · Real CVE database
          </div>
          {/* Fake input + button */}
          <div style={{ display: 'flex', gap: 12, marginTop: 40 }}>
            <div style={{
              flex: 1,
              background: '#1E293B',
              border: '1px solid #475569',
              borderRadius: 10,
              padding: '14px 20px',
              fontSize: 16,
              color: '#64748B',
            }}>
              https://github.com/owner/repo
            </div>
            <div style={{
              background: '#16A34A',
              color: 'white',
              fontWeight: 700,
              fontSize: 18,
              padding: '14px 32px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
            }}>
              Scan
            </div>
          </div>
          <div style={{ fontSize: 14, color: '#64748B', marginTop: 16 }}>
            Free for public repos · No signup required
          </div>
        </div>

        {/* Right side — terminal card */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          width: 320,
          background: '#272F42',
          border: '1px solid rgba(71,85,105,0.4)',
          borderRadius: 20,
          padding: '28px 28px',
          marginLeft: 60,
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#EF4444' }} />
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#F59E0B' }} />
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#22C55E' }} />
            <span style={{ fontSize: 12, color: '#64748B', marginLeft: 8, fontFamily: 'monospace' }}>scan results</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: '#DC2626', color: 'white', padding: '3px 8px', borderRadius: 4 }}>critical</span>
              <span style={{ fontSize: 15, color: '#CBD5E1' }}>Hardcoded API key</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: '#EA580C', color: 'white', padding: '3px 8px', borderRadius: 4 }}>high</span>
              <span style={{ fontSize: 15, color: '#CBD5E1' }}>SQL injection risk</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: '#CA8A04', color: 'white', padding: '3px 8px', borderRadius: 4 }}>medium</span>
              <span style={{ fontSize: 15, color: '#CBD5E1' }}>Outdated dependency</span>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 18,
            paddingTop: 14,
            borderTop: '1px solid rgba(71,85,105,0.3)',
          }}>
            <span style={{ fontSize: 13, color: '#64748B' }}>Score</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#EF4444', fontFamily: 'monospace' }}>F — 12/100</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
