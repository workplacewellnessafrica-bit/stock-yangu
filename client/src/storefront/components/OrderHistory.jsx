// src/storefront/components/OrderHistory.jsx
// Shows the customer's past orders, accessible from the header.
// If not logged in, shows a phone-number lookup form.

import { useState, useEffect } from 'react';
import { useCustomer } from '../context/CustomerContext.jsx';
import { formatCurrency, formatDateShort, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '../utils/formatters.js';
import { useShop } from '../context/ShopContext.jsx';

const CloseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

export default function OrderHistory({ onClose }) {
  const { isLoggedIn, customerName, orders, ordersLoading, fetchOrders, loginByPhone, logout } = useCustomer();
  const { config } = useShop();
  const currency = config?.currency || { symbol: 'KES', locale: 'en-KE' };

  const [phone, setPhone] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    if (isLoggedIn) fetchOrders();
  }, [isLoggedIn]);

  const handleLogin = async () => {
    if (!phone.trim()) return;
    setLoginLoading(true);
    setLoginError('');
    try {
      await loginByPhone(phone.trim());
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="s-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="s-sheet" style={{ maxHeight: '92dvh' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 2 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20 }}>📋 My Orders</div>
            {isLoggedIn && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Hello, {customerName}</div>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {isLoggedIn && <button className="s-btn s-btn-ghost s-btn-sm" onClick={logout} style={{ color: 'var(--danger)', fontSize: 12 }}>Sign Out</button>}
            <button className="s-btn s-btn-ghost s-btn-icon" onClick={onClose}><CloseIcon /></button>
          </div>
        </div>

        {!isLoggedIn ? (
          /* ── Phone lookup ─────────────────────────────── */
          <div style={{ padding: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📱</div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Track Your Orders</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Enter the phone number you used when placing an order.</div>
            </div>
            <label className="s-label">Phone Number</label>
            <input
              className="s-input"
              type="tel"
              placeholder="e.g. 0712 345 678"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ marginBottom: 14 }}
            />
            {loginError && <div style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>⚠ {loginError}</div>}
            <button className="s-btn s-btn-primary s-btn-lg s-btn-full" onClick={handleLogin} disabled={loginLoading || !phone.trim()}>
              {loginLoading ? '⏳ Looking up…' : '🔍 View My Orders'}
            </button>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', marginTop: 12 }}>
              No account? Place an order first — your account is created automatically.
            </div>
          </div>
        ) : ordersLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="s-spinner" />
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>No orders yet</div>
          </div>
        ) : (
          /* ── Order list ───────────────────────────────── */
          <div style={{ padding: '14px 16px' }}>
            {orders.map(order => {
              const isExpanded = expandedOrder === order.id;
              const statusColor = ORDER_STATUS_COLOR[order.status] || 'var(--text-3)';
              return (
                <div
                  key={order.id}
                  style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', marginBottom: 12, border: '1px solid var(--border)', overflow: 'hidden' }}
                >
                  <div
                    style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div>
                      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{order.referenceId}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{formatDateShort(order.createdAt)}</div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>
                        {ORDER_STATUS_LABEL[order.status] || order.status}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 16, color: 'var(--brand)' }}>
                        {formatCurrency(order.total, currency)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </div>
                      <div style={{ fontSize: 18, marginTop: 4 }}>{isExpanded ? '▲' : '▼'}</div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
                      {order.items.map((oi, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, color: 'var(--text-2)' }}>
                          <span>{oi.emoji} {oi.name}{oi.variantLabel ? ` (${oi.variantLabel})` : ''} × {oi.qty}</span>
                          <span style={{ fontWeight: 600 }}>{formatCurrency(oi.total, currency)}</span>
                        </div>
                      ))}
                      <div className="s-divider" />
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        <div>📍 {order.deliveryLocation}</div>
                        {order.specialNote && <div>📝 {order.specialNote}</div>}
                        <div>💳 {order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'M-PESA on Delivery'}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <button className="s-btn s-btn-ghost s-btn-sm" onClick={() => fetchOrders()} style={{ marginTop: 8 }}>
              🔄 Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
