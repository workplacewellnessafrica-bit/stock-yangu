import { create } from 'zustand';

export const useUIStore = create((set) => ({
  // Toasts
  toasts: [],
  toast: (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, duration);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  // Language
  lang: localStorage.getItem('sy-lang') || 'en',
  setLang: (l) => { localStorage.setItem('sy-lang', l); set({ lang: l }); },

  // Active tab (mobile)
  activeTab: 'pos',
  setTab: (t) => set({ activeTab: t }),

  // Modals
  measureModal: null, // { item }
  payModal: false,
  setMeasureModal: (item) => set({ measureModal: item }),
  setPayModal: (v) => set({ payModal: v }),

  // Desktop
  desktopPanel: 'dashboard', // 'dashboard' | 'scanner' | 'inventory'
  setDesktopPanel: (p) => set({ desktopPanel: p }),

  // Offline
  isOnline: navigator.onLine,
  setOnline: (v) => set({ isOnline: v }),
  offlineQueue: [],
  addToOfflineQueue: (action) => set((s) => ({ offlineQueue: [...s.offlineQueue, action] })),
  clearOfflineQueue: () => set({ offlineQueue: [] }),
}));

// i18n — minimal Swahili/English strings
export const t = (key, lang) => {
  const dict = {
    'pos': { en: 'Sales', sw: 'Mauzo' },
    'log': { en: 'Log', sw: 'Rekodi' },
    'reconcile': { en: 'Balance', sw: 'Kuhesabu' },
    'reports': { en: 'Reports', sw: 'Ripoti' },
    'admin': { en: 'Admin', sw: 'Usimamizi' },
    'cart': { en: 'Cart', sw: 'Kikapu' },
    'cash': { en: 'Cash', sw: 'Pesa Taslimu' },
    'mpesa': { en: 'M-Pesa', sw: 'M-Pesa' },
    'total': { en: 'Total', sw: 'Jumla' },
    'confirm': { en: 'Confirm', sw: 'Thibitisha' },
    'cancel': { en: 'Cancel', sw: 'Ghairi' },
    'sold': { en: 'Sale recorded!', sw: 'Mauzo yamerekodiwa!' },
    'search': { en: 'Search items...', sw: 'Tafuta bidhaa...' },
    'all': { en: 'All', sw: 'Zote' },
    'profit': { en: 'Profit', sw: 'Faida' },
    'sales': { en: 'Sales', sw: 'Mauzo' },
    'expenses': { en: 'Expenses', sw: 'Gharama' },
    'today': { en: 'Today', sw: 'Leo' },
    'stock': { en: 'Stock', sw: 'Hisa' },
    'qty': { en: 'Quantity', sw: 'Kiasi' },
    'pay': { en: 'Pay', sw: 'Lipa' },
    'close_day': { en: 'Close Day', sw: 'Funga Siku' },
    'staff': { en: 'Staff', sw: 'Wafanyakazi' },
    'items': { en: 'Items', sw: 'Bidhaa' },
    'add_item': { en: 'Add Item', sw: 'Ongeza Bidhaa' },
    'low_stock': { en: 'Low stock', sw: 'Hisa chache' },
    'enter_pin': { en: 'Enter PIN', sw: 'Weka PIN' },
  };
  return dict[key]?.[lang] || dict[key]?.en || key;
};
