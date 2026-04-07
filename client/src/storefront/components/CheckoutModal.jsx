// src/storefront/components/CheckoutModal.jsx
// Collects customer details, places order, opens WhatsApp, stores order history.

import { useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { useShop } from '../context/ShopContext.jsx';
import { useCustomer } from '../context/CustomerContext.jsx';
import { openWhatsApp } from '../utils/whatsapp.js';
import { formatCurrency } from '../utils/formatters.js';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const CloseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

export default function CheckoutModal({ deliveryFee, total, subtotal, onClose, onSuccess }) {
  const { items, clearCart, cartToken } = useCart();
  const { config, slug, deductStock, recordEvent } = useShop();
  const { setCustomerSession } = useCustomer();

  const currency = config?.currency || { symbol: 'KES', locale: 'en-KE' };

  const [form, setForm] = useState({ name: '', phone: '', location: '', note: '', paymentMethod: 'cash_on_delivery' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1 = form, 2 = summary/confirm

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleNext = () => {
    if (!form.name.trim()) { setError('Please enter your name.'); return; }
    if (!form.phone.trim() || form.phone.length < 9) { setError('Please enter a valid phone number.'); return; }
    if (!form.location.trim()) { setError('Please enter your delivery location.'); return; }
    setError('');
    setStep(2);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      const cartPayload = items.map(item => ({
        itemId: item.product.id,
        variantLabel: item.variant?.name || null,
        qty: item.quantity,
        unitPrice: item.price,
      }));

      const res = await fetch(`${BASE}/api/store/${slug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: cartPayload,
          customerName: form.name.trim(),
          customerPhone: form.phone.trim(),
          deliveryLocation: form.location.trim(),
          specialNote: form.note.trim() || null,
          paymentMethod: form.paymentMethod,
          cartToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Order failed. Please try again.'); return; }

      const { referenceId, customerToken, total: confirmedTotal } = data;

      // Save customer session
      setCustomerSession(customerToken, form.name.trim());

      // Deduct stock locally for instant UI update
      deductStock(items.map(i => ({ itemId: i.product.id, qty: i.quantity })));

      // Record analytics
      recordEvent('orderPlaced', { total: confirmedTotal });

      // Open WhatsApp
      openWhatsApp({
        cartItems: items,
        subtotal,
        deliveryFee,
        total: confirmedTotal,
        referenceId,
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        deliveryLocation: form.location.trim(),
        specialNote: form.note.trim() || null,
        config,
      });

      // Mark whatsapp sent (fire and forget)
      fetch(`${BASE}/api/store/${slug}/orders/${referenceId}/whatsapp`, { method: 'PATCH' }).catch(() => {});

      // Clear cart
      await clearCart();
      onSuccess();
    } catch (err) {
      setError('Connection error. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="s-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 120 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="s-modal-box" style={{ width: '100%', maxWidth: 440 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 18px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20 }}>
            {step === 1 ? '📋 Your Details' : '✅ Confirm Order'}
          </div>
          <button className="s-btn s-btn-ghost s-btn-icon" onClick={onClose}><CloseIcon /></button>
        </div>

        <div style={{ padding: '18px' }}>
          {step === 1 ? (
            /* ── Step 1: Customer Form ──────────────────────────── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="s-label">Full Name *</label>
                <input className="s-input" type="text" placeholder="e.g. Jane Wanjiku" value={form.name} onChange={e => update('name', e.target.value)} />
              </div>
              <div>
                <label className="s-label">Phone Number (WhatsApp) *</label>
                <input className="s-input" type="tel" placeholder="e.g. 0712 345 678" value={form.phone} onChange={e => update('phone', e.target.value)} />
              </div>
              <div>
                <label className="s-label">Delivery Location / Address *</label>
                <textarea className="s-input" rows={2} placeholder="e.g. Westlands, near Sarit Centre, House 4B" value={form.location} onChange={e => update('location', e.target.value)} style={{ resize: 'none' }} />
              </div>
              <div>
                <label className="s-label">Special Instructions (optional)</label>
                <textarea className="s-input" rows={2} placeholder="e.g. Call when arriving, gate code is 1234" value={form.note} onChange={e => update('note', e.target.value)} style={{ resize: 'none' }} />
              </div>
              <div>
                <label className="s-label">Payment Method</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['cash_on_delivery', 'mpesa_on_delivery'].map(method => (
                    <button
                      key={method}
                      onClick={() => update('paymentMethod', method)}
                      style={{
                        flex: 1, padding: '10px 12px', borderRadius: 'var(--radius)',
                        border: `1.5px solid ${form.paymentMethod === method ? 'var(--brand)' : 'var(--border-md)'}`,
                        background: form.paymentMethod === method ? 'var(--brand-dim)' : 'transparent',
                        color: form.paymentMethod === method ? 'var(--brand)' : 'var(--text-2)',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.13s',
                      }}
                    >
                      {method === 'cash_on_delivery' ? '💵 Cash on Delivery' : '📱 M-PESA on Delivery'}
                    </button>
                  ))}
                </div>
              </div>
              {error && <div style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>⚠ {error}</div>}
              <button className="s-btn s-btn-primary s-btn-lg s-btn-full" onClick={handleNext}>
                Next → Review Order
              </button>
            </div>
          ) : (
            /* ── Step 2: Summary ──────────────────────────────── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text-2)' }}>Order Summary</div>
                {items.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-2)' }}>
                      {item.product.emoji} {item.product.name}
                      {item.variant ? ` (${item.variant.name})` : ''} × {item.quantity}
                    </span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(item.price * item.quantity, currency)}</span>
                  </div>
                ))}
                <div className="s-divider" />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-2)', marginBottom: 4 }}>
                  <span>Subtotal</span><span>{formatCurrency(subtotal, currency)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-2)', marginBottom: 8 }}>
                  <span>Delivery</span><span style={{ color: deliveryFee === 0 ? 'var(--brand)' : undefined }}>{deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee, currency)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 18 }}>
                  <span>Total</span><span style={{ color: 'var(--brand)' }}>{formatCurrency(total, currency)}</span>
                </div>
              </div>

              <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: 14, fontSize: 13, lineHeight: 1.6, color: 'var(--text-2)' }}>
                <div><strong>👤</strong> {form.name} ({form.phone})</div>
                <div><strong>📍</strong> {form.location}</div>
                {form.note && <div><strong>📝</strong> {form.note}</div>}
                <div><strong>💳</strong> {form.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'M-PESA on Delivery'}</div>
              </div>

              <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                Clicking confirm will open WhatsApp with your order details.
              </div>

              {error && <div style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>⚠ {error}</div>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="s-btn s-btn-ghost" style={{ flex: 1 }} onClick={() => setStep(1)} disabled={loading}>← Edit</button>
                <button className="s-btn s-btn-primary s-btn-lg" style={{ flex: 2 }} onClick={handleConfirm} disabled={loading}>
                  {loading ? '⏳ Placing…' : '📱 Confirm & WhatsApp'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
