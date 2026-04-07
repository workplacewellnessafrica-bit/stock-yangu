// src/storefront/components/StoreHeader.jsx

import { useState } from 'react';
import { useShop } from '../context/ShopContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useCustomer } from '../context/CustomerContext.jsx';

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const CartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

export default function StoreHeader({ theme, onToggleTheme, onAdminOpen, onOrdersOpen, onFilterOpen }) {
  const { config, searchQuery, setSearch, posStatus } = useShop();
  const { itemCount, toggleCart } = useCart();
  const { isLoggedIn, customerName } = useCustomer();

  const logoUrl = config?.shopLogo;
  const shopName = config?.shopName || 'Shop';

  return (
    <header className="s-header">
      {/* Logo + Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {logoUrl ? (
          <img src={logoUrl} alt={shopName} style={{ width: 38, height: 38, borderRadius: 'var(--radius)', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: 38, height: 38, borderRadius: 'var(--radius)',
            background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-head)',
          }}>
            {shopName.slice(0, 1)}
          </div>
        )}
        <div style={{ display: 'none' }} className="desktop-name">
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 16, lineHeight: 1.1 }}>{shopName}</div>
          {config?.shopTagline && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{config.shopTagline}</div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="s-search" style={{ flex: 1, maxWidth: 520 }}>
        <SearchIcon />
        <input
          type="text"
          placeholder="Search products…"
          value={searchQuery}
          onChange={e => setSearch(e.target.value)}
          autoComplete="off"
        />
        {searchQuery && (
          <button onClick={() => setSearch('')} style={{ color: 'var(--text-muted)', fontSize: 18, lineHeight: 1 }}>×</button>
        )}
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Filter (mobile) */}
        <button
          className="s-btn s-btn-ghost s-btn-icon"
          onClick={onFilterOpen}
          title="Filters"
          style={{ display: 'flex' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/>
            <line x1="12" y1="18" x2="12" y2="18" strokeLinecap="round" strokeWidth="3"/>
          </svg>
        </button>

        {/* Theme toggle */}
        <button
          className="s-btn s-btn-ghost s-btn-icon"
          onClick={onToggleTheme}
          title="Toggle theme"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* My Orders */}
        <button
          className="s-btn s-btn-ghost s-btn-sm"
          onClick={onOrdersOpen}
          style={{ gap: 5 }}
        >
          <UserIcon />
          <span style={{ fontSize: 13 }}>{isLoggedIn ? customerName?.split(' ')[0] : 'Orders'}</span>
        </button>

        {/* Admin */}
        <button
          className="s-btn s-btn-ghost s-btn-icon"
          onClick={onAdminOpen}
          title="Admin"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
          </svg>
        </button>

        {/* Cart FAB */}
        <button
          className="s-btn s-btn-primary"
          onClick={toggleCart}
          style={{ gap: 8, padding: '10px 14px', position: 'relative' }}
        >
          <CartIcon />
          {itemCount > 0 && (
            <span style={{
              background: '#fff', color: 'var(--brand)',
              borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 800,
              minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
            }}>
              {itemCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
