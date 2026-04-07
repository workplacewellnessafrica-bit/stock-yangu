// src/storefront/components/AdminPanel.jsx
// PIN-protected admin panel — Store Settings, Products, Web Orders, Analytics.

import { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext.jsx';
import { formatCurrency, formatDateShort, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '../utils/formatters.js';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const CloseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

const ADMIN_PIN_KEY = 'sy_admin_authed';

const TABS = ['Settings', 'Products', 'Orders', 'Analytics'];

export default function AdminPanel({ onClose }) {
  const { config, slug, updateConfig, loadStore, products, analytics } = useShop();
  const currency = config?.currency || { symbol: 'KES', locale: 'en-KE' };

  const [authed, setAuthed]     = useState(() => sessionStorage.getItem(ADMIN_PIN_KEY) === '1');
  const [pin, setPin]           = useState('');
  const [pinError, setPinError] = useState('');
  const [tab, setTab]           = useState('Settings');
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState('');
  const [orders, setOrders]     = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Settings form state (pre-loaded from config)
  const [settings, setSettings] = useState({
    shopName: config?.shopName || '',
    shopTagline: config?.shopTagline || '',
    whatsappNumber: config?.whatsappNumber || '',
    brandColor: config?.brandColor || '#22C55E',
    deliveryFee: config?.delivery?.fee ?? 150,
    freeAbove: config?.delivery?.freeAbove ?? 2500,
    estimatedDeliveryHours: config?.whatsappMessage?.estimatedDeliveryHours ?? 24,
    isStoreOpen: config?.operations?.isStoreOpen !== false,
    closedMessage: config?.operations?.closedMessage || "We're closed right now.",
    messageHeader: config?.whatsappMessage?.header || '🛒 *New Order from {{shopName}}*',
    messageFooter: config?.whatsappMessage?.footer || 'Thank you for shopping with us!',
  });

  useEffect(() => {
    if (authed && tab === 'Orders') fetchOrders();
  }, [authed, tab]);

  // ── PIN verify ──────────────────────────────────────────────────────────────
  const verifyPin = async () => {
    try {
      const res = await fetch(`${BASE}/api/business/verify-admin-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        sessionStorage.setItem(ADMIN_PIN_KEY, '1');
        setAuthed(true);
      } else {
        setPinError('Incorrect PIN');
        setPin('');
      }
    } catch {
      // Fallback: check against config pin if server unstable
      if (pin === (config?.adminPin || '1234')) {
        sessionStorage.setItem(ADMIN_PIN_KEY, '1');
        setAuthed(true);
      } else {
        setPinError('Incorrect PIN');
        setPin('');
      }
    }
  };

  const updateSetting = (k, v) => setSettings(s => ({ ...s, [k]: v }));

  // ── Save settings ───────────────────────────────────────────────────────────
  const saveSettings = async () => {
    setSaving(true);
    setSaveMsg('');
    const newConfig = {
      ...config,
      shopName: settings.shopName,
      shopTagline: settings.shopTagline,
      whatsappNumber: settings.whatsappNumber,
      brandColor: settings.brandColor,
      delivery: { ...config?.delivery, fee: Number(settings.deliveryFee), freeAbove: Number(settings.freeAbove), enabled: true },
      operations: { ...config?.operations, isStoreOpen: settings.isStoreOpen, closedMessage: settings.closedMessage },
      whatsappMessage: { ...config?.whatsappMessage, header: settings.messageHeader, footer: settings.messageFooter, estimatedDeliveryHours: Number(settings.estimatedDeliveryHours) },
    };
    try {
      // Update local state immediately
      updateConfig(newConfig);
      // Persist to server (requires auth token — use admin session)
      await fetch(`${BASE}/api/business/store-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('sy_admin_token') || ''}` },
        body: JSON.stringify({ storeConfig: newConfig }),
      });
      setSaveMsg('✓ Saved successfully');
    } catch {
      setSaveMsg('✓ Saved locally (server sync pending)');
    } finally {
      setSaving(false);
    }
  };

  // ── Fetch web orders ────────────────────────────────────────────────────────
  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch(`${BASE}/api/store/${slug}/orders?limit=30`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch { } finally {
      setOrdersLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    await fetch(`${BASE}/api/store/${slug}/orders/${orderId}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchOrders();
  };

  // ── PIN screen ──────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="s-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 200 }} onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="s-modal-box" style={{ padding: 28, maxWidth: 340 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🔐</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700 }}>Admin Panel</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Enter your admin PIN to continue</div>
          </div>
          <input className="s-input" type="password" maxLength={6} placeholder="Enter PIN" value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifyPin()} style={{ textAlign: 'center', letterSpacing: 8, fontSize: 20, marginBottom: 14 }} />
          {pinError && <div style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600, textAlign: 'center', marginBottom: 10 }}>⚠ {pinError}</div>}
          <button className="s-btn s-btn-primary s-btn-lg s-btn-full" onClick={verifyPin} disabled={!pin}>Unlock</button>
        </div>
      </div>
    );
  }

  return (
    <div className="s-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 200 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="s-modal-box" style={{ maxWidth: 520, width: '100%', maxHeight: '90dvh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20 }}>⚙️ Admin Panel</div>
          <button className="s-btn s-btn-ghost s-btn-icon" onClick={onClose}><CloseIcon /></button>
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '10px 4px', fontSize: 12, fontWeight: 700,
              borderBottom: `2px solid ${tab === t ? 'var(--brand)' : 'transparent'}`,
              color: tab === t ? 'var(--brand)' : 'var(--text-3)',
              background: 'transparent', cursor: 'pointer', transition: 'color 0.15s',
            }}>{t}</button>
          ))}
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: 18 }}>

          {/* ── Settings ────────────────────────────────────────────────────── */}
          {tab === 'Settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Store Open/Close */}
              <div style={{ background: settings.isStoreOpen ? 'var(--success-dim)' : 'var(--danger-dim)', borderRadius: 'var(--radius)', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: settings.isStoreOpen ? 'var(--success)' : 'var(--danger)' }}>
                    {settings.isStoreOpen ? '🟢 Store is OPEN' : '🔴 Store is CLOSED'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Customers can {settings.isStoreOpen ? 'browse and order' : 'see your products but not order'}</div>
                </div>
                <div
                  onClick={() => updateSetting('isStoreOpen', !settings.isStoreOpen)}
                  style={{ width: 52, height: 28, borderRadius: 14, background: settings.isStoreOpen ? 'var(--brand)' : 'var(--surface-3)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  <div style={{ position: 'absolute', top: 3, left: settings.isStoreOpen ? 26 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </div>
              </div>

              <div><label className="s-label">Shop Name</label><input className="s-input" value={settings.shopName} onChange={e => updateSetting('shopName', e.target.value)} /></div>
              <div><label className="s-label">Tagline</label><input className="s-input" value={settings.shopTagline} onChange={e => updateSetting('shopTagline', e.target.value)} /></div>
              <div><label className="s-label">WhatsApp Number (international, no +)</label><input className="s-input" placeholder="254712345678" value={settings.whatsappNumber} onChange={e => updateSetting('whatsappNumber', e.target.value)} /></div>
              <div><label className="s-label">Brand Color</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input type="color" value={settings.brandColor} onChange={e => updateSetting('brandColor', e.target.value)} style={{ width: 44, height: 44, borderRadius: 'var(--radius)', border: '2px solid var(--border-md)', cursor: 'pointer' }} />
                  <input className="s-input" style={{ flex: 1 }} value={settings.brandColor} onChange={e => updateSetting('brandColor', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}><label className="s-label">Delivery Fee (KES)</label><input className="s-input" type="number" value={settings.deliveryFee} onChange={e => updateSetting('deliveryFee', e.target.value)} /></div>
                <div style={{ flex: 1 }}><label className="s-label">Free above (KES)</label><input className="s-input" type="number" value={settings.freeAbove} onChange={e => updateSetting('freeAbove', e.target.value)} /></div>
              </div>
              <div><label className="s-label">Estimated Delivery (hours)</label><input className="s-input" type="number" min={1} value={settings.estimatedDeliveryHours} onChange={e => updateSetting('estimatedDeliveryHours', e.target.value)} /></div>
              <div><label className="s-label">WhatsApp Message Header</label><input className="s-input" value={settings.messageHeader} onChange={e => updateSetting('messageHeader', e.target.value)} /></div>
              <div><label className="s-label">WhatsApp Message Footer</label><textarea className="s-input" rows={2} value={settings.messageFooter} onChange={e => updateSetting('messageFooter', e.target.value)} style={{ resize: 'none' }} /></div>
              <div><label className="s-label">Closed Message</label><input className="s-input" value={settings.closedMessage} onChange={e => updateSetting('closedMessage', e.target.value)} /></div>

              {saveMsg && <div style={{ color: 'var(--brand)', fontSize: 13, fontWeight: 600 }}>{saveMsg}</div>}
              <button className="s-btn s-btn-primary s-btn-lg s-btn-full" onClick={saveSettings} disabled={saving}>
                {saving ? '⏳ Saving…' : '💾 Save Settings'}
              </button>
            </div>
          )}

          {/* ── Products ─────────────────────────────────────────────────────── */}
          {tab === 'Products' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontWeight: 700 }}>{products.length} products</div>
                <button className="s-btn s-btn-ghost s-btn-sm" onClick={loadStore}>🔄 Sync from POS</button>
              </div>
              {products.map(p => (
                <div key={p.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>{p.emoji || '📦'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatCurrency(p.price, currency)} · Stock: {p.stock}</div>
                  </div>
                  <div>
                    {p.stock <= 0
                      ? <span className="s-badge s-badge-danger">OOS</span>
                      : p.stock <= 5
                      ? <span className="s-badge s-badge-warn">Low</span>
                      : <span className="s-badge s-badge-success">OK</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Orders ───────────────────────────────────────────────────────── */}
          {tab === 'Orders' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontWeight: 700 }}>Web Orders</div>
                <button className="s-btn s-btn-ghost s-btn-sm" onClick={fetchOrders}>🔄 Refresh</button>
              </div>
              {ordersLoading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><div className="s-spinner" /></div>
                : orders.length === 0 ? <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>No web orders yet.</div>
                : orders.map(order => (
                  <div key={order.id} style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: 14, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{order.referenceId}</div>
                      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--brand)', fontSize: 14 }}>{formatCurrency(order.total, currency)}</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                      {order.customer?.name} · {order.customer?.phone} · {formatDateShort(order.createdAt)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>📍 {order.deliveryLocation}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {['pending','confirmed','out_for_delivery','delivered','cancelled'].map(s => (
                        <button
                          key={s}
                          onClick={() => updateOrderStatus(order.id, s)}
                          style={{
                            padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
                            background: order.status === s ? (ORDER_STATUS_COLOR[s] || '#888') : 'var(--surface-3)',
                            color: order.status === s ? '#fff' : 'var(--text-3)',
                          }}
                        >
                          {ORDER_STATUS_LABEL[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* ── Analytics ────────────────────────────────────────────────────── */}
          {tab === 'Analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Page Views', value: analytics.pageViews || 0, icon: '👁' },
                { label: 'Orders Placed', value: analytics.ordersPlaced || 0, icon: '🛍️' },
                { label: 'Total Revenue', value: formatCurrency(analytics.totalRevenue || 0, currency), icon: '💰' },
              ].map(kpi => (
                <div key={kpi.label} style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 28 }}>{kpi.icon}</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</div>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800 }}>{kpi.value}</div>
                  </div>
                </div>
              ))}
              <div style={{ fontWeight: 700, marginTop: 8, marginBottom: 6 }}>Top Products (Cart Adds)</div>
              {Object.entries(analytics.cartAdds || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, count]) => {
                const p = products.find(x => x.id === id);
                return (
                  <div key={id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-2)' }}>
                    <span>{p ? `${p.emoji || '📦'} ${p.name}` : id}</span>
                    <span style={{ fontWeight: 700, color: 'var(--brand)' }}>{count} adds</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
