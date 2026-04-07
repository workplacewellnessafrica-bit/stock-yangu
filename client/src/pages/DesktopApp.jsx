import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useScanner } from '../hooks/useScanner';
import { useInventoryStore } from '../stores/posStore';
import api from '../api/client';

// Subviews
import POSScreen      from './POSScreen';
import LogScreen      from './LogScreen';
import ReconcileScreen from './ReconcileScreen';
import ReportsScreen  from './ReportsScreen';
import AdminScreen    from './AdminScreen';
import PinPad         from '../components/PinPad';
import DashboardPanel from '../components/DashboardPanel';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', path: '/app' },
  { id: 'pos',       label: 'POS',       icon: '🛒', path: '/app/pos' },
  { id: 'log',       label: 'Today',     icon: '📋', path: '/app/log' },
  { id: 'reconcile', label: 'Balance',   icon: '⚖️', path: '/app/reconcile' },
  { id: 'reports',   label: 'Reports',   icon: '📊', path: '/app/reports' },
  { id: 'admin',     label: 'Admin',     icon: '⚙️', path: '/app/admin' },
];

export default function DesktopApp() {
  const { business, user, staffSession, setStaffSession, logout } = useAuthStore();
  const { lang, toast } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPin, setShowPin] = useState(false);
  const { items, setItems } = useInventoryStore();

  // Barcode scanner hook — looks up item and adds to cart
  useScanner(async (barcode) => {
    let item = items.find(i => i.barcode === barcode);
    if (!item) {
      try {
        const { data } = await api.get(`/items/barcode/${barcode}`);
        item = data;
        setItems([...items, item]);
      } catch {
        toast(`⚠️ No item found for barcode: ${barcode}`, 'warn');
        return;
      }
    }
    toast(`🔍 Scanned: ${item.emoji} ${item.name}`, 'info', 1500);
    // Auto-add default tier
    const defaultTier = item.priceTiers?.[0] || { qty: 1, price: item.sellPrice, label: `1 ${item.unit}` };
    const { addToCart } = (await import('../stores/posStore')).usePosStore.getState();
    addToCart(item, defaultTier.qty, item.unit, defaultTier.price);
  });

  const active = NAV.find(n => {
    if (n.path === '/app') return location.pathname === '/app';
    return location.pathname.startsWith(n.path);
  });

  return (
    <div className="app-shell" style={{ display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: 'var(--surface-1)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 18 }}>🌿 Stock Yangu</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{business?.name}</div>
        </div>

        {/* Scanner indicator */}
        <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', background: 'var(--primary-dim)' }}>
          <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700 }}>🔌 Scanner Ready</div>
          <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Point anywhere & scan</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => navigate(n.path)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 20px',
                background: active?.id === n.id ? 'var(--primary-dim)' : 'transparent',
                color: active?.id === n.id ? 'var(--primary)' : 'var(--text-2)',
                fontFamily: 'var(--font-head)',
                fontWeight: active?.id === n.id ? 800 : 500,
                fontSize: 14,
                borderLeft: `3px solid ${active?.id === n.id ? 'var(--primary)' : 'transparent'}`,
                transition: 'all 0.12s',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 18 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>
            👤 {staffSession?.staffName || user?.name}
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setShowPin(true)}>🔐 PIN</button>
            <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Sign out?')) logout(); }}>Exit</button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <main className="app-content">
        <Routes>
          <Route path="/"          element={<DashboardPanel />} />
          <Route path="/pos"       element={<POSScreen />} />
          <Route path="/log"       element={<LogScreen />} />
          <Route path="/reconcile" element={<ReconcileScreen />} />
          <Route path="/reports"   element={<ReportsScreen />} />
          <Route path="/admin"     element={<AdminScreen />} />
        </Routes>
      </main>

      {showPin && (
        <PinPad
          businessId={business?.id}
          onSuccess={(s) => { setStaffSession(s); setShowPin(false); }}
          onClose={() => setShowPin(false)}
        />
      )}
    </div>
  );
}
