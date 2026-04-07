// src/storefront/context/CustomerContext.jsx
// Manages customer identity (name + phone token) and order history.
// Token stored in localStorage. Rotated on every order.

import { createContext, useContext, useState, useCallback } from 'react';
import { lsGet, lsSet, lsRemove, KEYS } from '../utils/storage.js';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const CustomerContext = createContext(null);

export function CustomerProvider({ slug, children }) {
  const [token, setToken]   = useState(() => lsGet(KEYS.CUSTOMER_TOKEN, null));
  const [name, setNameState]  = useState(() => lsGet(KEYS.CUSTOMER_NAME, null));
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const isLoggedIn = Boolean(token);

  // Set token after order or login
  const setCustomerSession = useCallback((sessionToken, customerName) => {
    lsSet(KEYS.CUSTOMER_TOKEN, sessionToken);
    lsSet(KEYS.CUSTOMER_NAME, customerName);
    setToken(sessionToken);
    setNameState(customerName);
  }, []);

  const logout = useCallback(() => {
    lsRemove(KEYS.CUSTOMER_TOKEN);
    lsRemove(KEYS.CUSTOMER_NAME);
    setToken(null);
    setNameState(null);
    setOrders([]);
  }, []);

  // Login by phone number (after first order)
  const loginByPhone = useCallback(async (phone) => {
    const res = await fetch(`${BASE}/api/store/${slug}/customers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error);
    }
    const { sessionToken, name: customerName } = await res.json();
    setCustomerSession(sessionToken, customerName);
    return { sessionToken, customerName };
  }, [slug, setCustomerSession]);

  // Fetch order history
  const fetchOrders = useCallback(async (page = 1) => {
    if (!token) return;
    setOrdersLoading(true);
    try {
      const res = await fetch(`${BASE}/api/store/${slug}/customers/me/orders?page=${page}&limit=10`, {
        headers: { 'X-Customer-Token': token },
      });
      if (res.status === 401) { logout(); return; }
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      console.warn('[CustomerContext] Order fetch failed');
    } finally {
      setOrdersLoading(false);
    }
  }, [token, slug, logout]);

  const value = {
    isLoggedIn,
    customerName: name,
    customerToken: token,
    orders,
    ordersLoading,
    setCustomerSession,
    loginByPhone,
    fetchOrders,
    logout,
  };

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be inside CustomerProvider');
  return ctx;
}
