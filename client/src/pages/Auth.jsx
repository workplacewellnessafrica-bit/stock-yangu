import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../stores/authStore';

export default function Auth() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') || 'login');
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');

  // Register extras
  const [name, setName]             = useState('');
  const [businessName, setBizName]  = useState('');
  const [ownerName, setOwnerName]   = useState('');
  const [bizType, setBizType]       = useState('kibanda');
  const [adminPin, setAdminPin]     = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        email, password, name, businessName, ownerName,
        businessType: bizType, adminPin,
      });
      setAuth(data);
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="flex-col items-center" style={{ minHeight: '100dvh', padding: '40px 16px 80px' }}>
      {/* Back link */}
      <button onClick={() => navigate('/')} style={{ color: 'var(--text-3)', marginBottom: 32, alignSelf: 'flex-start', maxWidth: 480, width: '100%', margin: '0 auto 32px' }}>
        ← Back
      </button>

      <div className="card card-p-lg" style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🌿</div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 900 }}>Stock Yangu</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 4 }}>
            {mode === 'login' ? 'Welcome back' : 'Set up your business in 2 minutes'}
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex" style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: 4, marginBottom: 28 }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1, padding: '10px', borderRadius: 'calc(var(--radius) - 2px)',
                fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13,
                background: mode === m ? 'var(--primary)' : 'transparent',
                color: mode === m ? '#000' : 'var(--text-3)',
                transition: 'all 0.15s',
              }}>
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: 'var(--danger-dim)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, color: 'var(--danger)', marginBottom: 20 }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input className="input" type="email" placeholder="you@business.co.ke" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input className="input" type="password" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>

          {mode === 'register' && (
            <>
              <div className="input-group">
                <label className="input-label">Your Name</label>
                <input className="input" placeholder="John Kamau" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">Business Name</label>
                <input className="input" placeholder="Kamau's General Store" value={businessName} onChange={e => setBizName(e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">Owner Name</label>
                <input className="input" placeholder="John Kamau" value={ownerName} onChange={e => setOwnerName(e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">Business Type</label>
                <select className="input" value={bizType} onChange={e => setBizType(e.target.value)}>
                  <option value="kibanda">🏠 Kibanda / Kiosk</option>
                  <option value="small-supermarket">🏪 Small Supermarket</option>
                  <option value="supermarket">🛒 Supermarket</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Admin PIN (4 digits)</label>
                <input className="input" type="password" placeholder="••••" maxLength={4} pattern="[0-9]{4}"
                  value={adminPin} onChange={e => setAdminPin(e.target.value.replace(/\D/g, '').slice(0, 4))} required />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>This PIN unlocks admin features and closes the day</span>
              </div>
            </>
          )}

          <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading
              ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Please wait…</>
              : mode === 'login' ? '→ Sign In' : '🌿 Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
