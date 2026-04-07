// src/storefront/context/ShopContext.jsx
// Central store state — fetches live data from /api/store/:slug
// Products, categories, filters, search, analytics, admin config.

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { lsGet, lsSet, KEYS } from '../utils/storage.js';
import { SAMPLE_PRODUCTS, SAMPLE_CATEGORIES } from '../data/sampleProducts.js';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ShopContext = createContext(null);

// ─── State ────────────────────────────────────────────────────────────────────
function getInitialState() {
  return {
    slug: '',
    config: null,     // Full store config from API
    products: [],
    categories: [],
    isLoading: true,
    error: null,
    posStatus: 'idle',
    searchQuery: '',
    activeFilters: {
      category: null, subcategory: null,
      priceMin: null, priceMax: null,
      inStockOnly: false, tags: [], sortBy: 'default',
    },
    analytics: lsGet(KEYS.ANALYTICS, {
      pageViews: 0, productViews: {}, cartAdds: {}, ordersPlaced: 0, totalRevenue: 0,
    }),
  };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function shopReducer(state, action) {
  switch (action.type) {
    case 'INIT_SUCCESS':
      return { ...state, config: action.config, products: action.products, categories: action.categories, isLoading: false, error: null };
    case 'INIT_ERROR':
      return { ...state, isLoading: false, error: action.error };
    case 'SET_POS_STATUS':
      return { ...state, posStatus: action.payload };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    case 'SET_FILTER':
      return { ...state, activeFilters: { ...state.activeFilters, ...action.payload } };
    case 'CLEAR_FILTERS':
      return { ...state, searchQuery: '', activeFilters: { category: null, subcategory: null, priceMin: null, priceMax: null, inStockOnly: false, tags: [], sortBy: 'default' } };
    case 'DEDUCT_STOCK': {
      // action.payload = [{ itemId, qty }]
      const updated = state.products.map(p => {
        const hit = action.payload.find(d => d.itemId === p.id);
        if (!hit) return p;
        return { ...p, stock: Math.max(0, p.stock - hit.qty) };
      });
      return { ...state, products: updated };
    }
    case 'UPDATE_PRODUCT': {
      const updated = state.products.map(p => p.id === action.payload.id ? { ...p, ...action.payload } : p);
      return { ...state, products: updated };
    }
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'REMOVE_PRODUCT':
      return { ...state, products: state.products.filter(p => p.id !== action.payload) };
    case 'UPDATE_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } };
    case 'RECORD_ANALYTICS': {
      const { event, data } = action.payload;
      const a = { ...state.analytics };
      if (event === 'pageView') a.pageViews++;
      if (event === 'productView') { a.productViews = { ...a.productViews }; a.productViews[data.productId] = (a.productViews[data.productId] || 0) + 1; }
      if (event === 'cartAdd') { a.cartAdds = { ...a.cartAdds }; a.cartAdds[data.productId] = (a.cartAdds[data.productId] || 0) + 1; }
      if (event === 'orderPlaced') { a.ordersPlaced++; a.totalRevenue = (a.totalRevenue || 0) + (data.total || 0); }
      lsSet(KEYS.ANALYTICS, a);
      return { ...state, analytics: a };
    }
    default: return state;
  }
}

// ─── Category builder from product list ──────────────────────────────────────
function buildCategoriesFromProducts(products) {
  const catMap = {};
  products.forEach(p => {
    if (!catMap[p.category]) {
      catMap[p.category] = { id: p.category, name: p.category, icon: '📦', subcategories: [] };
    }
    if (p.subcategory && !catMap[p.category].subcategories.find(s => s.id === p.subcategory)) {
      catMap[p.category].subcategories.push({ id: p.subcategory, name: p.subcategory });
    }
  });
  return Object.values(catMap);
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ShopProvider({ slug, children }) {
  const [state, dispatch] = useReducer(shopReducer, null, getInitialState);

  // Load from API on mount
  const loadStore = useCallback(async () => {
    dispatch({ type: 'SET_POS_STATUS', payload: 'syncing' });
    try {
      const res = await fetch(`${BASE}/api/store/${slug}`);
      if (!res.ok) throw new Error('Store not found');
      const { config, products } = await res.json();

      // Build categories from actual product data
      const cats = buildCategoriesFromProducts(products);

      dispatch({ type: 'INIT_SUCCESS', config, products, categories: cats });
      dispatch({ type: 'SET_POS_STATUS', payload: 'success' });
      dispatch({ type: 'RECORD_ANALYTICS', payload: { event: 'pageView', data: {} } });
    } catch (err) {
      console.error('[ShopContext] Load failed:', err);
      // Fall back to sample data so template still shows something
      dispatch({
        type: 'INIT_SUCCESS',
        config: null,
        products: SAMPLE_PRODUCTS,
        categories: SAMPLE_CATEGORIES,
      });
      dispatch({ type: 'SET_POS_STATUS', payload: 'error' });
    }
  }, [slug]);

  useEffect(() => { loadStore(); }, [loadStore]);

  // Auto-refresh every 60s
  useEffect(() => {
    const id = setInterval(loadStore, 60_000);
    return () => clearInterval(id);
  }, [loadStore]);

  // ── Filtered products ──────────────────────────────────────────────────────
  const filteredProducts = useCallback(() => {
    let list = state.products.filter(p => p.active !== false);
    const { activeFilters: f, searchQuery: q } = state;

    if (q.trim()) {
      const lower = q.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(lower) ||
        p.description?.toLowerCase().includes(lower) ||
        p.sku?.toLowerCase().includes(lower) ||
        p.tags?.some(t => t.toLowerCase().includes(lower))
      );
    }
    if (f.category)    list = list.filter(p => p.category === f.category);
    if (f.subcategory) list = list.filter(p => p.subcategory === f.subcategory);
    if (f.priceMin !== null) list = list.filter(p => p.price >= f.priceMin);
    if (f.priceMax !== null) list = list.filter(p => p.price <= f.priceMax);
    if (f.inStockOnly) list = list.filter(p => p.stock > 0);
    if (f.tags?.length) list = list.filter(p => f.tags.every(tag => p.tags?.includes(tag)));
    if (f.sortBy === 'price_asc')  list = [...list].sort((a, b) => a.price - b.price);
    if (f.sortBy === 'price_desc') list = [...list].sort((a, b) => b.price - a.price);
    if (f.sortBy === 'name')       list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (f.sortBy === 'newest')     list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }, [state.products, state.activeFilters, state.searchQuery]);

  const value = {
    ...state,
    slug,
    filteredProducts,
    loadStore,
    setSearch:    q   => dispatch({ type: 'SET_SEARCH',   payload: q }),
    setFilter:    f   => dispatch({ type: 'SET_FILTER',   payload: f }),
    clearFilters: ()  => dispatch({ type: 'CLEAR_FILTERS' }),
    deductStock:  arr => dispatch({ type: 'DEDUCT_STOCK', payload: arr }),
    updateProduct: p  => dispatch({ type: 'UPDATE_PRODUCT', payload: p }),
    addProduct:   p   => dispatch({ type: 'ADD_PRODUCT',  payload: p }),
    removeProduct: id => dispatch({ type: 'REMOVE_PRODUCT', payload: id }),
    updateConfig:  c  => dispatch({ type: 'UPDATE_CONFIG', payload: c }),
    recordEvent: (event, data) => dispatch({ type: 'RECORD_ANALYTICS', payload: { event, data } }),
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be inside ShopProvider');
  return ctx;
}
