// src/storefront/components/ProductModal.jsx

import { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { formatCurrency, stockStatus } from '../utils/formatters.js';

const CloseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const MinusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const PlusIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

export default function ProductModal({ product, onClose }) {
  const { config, recordEvent } = useShop();
  const { addToCart } = useCart();
  const currency = config?.currency || { symbol: 'KES', locale: 'en-KE' };
  const threshold = config?.inventory?.lowStockThreshold || 5;

  const hasVariants = product.variants?.length > 0;
  const [selectedVariant, setSelectedVariant] = useState(hasVariants ? product.variants[0] : null);
  const [quantity, setQuantity] = useState(1);
  const [imgIndex, setImgIndex] = useState(0);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const images = product.images?.length ? product.images : [];
  const effectivePrice = selectedVariant?.price ?? product.price;
  const effectiveStock = product.stock; // All variants share the same item stock
  const status = stockStatus(effectiveStock, threshold);
  const isOut = status.level === 'out';

  useEffect(() => { setQuantity(1); }, [selectedVariant]);
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [onClose]);

  const handleAdd = () => {
    if (isOut) return;
    addToCart(product, selectedVariant, quantity);
    recordEvent('cartAdd', { productId: product.id });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1600);
  };

  const clamp = v => Math.min(Math.max(1, v), effectiveStock);

  return (
    <div
      className="s-overlay"
      style={{ display: 'flex', alignItems: 'flex-end' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="s-sheet" style={{ maxHeight: '92dvh' }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'sticky', top: 12, float: 'right', marginRight: 12, zIndex: 2,
          width: 36, height: 36, borderRadius: 'var(--radius-full)',
          background: 'var(--surface-3)', color: 'var(--text-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--border-md)',
        }}>
          <CloseIcon />
        </button>

        {/* Image gallery */}
        <div style={{ position: 'relative', background: 'var(--surface-2)', aspectRatio: '4/3', overflow: 'hidden' }}>
          {images.length > 0 ? (
            <img src={images[imgIndex]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>
              {product.emoji || '📦'}
            </div>
          )}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setImgIndex(i => Math.max(0, i - 1))}
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >‹</button>
              <button
                onClick={() => setImgIndex(i => Math.min(images.length - 1, i + 1))}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >›</button>
            </>
          )}
          {isOut && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="s-badge s-badge-danger" style={{ fontSize: 15, padding: '8px 20px' }}>Out of Stock</span>
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div style={{ display: 'flex', gap: 6, padding: '8px 14px', overflowX: 'auto', background: 'var(--surface-2)' }}>
            {images.map((url, i) => (
              <img key={i} src={url} alt={`View ${i + 1}`} onClick={() => setImgIndex(i)}
                style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 'var(--radius)', cursor: 'pointer', border: `2px solid ${i === imgIndex ? 'var(--brand)' : 'transparent'}`, flexShrink: 0 }}
              />
            ))}
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '16px 16px 32px' }}>
          {product.sku && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.6px' }}>SKU: {product.sku}</div>}
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{product.name}</h2>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
              {product.tags.map(t => (
                <span key={t} style={{ padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 500, background: 'var(--surface-3)', color: 'var(--text-3)' }}>{t}</span>
              ))}
            </div>
          )}

          {/* Stock */}
          <div style={{ marginBottom: 10 }}>
            {status.level === 'out' && <span className="s-badge s-badge-danger">Out of Stock</span>}
            {status.level === 'low' && <span className="s-badge s-badge-warn">⚡ {status.label}</span>}
            {status.level === 'ok'  && <span className="s-badge s-badge-success">✓ In Stock ({effectiveStock} available)</span>}
          </div>

          {/* Price */}
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700, color: 'var(--brand)', marginBottom: 4 }}>
            {formatCurrency(effectivePrice, currency)}
          </div>
          {product.unit && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>per {product.unit}</div>}

          {/* Description */}
          {product.description && (
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.65, marginBottom: 16 }}>{product.description}</p>
          )}

          {/* Variants (priceTiers) */}
          {hasVariants && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Size / Quantity</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {product.variants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    style={{
                      padding: '7px 16px', borderRadius: 'var(--radius)',
                      border: `1.5px solid ${selectedVariant?.id === v.id ? 'var(--brand)' : 'var(--border-md)'}`,
                      background: selectedVariant?.id === v.id ? 'var(--brand-dim)' : 'transparent',
                      color: selectedVariant?.id === v.id ? 'var(--brand)' : 'var(--text-2)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
                    }}
                  >
                    {v.name} — {formatCurrency(v.price, currency)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          {!isOut && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Quantity</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', border: '1.5px solid var(--border-md)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  <button onClick={() => setQuantity(q => clamp(q - 1))} style={{ padding: '9px 14px', background: 'var(--surface-2)', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}><MinusIcon /></button>
                  <span style={{ padding: '9px 20px', fontWeight: 700, fontSize: 15, borderLeft: '1px solid var(--border-md)', borderRight: '1px solid var(--border-md)', minWidth: 52, textAlign: 'center' }}>{quantity}</span>
                  <button onClick={() => setQuantity(q => clamp(q + 1))} style={{ padding: '9px 14px', background: 'var(--surface-2)', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}><PlusIcon /></button>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Max: {effectiveStock}</span>
              </div>
            </div>
          )}

          {/* CTA */}
          <button
            className={`s-btn s-btn-primary s-btn-lg s-btn-full`}
            style={{
              background: addedFeedback ? '#16a34a' : isOut ? 'var(--surface-3)' : 'var(--brand)',
              color: isOut ? 'var(--text-muted)' : '#fff',
              transition: 'all 0.2s',
            }}
            disabled={isOut}
            onClick={handleAdd}
          >
            {isOut ? 'Out of Stock'
              : addedFeedback ? `✓ Added ${quantity} to Cart!`
              : `Add ${quantity > 1 ? `${quantity} × ` : ''}to Cart — ${formatCurrency(effectivePrice * quantity, currency)}`
            }
          </button>
        </div>
      </div>
    </div>
  );
}
