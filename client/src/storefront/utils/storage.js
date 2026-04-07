// src/storefront/utils/storage.js
// Thin localStorage wrapper — only tokens live here; cart lives on the server.
const NS = 'sy_store_';

export function lsGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(NS + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function lsSet(key, value) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch (e) {
    console.warn('[storage] lsSet failed:', e);
  }
}

export function lsRemove(key) {
  localStorage.removeItem(NS + key);
}

export const KEYS = {
  CART_TOKEN:      'cart_token',
  CUSTOMER_TOKEN:  'customer_token',
  CUSTOMER_NAME:   'customer_name',
  THEME:           'theme',
  ANALYTICS:       'analytics',
};
