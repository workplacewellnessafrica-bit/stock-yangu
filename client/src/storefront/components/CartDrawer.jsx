// src/storefront/components/CartDrawer.jsx

import { useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { useShop } from '../context/ShopContext.jsx';
import { formatCurrency } from '../utils/formatters.js';
import CheckoutModal from './CheckoutModal.jsx';

const TrashIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const CloseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, subtotal, clearCart } = useCart();
  const { config } = useShop();
  const [showCheckout, setShowCheckout] = useState(false);

  const currency = config?.currency || { symbol: 'KES', locale: 'en-KE' };
  const deliveryCfg = config?.delivery || {};
  const deliveryEnabled = deliveryCfg.enabled !== false;
  const freeAbove = deliveryCfg.freeAbove || 0;
  const deliveryFee = deliveryEnabled && subtotal < freeAbove ? (deliveryCfg.fee || 0) : 0;
  const total = subtotal + deliveryFee;

  if (!isOpen) return null;

  return (
    <>
      <div className="s-overlay" onClick={closeCart}>
        <div
          className="s-sheet"
          style={{ maxHeight: '92dvh', width: '100%' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px', position: 'sticky', top: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', zIndex: 2 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20 }}>
              🛒 Your Cart
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {items.length > 0 && (
                <button className="s-btn s-btn-ghost s-btn-sm" onClick={clearCart} style={{ color: 'var(--danger)', fontSize: 12 }}>Clear</button>
              )}
              <button className="s-btn s-btn-ghost s-btn-icon" onClick={closeCart}><CloseIcon /></button>
            </div>
          </div>

          {/* Empty */}
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🛒</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Your cart is empty</div>
              <div style={{ fontSize: 14 }}>Browse products and add them here.</div>
            </div>
          ) : (
            <>
              {/* Items */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {items.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                    {/* Thumbnail */}
                    <div style={{ width: 54, height: 54, background: 'var(--surface-2)', borderRadius: 'var(--radius)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.product.images?.[0] ? (
                        <img src={item.product.images[0]} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 28 }}>{item.product.emoji || '📦'}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.product.name}
                        {item.variant && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> ({item.variant.name})</span>}
                      </div>
                      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, color: 'var(--brand)', marginTop: 2 }}>
                        {formatCurrency(item.price * item.quantity, currency)}
                      </div>

                      {/* Qty stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                        <button
                          onClick={() => updateQty(item.id, item.quantity - 1, item.product, item.variant)}
                          style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-md)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}
                        >−</button>
                        <span style={{ fontWeight: 700, fontSize: 14, minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1, item.product, item.variant)}
                          style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-md)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}
                        >+</button>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatCurrency(item.price, currency)} each</span>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{ color: 'var(--danger)', opacity: 0.7, padding: 8, flexShrink: 0 }}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ padding: '14px 16px', background: 'var(--surface)', borderTop: '1px solid var(--border-md)', position: 'sticky', bottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-2)', marginBottom: 6 }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(subtotal, currency)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-2)', marginBottom: 8 }}>
                  <span>🚚 Delivery</span>
                  <span style={{ fontWeight: 600, color: deliveryFee === 0 ? 'var(--brand)' : 'var(--text)' }}>
                    {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee, currency)}
                  </span>
                </div>
                {deliveryFee > 0 && freeAbove > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, textAlign: 'center' }}>
                    Add {formatCurrency(freeAbove - subtotal, currency)} more for free delivery
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 20, marginBottom: 14 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--brand)' }}>{formatCurrency(total, currency)}</span>
                </div>
                <button
                  className="s-btn s-btn-primary s-btn-lg s-btn-full"
                  onClick={() => setShowCheckout(true)}
                >
                  📦 Place Order via WhatsApp
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showCheckout && (
        <CheckoutModal
          deliveryFee={deliveryFee}
          total={total}
          subtotal={subtotal}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => { setShowCheckout(false); closeCart(); }}
        />
      )}
    </>
  );
}
