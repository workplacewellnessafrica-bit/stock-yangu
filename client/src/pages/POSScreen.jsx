import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { usePosStore, useInventoryStore } from '../stores/posStore';
import { useUIStore, t } from '../stores/uiStore';
import api from '../api/client';

// ─── Measure Modal ─────────────────────────────────────────────────────────
function MeasureModal({ item, onClose, onAdd }) {
  const { lang } = useUIStore();
  const [selected, setSelected] = useState(null);

  const tiers = item.priceTiers?.length > 0
    ? item.priceTiers
    : [{ qty: 1, label: `1 ${item.unit}`, price: item.sellPrice }];

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="sheet" style={{ padding: '0 0 16px' }}>
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ width: 40, height: 4, background: 'var(--border-md)', borderRadius: 2, margin: '0 auto 20px' }} />
          <div className="flex items-center gap-14" style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 52 }}>{item.emoji}</span>
            <div>
              <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800 }}>{item.name}</h3>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                {t('stock', lang)}: {item.stock} {item.unit}
                {item.stock <= item.threshold && (
                  <span style={{ color: 'var(--warn)', marginLeft: 8 }}>⚠️ Low stock</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, padding: '0 20px 20px' }}>
          {tiers.map((tier, i) => (
            <button
              key={i}
              onClick={() => setSelected(tier)}
              style={{
                padding: '18px 12px',
                borderRadius: 'var(--radius-lg)',
                border: `2px solid ${selected === tier ? 'var(--primary)' : 'var(--border-md)'}`,
                background: selected === tier ? 'var(--primary-dim)' : 'var(--surface-2)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 22, color: selected === tier ? 'var(--primary)' : 'var(--text)' }}>
                KES {tier.price}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{tier.label}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: '0 20px' }}>
          <button
            className="btn btn-primary btn-lg btn-full"
            disabled={!selected}
            onClick={() => { onAdd(item, selected); onClose(); }}
          >
            ➕ Add to {t('cart', lang)}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Payment Modal ──────────────────────────────────────────────────────────
function PayModal({ onClose }) {
  const { cart, cartTotal, paymentMethod, setPaymentMethod, clearCart } = usePosStore();
  const { staffSession } = useAuthStore();
  const { toast, lang } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const total = cartTotal();

  async function handleConfirm() {
    setLoading(true);
    try {
      for (const line of cart) {
        await api.post('/sales', {
          itemId: line.item.id,
          qty: line.qty,
          unit: line.unit,
          unitPrice: line.unitPrice,
          paymentMethod,
          staffId: staffSession?.staffId || undefined,
        });
      }
      clearCart();
      setDone(true);
      toast(t('sold', lang), 'success');
      setTimeout(onClose, 1800);
    } catch (err) {
      toast(err.response?.data?.error || 'Sale failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <>
        <div className="overlay" />
        <div className="modal"><div className="modal-box" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800 }}>{t('sold', lang)}</div>
          <div style={{ color: 'var(--text-3)', marginTop: 8 }}>KES {total.toFixed(0)}</div>
        </div></div>
      </>
    );
  }

  const payMethods = [
    { value: 'cash',   emoji: '💵', label: t('cash', lang),  cls: 'cash-opt' },
    { value: 'mpesa',  emoji: '📱', label: 'M-Pesa',          cls: 'mpesa-opt' },
    { value: 'card',   emoji: '💳', label: 'Card',            cls: 'card-opt' },
  ];

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="sheet" style={{ padding: '20px 20px 24px' }}>
        <div style={{ width: 40, height: 4, background: 'var(--border-md)', borderRadius: 2, margin: '0 auto 24px' }} />

        <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
          {t('confirm', lang)} Payment
        </h3>
        <div style={{ fontSize: 36, fontFamily: 'var(--font-head)', fontWeight: 900, color: 'var(--primary)', marginBottom: 24 }}>
          KES {total.toFixed(0)}
        </div>

        {/* Cart summary */}
        <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius)', marginBottom: 20 }}>
          {cart.map(line => (
            <div key={line.id} className="flex items-center justify-between" style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13 }}>{line.item.emoji} {line.item.name} × {line.qty}</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>KES {line.total}</span>
            </div>
          ))}
        </div>

        {/* Payment method */}
        <div className="flex gap-2" style={{ marginBottom: 20 }}>
          {payMethods.map(p => (
            <button key={p.value}
              onClick={() => setPaymentMethod(p.value)}
              className={`pay-option ${paymentMethod === p.value ? 'selected' : ''} ${p.cls}`}
            >
              <span style={{ fontSize: 26 }}>{p.emoji}</span>
              <span className="pay-label">{p.label}</span>
            </button>
          ))}
        </div>

        <button className="btn btn-primary btn-lg btn-full" onClick={handleConfirm} disabled={loading}>
          {loading
            ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Processing…</>
            : `✅ Confirm ${paymentMethod === 'mpesa' ? '📱 M-Pesa' : paymentMethod === 'card' ? '💳 Card' : '💵 Cash'}`}
        </button>
      </div>
    </>
  );
}

