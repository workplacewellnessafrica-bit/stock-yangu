import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUIStore, t } from '../stores/uiStore';
import POSScreen      from './POSScreen';
import LogScreen      from './LogScreen';
import ReconcileScreen from './ReconcileScreen';
import ReportsScreen  from './ReportsScreen';
import AdminScreen    from './AdminScreen';
import PinPad         from '../components/PinPad';

const TABS = [
  { id: 'pos',       label: 'Sales',   icon: '🛒', path: '/app' },
  { id: 'log',       label: 'Log',     icon: '📋', path: '/app/log' },
  { id: 'reconcile', label: 'Balance', icon: '⚖️', path: '/app/reconcile' },
  { id: 'reports',   label: 'Reports', icon: '📊', path: '/app/reports' },
  { id: 'admin',     label: 'Admin',   icon: '⚙️', path: '/app/admin' },
];

export default function MobileApp() {
  const { business, user, staffSession, setStaffSession } = useAuthStore();
  const { lang } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPin, setShowPin] = useState(false);

  // Determine active tab
  const active = TABS.find(tab => {
    if (tab.path === '/app') return location.pathname === '/app';
    return location.pathname.startsWith(tab.path);
  })?.id || 'pos';

  // If business has staff and no staff session when accessing POS → show pin pad
  const needsStaffPin = false; // Could require PIN before POS if desired

  return (
    <div className="flex-col app-shell">
      {/* Header */}
      <div className="header">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 20 }}>🌿</span>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 15, lineHeight: 1.1 }}>
              {business?.name || 'Stock Yangu'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-3)' }}>
              {staffSession ? `👤 ${staffSession.staffName}` : `👤 ${user?.name || ''}`}
            </div>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {/* Language toggle */}
          <button
            onClick={() => useUIStore.getState().setLang(lang === 'en' ? 'sw' : 'en')}
            style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', padding: '4px 8px', borderRadius: 6, background: 'var(--surface-2)' }}
          >
            {lang === 'en' ? '🇰🇪 SW' : '🇬🇧 EN'}
          </button>
          {/* Staff PIN switch */}
          <button
            className="btn btn-sm"
            style={{ background: 'var(--surface-2)', color: 'var(--text-2)', fontSize: 11, fontWeight: 700 }}
            onClick={() => setShowPin(true)}
          >
            🔐 PIN
          </button>
        </div>
      </div>

      {/* Page content */}
      <div className="app-content">
        <Routes>
          <Route path="/"          element={<POSScreen />} />
          <Route path="/log"       element={<LogScreen />} />
          <Route path="/reconcile" element={<ReconcileScreen />} />
          <Route path="/reports"   element={<ReportsScreen />} />
          <Route path="/admin"     element={<AdminScreen />} />
        </Routes>
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-item ${active === tab.id ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <span style={{ fontSize: 22 }}>{tab.icon}</span>
            <span>{t(tab.id, lang)}</span>
          </button>
        ))}
      </div>

      {/* PIN Modal */}
      {showPin && (
        <PinPad
          businessId={business?.id}
          onSuccess={(session) => { setStaffSession(session); setShowPin(false); }}
          onClose={() => setShowPin(false)}
        />
      )}
    </div>
  );
}
