import { useState } from 'react';
import api from '../api/client';

export default function PinPad({ businessId, onSuccess, onClose }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function press(key) {
    if (pin.length >= 4) return;
    const next = pin + key;
    setPin(next);
    setError('');
    if (next.length === 4) verify(next);
  }

  function del() { setPin(p => p.slice(0, -1)); setError(''); }

  async function verify(code) {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/pin', { pin: code, businessId });
      onSuccess(data);
    } catch {
      setError('Wrong PIN');
      setPin('');
    } finally { setLoading(false); }
  }

  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="modal" style={{ zIndex: 60 }}>
        <div className="modal-box" style={{ padding: '28px 20px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔐</div>
            <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 20 }}>Enter PIN</h3>
            {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 8 }}>{error}</p>}
          </div>

          <div className="pin-dots">
            {[0,1,2,3].map(i => (
              <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center" style={{ padding: 24 }}>
              <div className="spinner" />
            </div>
          ) : (
            <div className="pin-pad">
              {keys.map((k, i) => {
                if (!k) return <div key={i} />;
                return (
                  <button
                    key={i}
                    className={`pin-key ${k === '⌫' ? 'del' : ''}`}
                    onClick={() => k === '⌫' ? del() : press(k)}
                    disabled={k !== '⌫' && pin.length >= 4}
                  >
                    {k}
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={onClose}
            style={{ width: '100%', textAlign: 'center', marginTop: 12, color: 'var(--text-muted)', fontSize: 13, padding: 8 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
