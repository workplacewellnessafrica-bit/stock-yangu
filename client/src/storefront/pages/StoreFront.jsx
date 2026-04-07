// src/storefront/pages/StoreFront.jsx
// Main public storefront page — assembles header, grid, cart, modals.

import { useState } from 'react';
import { useShop } from '../context/ShopContext.jsx';
import { useCart } from '../context/CartContext.jsx';

import StoreHeader   from '../components/StoreHeader.jsx';
import ProductCard   from '../components/ProductCard.jsx';
import ProductModal  from '../components/ProductModal.jsx';
import FilterSidebar from '../components/FilterSidebar.jsx';
import CartDrawer    from '../components/CartDrawer.jsx';
import OrderHistory  from '../components/OrderHistory.jsx';
import AdminPanel    from '../components/AdminPanel.jsx';

export default function StoreFront() {
  const { config, isLoading, error, filteredProducts, categories, products, posStatus } = useShop();
  const { itemCount, toggleCart } = useCart();

  const [theme, setTheme]           = useState(() => (localStorage.getItem('sy_store_theme') || 'light'));
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [adminOpen, setAdminOpen]   = useState(false);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('sy_store_theme', next);
  };

  const storeConfig = config || {};
  const isOpen = storeConfig?.operations?.isStoreOpen !== false;
  const listed = filteredProducts();

  // Apply brand color as CSS custom property
  const brandCss = storeConfig.brandColor
    ? { '--brand': storeConfig.brandColor, '--brand-dim': `${storeConfig.brandColor}20` }
    : {};

  return (
    <div className={`store-theme`} data-theme={theme} style={{ ...brandCss, minHeight: '100dvh' }}>
      {/* Closed banner */}
      {!isOpen && (
        <div className="s-closed-banner">
          🔴 {storeConfig?.operations?.closedMessage || "We're currently closed. Check back soon!"}
        </div>
      )}

      {/* Header */}
      <StoreHeader
        theme={theme}
        onToggleTheme={toggleTheme}
        onFilterOpen={() => setFilterOpen(true)}
        onOrdersOpen={() => setOrdersOpen(true)}
        onAdminOpen={() => setAdminOpen(true)}
      />

      {/* Body layout */}
      <div className="s-layout">
        {/* Desktop sidebar filter */}
        <FilterSidebar isOpen={false} onClose={() => {}} />

        {/* Main content */}
        <main>
          {/* Category chip row */}
          {categories.length > 0 && (
            <div className="s-chips">
              <button
                className={`s-chip${!useShop.activeFilters?.category ? ' active' : ''}`}
                onClick={() => useShop.setFilter?.({ category: null, subcategory: null })}
              >
                🏪 All
              </button>
              {categories.map(cat => (
                <CategoryChip key={cat.id} cat={cat} />
              ))}
            </div>
          )}

          {/* Loading skeleton */}
          {isLoading ? (
            <div className="s-product-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="s-card">
                  <div className="s-skeleton" style={{ aspectRatio: 1, borderRadius: 'var(--radius-lg)' }} />
                  <div style={{ padding: 10 }}>
                    <div className="s-skeleton" style={{ height: 14, borderRadius: 4, marginBottom: 8 }} />
                    <div className="s-skeleton" style={{ height: 18, borderRadius: 4, width: '60%', marginBottom: 8 }} />
                    <div className="s-skeleton" style={{ height: 36, borderRadius: 'var(--radius)', marginTop: 8 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : error && products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, marginBottom: 8 }}>Store Not Found</div>
              <div style={{ fontSize: 14 }}>This store link may be incorrect or the shop is offline.</div>
            </div>
          ) : listed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, marginBottom: 8 }}>No Products Found</div>
              <div style={{ fontSize: 14 }}>Try adjusting your search or filters.</div>
            </div>
          ) : (
            <>
              {/* POS sync indicator */}
              {posStatus === 'syncing' && (
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', padding: '6px 0' }}>
                  🔄 Syncing inventory…
                </div>
              )}
              <div className="s-product-grid">
                {listed.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onViewDetail={setSelectedProduct}
                  />
                ))}
              </div>
            </>
          )}

          {/* Footer */}
          <div style={{ textAlign: 'center', padding: '32px 16px 80px', color: 'var(--text-muted)', fontSize: 12 }}>
            {storeConfig.shopName && (
              <div style={{ marginBottom: 4, fontWeight: 600 }}>{storeConfig.shopName}</div>
            )}
            <div>Powered by <strong>Stock Yangu</strong></div>
          </div>
        </main>
      </div>

      {/* Cart FAB (mobile) */}
      {itemCount > 0 && (
        <button className="s-cart-fab" onClick={toggleCart}>
          🛒
          <span className="s-cart-count">{itemCount}</span>
        </button>
      )}

      {/* Overlays */}
      {filterOpen && (
        <FilterSidebar isOpen={filterOpen} onClose={() => setFilterOpen(false)} />
      )}
      <CartDrawer />
      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
      {ordersOpen && <OrderHistory onClose={() => setOrdersOpen(false)} />}
      {adminOpen  && <AdminPanel  onClose={() => setAdminOpen(false)} />}
    </div>
  );
}

// Separate chip component so it can call useShop without prop drilling
function CategoryChip({ cat }) {
  const { activeFilters, setFilter } = useShop();
  const isActive = activeFilters.category === cat.id;
  return (
    <button
      className={`s-chip${isActive ? ' active' : ''}`}
      onClick={() => setFilter({ category: isActive ? null : cat.id, subcategory: null })}
    >
      {cat.icon} {cat.name}
    </button>
  );
}
