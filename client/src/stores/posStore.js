import { create } from 'zustand';

export const usePosStore = create((set, get) => ({
  // Cart
  cart: [],
  addToCart: (item, qty, unit, unitPrice) => {
    const line = { id: Date.now(), item, qty, unit, unitPrice, total: qty * unitPrice };
    set((s) => ({ cart: [...s.cart, line] }));
  },
  removeFromCart: (id) => set((s) => ({ cart: s.cart.filter(l => l.id !== id) })),
  clearCart: () => set({ cart: [] }),
  cartTotal: () => get().cart.reduce((s, l) => s + l.total, 0),

  // Payment
  paymentMethod: 'cash',
  setPaymentMethod: (m) => set({ paymentMethod: m }),

  // Today's sales (live feed from socket)
  todaySales: [],
  setTodaySales: (sales) => set({ todaySales: sales }),
  addSaleToFeed: (sale) => set((s) => ({ todaySales: [sale, ...s.todaySales] })),

  // Today's expenses
  todayExpenses: [],
  setTodayExpenses: (expenses) => set({ todayExpenses: expenses }),

  // Day record
  dayRecord: null,
  setDayRecord: (d) => set({ dayRecord: d }),

  // Computed
  todayRevenue: () => get().todaySales.filter(s => !s.voided).reduce((s, x) => s + x.total, 0),
  todayCash: () => get().todaySales.filter(s => !s.voided && s.paymentMethod === 'cash').reduce((s, x) => s + x.total, 0),
  todayMpesa: () => get().todaySales.filter(s => !s.voided && s.paymentMethod === 'mpesa').reduce((s, x) => s + x.total, 0),
  todayExpTotal: () => get().todayExpenses.reduce((s, x) => s + x.amount, 0),
  todayProfit: () => get().todayRevenue() - get().todayExpTotal(),
}));

export const useInventoryStore = create((set, get) => ({
  items: [],
  categories: [],
  loading: false,
  lastFetched: null,

  setItems: (items) => {
    const cats = ['all', ...new Set(items.map(i => i.category).filter(Boolean))];
    set({ items, categories: cats, lastFetched: Date.now() });
  },

  updateItemStock: (itemId, newStock) => set((s) => ({
    items: s.items.map(i => i.id === itemId ? { ...i, stock: newStock } : i),
  })),

  activeCategory: 'all',
  setCategory: (c) => set({ activeCategory: c }),

  searchQuery: '',
  setSearch: (q) => set({ searchQuery: q }),

  filteredItems: () => {
    const { items, activeCategory, searchQuery } = get();
    return items.filter(item => {
      if (!item.active) return false;
      if (activeCategory !== 'all' && item.category !== activeCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.barcode?.includes(q);
      }
      return true;
    });
  },

  setLoading: (l) => set({ loading: l }),
}));
