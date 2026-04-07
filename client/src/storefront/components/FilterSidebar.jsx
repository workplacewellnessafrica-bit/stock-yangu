// src/storefront/components/FilterSidebar.jsx
// Works as a fixed sidebar on desktop, and a bottom sheet on mobile.

import { useShop } from '../context/ShopContext.jsx';
import { formatCurrency } from '../utils/formatters.js';

const SORT_OPTIONS = [
  { value: 'default',    label: 'Default' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'name',       label: 'Name A–Z' },
  { value: 'newest',     label: 'Newest First' },
];

export default function FilterSidebar({ isOpen, onClose }) {
  const { categories, products, activeFilters, setFilter, clearFilters, config, filteredProducts } = useShop();
  const currency = config?.currency || { symbol: 'KES', locale: 'en-KE' };
  const filtered = filteredProducts();

  // Price range from all products
  const allPrices = products.map(p => p.price);
  const globalMin = Math.floor(Math.min(...allPrices, 0));
  const globalMax = Math.ceil(Math.max(...allPrices, 0));

  // Collect all unique tags
  const allTags = [...new Set(products.flatMap(p => p.tags || []))].sort();

  const hasFilters = activeFilters.category || activeFilters.subcategory ||
    activeFilters.priceMin !== null || activeFilters.priceMax !== null ||
    activeFilters.inStockOnly || activeFilters.tags?.length > 0 || activeFilters.sortBy !== 'default';

  const body = (
    <div style={{ padding: '0 0 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px' }}>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18 }}>
          Filters
          {hasFilters && <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--brand)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>Active</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {hasFilters && (
            <button className="s-btn s-btn-ghost s-btn-sm" onClick={clearFilters} style={{ color: 'var(--danger)' }}>
              Clear all
            </button>
          )}
          <button className="s-btn s-btn-ghost s-btn-icon" onClick={onClose} style={{ display: 'block' }}>✕</button>
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '0 16px 12px' }}>{filtered.length} results</div>

      <div className="s-divider" />

      {/* Sort */}
      <div style={{ padding: '12px 16px' }}>
        <div className="s-label">Sort By</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter({ sortBy: opt.value })}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px',
                borderRadius: 'var(--radius)', border: `1.5px solid ${activeFilters.sortBy === opt.value ? 'var(--brand)' : 'var(--border)'}`,
                background: activeFilters.sortBy === opt.value ? 'var(--brand-dim)' : 'transparent',
                color: activeFilters.sortBy === opt.value ? 'var(--brand)' : 'var(--text-2)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s', textAlign: 'left',
              }}
            >
              <span style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${activeFilters.sortBy === opt.value ? 'var(--brand)' : 'var(--border-md)'}`, background: activeFilters.sortBy === opt.value ? 'var(--brand)' : 'transparent', flexShrink: 0 }} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="s-divider" />

      {/* Categories */}
      {categories.length > 0 && (
        <div style={{ padding: '12px 16px' }}>
          <div className="s-label">Category</div>
          {categories.map(cat => (
            <div key={cat.id} style={{ marginBottom: 4 }}>
              <button
                onClick={() => setFilter({ category: activeFilters.category === cat.id ? null : cat.id, subcategory: null })}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px',
                  borderRadius: 'var(--radius)', border: `1.5px solid ${activeFilters.category === cat.id ? 'var(--brand)' : 'var(--border)'}`,
                  background: activeFilters.category === cat.id ? 'var(--brand-dim)' : 'transparent',
                  color: activeFilters.category === cat.id ? 'var(--brand)' : 'var(--text-2)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s', textAlign: 'left',
                }}
              >
                <span>{cat.icon || '📦'}</span>{cat.name}
              </button>
              {activeFilters.category === cat.id && cat.subcategories?.length > 0 && (
                <div style={{ marginLeft: 20, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {cat.subcategories.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setFilter({ subcategory: activeFilters.subcategory === sub.id ? null : sub.id })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
                        borderRadius: 'var(--radius-sm)', border: `1px solid ${activeFilters.subcategory === sub.id ? 'var(--brand)' : 'transparent'}`,
                        background: activeFilters.subcategory === sub.id ? 'var(--brand-dim)' : 'var(--surface-2)',
                        color: activeFilters.subcategory === sub.id ? 'var(--brand)' : 'var(--text-3)',
                        fontSize: 12, fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      {sub.name}
                      {activeFilters.subcategory === sub.id && ' ✓'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="s-divider" />

      {/* In Stock Only */}
      <div style={{ padding: '12px 16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div
            onClick={() => setFilter({ inStockOnly: !activeFilters.inStockOnly })}
            style={{
              width: 44, height: 24, borderRadius: 12,
              background: activeFilters.inStockOnly ? 'var(--brand)' : 'var(--surface-3)',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0, cursor: 'pointer',
            }}
          >
            <div style={{
              position: 'absolute', top: 2, left: activeFilters.inStockOnly ? 22 : 2,
              width: 20, height: 20, borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>In Stock Only</div>
        </label>
      </div>

      <div className="s-divider" />

      {/* Price Range */}
      {allPrices.length > 0 && (
        <div style={{ padding: '12px 16px' }}>
          <div className="s-label">Max Price: {formatCurrency(activeFilters.priceMax ?? globalMax, currency)}</div>
          <input
            type="range"
            min={globalMin} max={globalMax}
            value={activeFilters.priceMax ?? globalMax}
            onChange={e => setFilter({ priceMax: Number(e.target.value) === globalMax ? null : Number(e.target.value) })}
            style={{ width: '100%', accentColor: 'var(--brand)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            <span>{formatCurrency(globalMin, currency)}</span>
            <span>{formatCurrency(globalMax, currency)}</span>
          </div>
        </div>
      )}

      {/* Tags */}
      {allTags.length > 0 && (
        <>
          <div className="s-divider" />
          <div style={{ padding: '12px 16px' }}>
            <div className="s-label">Tags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {allTags.map(tag => {
                const active = activeFilters.tags?.includes(tag);
                return (
                  <button
                    key={tag}
                    className={`s-chip${active ? ' active' : ''}`}
                    style={{ fontSize: 12 }}
                    onClick={() => {
                      const current = activeFilters.tags || [];
                      setFilter({ tags: active ? current.filter(t => t !== tag) : [...current, tag] });
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Desktop: visible sidebar (no overlay)
  // Mobile: bottom sheet with overlay
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="s-sidebar" style={{ display: 'none' }}>
        {body}
      </aside>

      {/* Mobile bottom sheet */}
      {isOpen && (
        <div className="s-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
          <div className="s-sheet" style={{ maxHeight: '85dvh' }}>
            {body}
          </div>
        </div>
      )}
    </>
  );
}
