import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../stores/authStore';

const DEMOS = [
  {
    slug: 'mama-amina',
    name: "Mama Amina's Kiosk",
    emoji: '🥬',
    type: 'Kibanda',
    desc: 'Solo operator, fresh veggies & essentials, M-Pesa heavy',
    color: '#22C55E',
    email: 'mama-amina@demo.stockyangu.co.ke',
    password: 'demo123',
  },
  {
    slug: 'kariuku-team',
    name: 'Kariuku General Stores',
    emoji: '🏪',
    type: 'General Store',
    desc: 'Small team, wide inventory, 2 cashiers',
    color: '#F97316',
    email: 'kariuku-team@demo.stockyangu.co.ke',
    password: 'demo123',
  },
  {
    slug: 'freshmart',
    name: 'FreshMart Supermarket',
    emoji: '🛒',
    type: 'Supermarket',
    desc: 'Barcode scanner, multiple staff, card + M-Pesa',
    color: '#6366F1',
    email: 'freshmart@demo.stockyangu.co.ke',
    password: 'demo123',
  },
];

const FEATURES = [
  { icon: '📱', title: 'Mobile POS', desc: 'Emoji-based item selection designed for speed. Sell in seconds.' },
  { icon: '🖥️', title: 'Desktop Dashboard', desc: 'Barcode scanner-ready. Watch live sales as staff ring them up.' },
  { icon: '💰', title: 'Cash & M-Pesa', desc: 'Track both payment methods. Variance detection on day close.' },
  { icon: '📊', title: 'Daily Reconciliation', desc: 'Count your float, close the day, auto-generate Excel reports.' },
  { icon: '📱', title: 'SMS Alerts', desc: 'Low-stock and daily summary SMS via Africa\'s Talking.' },
  { icon: '🔌', title: 'Works Offline', desc: 'Sell even without internet. Syncs automatically when back online.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(null);

  async function loginAsDemo(demo) {
    setLoading(demo.slug);
    try {
      const { data } = await api.post('/auth/login', { email: demo.email, password: demo.password });
      setAuth(data);
      navigate('/app');
    } catch {
      alert('Demo login failed — is the server running?');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex-col" style={{ minHeight: '100dvh', overflowY: 'auto' }}>
      {/* Nav */}
      <nav className="header" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 20 }}>
          🌿 Stock Yangu
        </span>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/auth?mode=login')}>
            Sign In
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/auth?mode=register')}>
            Start Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '64px 24px 40px', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
        <div style={{
          display: 'inline-block', background: 'var(--primary-dim)',
          color: 'var(--primary)', padding: '6px 18px', borderRadius: 'var(--radius-full)',
          fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 24,
          border: '1px solid var(--primary)',
        }}>
          🇰🇪 BUILT FOR KENYAN BUSINESSES
        </div>

        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(36px,8vw,64px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
          Record-keeping that<br />
          <span style={{ color: 'var(--primary)' }}>actually works</span> for you
        </h1>

        <p style={{ fontSize: 18, color: 'var(--text-2)', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.6 }}>
          From kibanda to supermarket. Track sales, expenses, stock and cash flow —
          in English or Swahili, with M-Pesa built in.
        </p>

        <div className="flex gap-3 justify-center" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/auth?mode=register')}>
            🚀 Start Free — No credit card
          </button>
          <button className="btn btn-ghost btn-lg" onClick={() => {
            document.getElementById('demos')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            👀 Try a demo
          </button>
        </div>
      </section>

      {/* Demo section */}
      <section id="demos" style={{ padding: '48px 24px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>
          Try a Live Demo
        </h2>
        <p style={{ color: 'var(--text-3)', textAlign: 'center', marginBottom: 32 }}>
          Real data, real inventory — just click and explore.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {DEMOS.map(demo => (
            <div key={demo.slug} className="card card-p" style={{ borderColor: `${demo.color}30` }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{demo.emoji}</div>
              <div className="badge badge-gray" style={{ marginBottom: 10 }}>{demo.type}</div>
              <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
                {demo.name}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.5 }}>
                {demo.desc}
              </p>
              <button
                className="btn btn-full"
                style={{ background: demo.color, color: demo.color === '#6366F1' ? '#fff' : '#000', fontFamily: 'var(--font-head)', fontWeight: 700 }}
                onClick={() => loginAsDemo(demo)}
                disabled={!!loading}
              >
                {loading === demo.slug
                  ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in…</>
                  : '▶ Open Demo'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '48px 24px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, textAlign: 'center', marginBottom: 32 }}>
          Everything your business needs
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {FEATURES.map(f => (
            <div key={f.title} className="card card-p" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 30 }}>{f.icon}</span>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{
        margin: '0 24px 48px', padding: '48px 32px', textAlign: 'center',
        background: 'linear-gradient(135deg, var(--surface-2) 0%, var(--surface-3) 100%)',
        border: '1px solid var(--border-md)', borderRadius: 'var(--radius-xl)',
        maxWidth: 900, marginLeft: 'auto', marginRight: 'auto',
      }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 900, marginBottom: 12 }}>
          Ready to take control?
        </h2>
        <p style={{ color: 'var(--text-2)', marginBottom: 28 }}>
          Join businesses across Kenya tracking every shilling.
        </p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/auth?mode=register')}>
          🌿 Create Your Account — Free
        </button>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
        🌿 Stock Yangu · Made in Kenya · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