// ─── POS Screen ─────────────────────────────────────────────────────────────
export default function POSScreen() {
  const { lang } = useUIStore();
  const { items, categories, activeCategory, searchQuery, filteredItems, setCategory, setSearch, setItems, updateItemStock } = useInventoryStore();
  const { cart, addToCart, removeFromCart, cartTotal } = usePosStore();
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPay, setShowPay] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load items
  useEffect(() => {
    if (items.length > 0) return;
    setLoading(true);
    api.get('/items')
      .then(r => setItems(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const displayed = filteredItems();
  const total = cartTotal();

  const catLabels = {
    all: t('all', lang), vegetables: '🥬 Veg', dairy: '🥛 Dairy',
    basics: '🌾 Basics', drinks: '🥤 Drinks', toiletries: '🧴 Toiletries',
    meat: '🥩 Meat', electronics: '📱 Tech', clothing: '👕 Clothing', other: '📦 Other',
  };

  return (
    <div className="flex-col h-full overflow-hidden">
      {/* Search */}
      <div className="search-bar">
        <span style={{ color: 'var(--text-muted)' }}>🔍</span>
        <input
          placeholder={t('search', lang)}
          value={searchQuery}
          onChange={e => setSearch(e.target.value)}
        />
        {searchQuery && (
          <button onClick={() => setSearch('')} style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-head)', fontWeight: 700 }}>✕</button>
        )}
      </div>

      {/* Category tabs */}
      <div className="cat-tabs">
        {categories.map(cat => (
          <button key={cat} className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}>
            {catLabels[cat] || cat}
          </button>
        ))}
      </div>

      {/* Item grid — scrollable */}
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center" style={{ padding: 48, flexDirection: 'column', gap: 16 }}>
            <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
            <span style={{ color: 'var(--text-3)' }}>Loading inventory…</span>
          </div>
        )}
        {!loading && displayed.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <p>No items found</p>
          </div>
        )}
        <div className="item-grid">
          {displayed.map(item => (
            <button
              key={item.id}
              className={`item-tile ${item.stock <= item.threshold ? 'low-stock' : ''}`}
              onClick={() => setSelectedItem(item)}
            >
              <span className="item-emoji">{item.emoji}</span>
              <span className="item-name">{item.name}</span>
              <span className="item-price">KES {item.sellPrice}</span>
              {item.stock <= item.threshold && (
                <span className="item-stock-badge">LOW</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Cart bar */}
      {cart.length > 0 && (
        <div style={{
          padding: '12px 16px',
          background: 'var(--surface-2)',
          borderTop: '1px solid var(--border-md)',
          flexShrink: 0,
        }}>
          {/* Cart lines */}
          <div style={{ maxHeight: 120, overflowY: 'auto', marginBottom: 12 }}>
            {cart.map(line => (
              <div key={line.id} className="flex items-center justify-between" style={{ padding: '6px 0' }}>
                <span style={{ fontSize: 13, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {line.item.emoji} {line.item.name} × {line.qty}
                </span>
                <div className="flex items-center gap-2">
                  <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 13 }}>KES {line.total}</span>
                  <button onClick={() => removeFromCart(line.id)} style={{ color: 'var(--text-muted)', fontSize: 14 }}>✕</button>
                </div>
              </div>
            ))}
          </div>
          <button
            className="btn btn-primary btn-lg btn-full pulse-green"
            onClick={() => setShowPay(true)}
          >
            💳 {t('pay', lang)} KES {total.toFixed(0)} ({cart.length} item{cart.length !== 1 ? 's' : ''})
          </button>
        </div>
      )}

      {/* Modals */}
      {selectedItem && (
        <MeasureModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAdd={(item, tier) => addToCart(item, tier.qty, item.unit, tier.price)}
        />
      )}
      {showPay && <PayModal onClose={() => setShowPay(false)} />}
    </div>
  );
}
