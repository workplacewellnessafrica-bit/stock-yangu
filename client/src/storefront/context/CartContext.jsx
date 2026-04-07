// src/storefront/context/CartContext.jsx
// Server-synced cart. Cart items live in the database (StoreCartSession).
// Only the session token lives in localStorage.
// Debounced sync: every mutation posts to the server 600ms after the last change.

import { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { lsGet, lsSet, lsRemove, KEYS } from '../utils/storage.js';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CartContext = createContext(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cartItemId(itemId, variantId = null) {
  return variantId ? `${itemId}::${variantId}` : itemId;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function cartReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, items: action.payload, isOpen: false };
    case 'ADD': {
      const { product, variant = null, quantity = 1 } = action.payload;
      const maxQty = variant ? variant.stock ?? product.stock : product.stock;
      const id = cartItemId(product.id, variant?.id);
      const price = variant?.price ?? product.price;
      const existing = state.items.find(i => i.id === id);
      const newItems = existing
        ? state.items.map(i => i.id === id ? { ...i, quantity: Math.min(i.quantity + quantity, maxQty) } : i)
        : [...state.items, { id, product, variant, quantity: Math.min(quantity, maxQty), price }];
      return { ...state, items: newItems, isOpen: true };
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter(i => i.id !== action.payload) };
    case 'UPDATE_QTY': {
      const { itemId, quantity, product, variant } = action.payload;
      const maxQty = variant ? variant.stock ?? product.stock : product.stock;
      if (quantity <= 0) return { ...state, items: state.items.filter(i => i.id !== itemId) };
      return { ...state, items: state.items.map(i => i.id === itemId ? { ...i, quantity: Math.min(quantity, maxQty) } : i) };
    }
    case 'CLEAR':
      return { ...state, items: [] };
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };
    case 'OPEN_CART':
      return { ...state, isOpen: true };
    case 'CLOSE_CART':
      return { ...state, isOpen: false };
    default:
      return state;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function CartProvider({ slug, children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false });
  const tokenRef = useRef(lsGet(KEYS.CART_TOKEN, null));
  const syncTimer = useRef(null);
  const isSyncing = useRef(false);

  // ── Hydrate from server on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    const token = tokenRef.current;
    if (!token) return;

    fetch(`${BASE}/api/store/${slug}/cart`, { headers: { 'X-Cart-Token': token } })
      .then(r => r.json())
      .then(({ items, expired }) => {
        if (expired) { lsRemove(KEYS.CART_TOKEN); tokenRef.current = null; return; }
        dispatch({ type: 'HYDRATE', payload: items || [] });
      })
      .catch(() => {});
  }, [slug]);

  // ── Debounced server sync on cart change ──────────────────────────────────
  const syncToServer = useCallback((items) => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      try {
        // Serialise: only send item IDs, variant info, qty, price — not full product objects
        const serialised = items.map(i => ({
          itemId: i.product?.id || i.itemId,
          variantId: i.variant?.id || null,
          variantLabel: i.variant?.name || null,
          qty: i.quantity,
          price: i.price,
        }));

        const headers = {
          'Content-Type': 'application/json',
          ...(tokenRef.current ? { 'X-Cart-Token': tokenRef.current } : {}),
        };

        const res = await fetch(`${BASE}/api/store/${slug}/cart`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ items: serialised }),
        });

        const { token } = await res.json();
        if (token && token !== tokenRef.current) {
          tokenRef.current = token;
          lsSet(KEYS.CART_TOKEN, token);
        }
      } catch {
        // Offline — retry on next mutation
      } finally {
        isSyncing.current = false;
      }
    }, 600);
  }, [slug]);

  // Sync whenever items change (skip on hydrate — items come from server)
  const prevItems = useRef(null);
  useEffect(() => {
    if (prevItems.current === null) { prevItems.current = state.items; return; }
    if (prevItems.current !== state.items) {
      prevItems.current = state.items;
      syncToServer(state.items);
    }
  }, [state.items, syncToServer]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const itemCount = state.items.reduce((s, i) => s + i.quantity, 0);
  const subtotal  = state.items.reduce((s, i) => s + i.price * i.quantity, 0);

  const clearCartOnServer = async () => {
    if (tokenRef.current) {
      await fetch(`${BASE}/api/store/${slug}/cart`, {
        method: 'DELETE',
        headers: { 'X-Cart-Token': tokenRef.current },
      }).catch(() => {});
      lsRemove(KEYS.CART_TOKEN);
      tokenRef.current = null;
    }
    dispatch({ type: 'CLEAR' });
  };

  const value = {
    items:      state.items,
    isOpen:     state.isOpen,
    itemCount,
    subtotal,
    cartToken:  tokenRef.current,
    addToCart:  (product, variant, qty) => dispatch({ type: 'ADD', payload: { product, variant, quantity: qty } }),
    removeItem: id => dispatch({ type: 'REMOVE', payload: id }),
    updateQty:  (itemId, qty, product, variant) => dispatch({ type: 'UPDATE_QTY', payload: { itemId, quantity: qty, product, variant } }),
    clearCart:  clearCartOnServer,
    toggleCart: () => dispatch({ type: 'TOGGLE_CART' }),
    openCart:   () => dispatch({ type: 'OPEN_CART' }),
    closeCart:  () => dispatch({ type: 'CLOSE_CART' }),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}
