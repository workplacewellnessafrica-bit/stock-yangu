// src/storefront/components/ProductCard.jsx

import { useShop } from '../context/ShopContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { formatCurrency, stockStatus } from '../utils/formatters.js';

export default function ProductCard({ product, onViewDetail }) {
  const { config, recordEvent } = useShop();
  const { addToCart } = useCart();
  const currency = config?.currency || { symbol: 'KES', locale: 'en-KE' };
  const threshold = config?.inventory?.lowStockThreshold || 5;
  const status = stockStatus(product.stock, threshold);
  const isOut = status.level === 'out';

  const hasImage = product.images?.length > 0;

  const handleAdd = (e) => {
    e.stopPropagation();
    if (isOut) return;
    // If product has variants, open detail to let user pick one
    if (product.variants?.length > 0) { onViewDetail(product); return; }
    addToCart(product, null, 1);
    recordEvent('cartAdd', { productId: product.id });
  };

  const handleOpen = () => {
    onViewDetail(product);
    recordEvent('productView', { productId: product.id });
  };

  return (
    <div className="s-product-card" onClick={handleOpen}>
      {/* Image / Emoji */}
      <div className="s-card-img">
        {hasImage ? (
          <img src={product.images[0]} alt={product.name} loading="lazy" />
        ) : (
          <span className="s-card-emoji">{product.emoji || '📦'}</span>
        )}
        {isOut && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="s-badge s-badge-danger" style={{ fontSize: 12 }}>Out of Stock</span>
          </div>
        )}
      </div>

      {/* Stock warning */}
      {status.level === 'low' && (
        <span className="s-stock-tag s-badge-warn" style={{ fontSize: 9, padding: '2px 6px', background: 'var(--warn-dim)', color: 'var(--warn)' }}>
          ⚡ {status.label}
        </span>
      )}

      {/* Info */}
      <div className="s-card-body">
        <div className="s-card-name">{product.name}</div>
        <div className="s-card-price">{formatCurrency(product.price, currency)}</div>
        {product.unit && <div className="s-card-unit">per {product.unit}</div>}
        {product.variants?.length > 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
            {product.variants.length} size{product.variants.length > 1 ? 's' : ''} available
          </div>
        )}
      </div>

      {/* Add to Cart */}
      <button
        className={`s-card-add${isOut ? ' out' : ''}`}
        onClick={handleAdd}
        disabled={isOut}
      >
        {isOut ? '✕ Out of Stock' : product.variants?.length > 0 ? '👁 View Options' : '＋ Add to Cart'}
      </button>
    </div>
  );
}
