// src/storefront/utils/formatters.js
// Pure formatting helpers — currency, dates, order IDs, stock status.

/**
 * Format a number as currency.
 * @param {number} amount
 * @param {{ symbol: string, locale: string }} currency
 */
export function formatCurrency(amount, currency = { symbol: 'KES', locale: 'en-KE' }) {
  const formatted = new Intl.NumberFormat(currency.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${currency.symbol} ${formatted}`;
}

export function formatDate(date, opts = { dateStyle: 'medium', timeStyle: 'short' }) {
  return new Intl.DateTimeFormat('en-KE', opts).format(new Date(date));
}

export function formatDateShort(date) {
  return new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium' }).format(new Date(date));
}

export function generateOrderId() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${datePart}-${rand}`;
}

export function estimatedDelivery(hours = 24) {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return formatDate(d, { dateStyle: 'full', timeStyle: 'short' });
}

/**
 * Stock status badge info.
 * @param {number} stock
 * @param {number} threshold
 * @returns {{ label: string, level: 'out'|'low'|'ok' }}
 */
export function stockStatus(stock, threshold = 5) {
  if (stock <= 0) return { label: 'Out of Stock', level: 'out' };
  if (stock <= threshold) return { label: `Only ${stock} left!`, level: 'low' };
  return { label: 'In Stock', level: 'ok' };
}

export function truncate(str, maxLen = 80) {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen).trimEnd() + '…';
}

/** Status to human label */
export const ORDER_STATUS_LABEL = {
  pending:           '⏳ Pending',
  confirmed:         '✅ Confirmed',
  out_for_delivery:  '🚚 Out for Delivery',
  delivered:         '📦 Delivered',
  cancelled:         '❌ Cancelled',
};

export const ORDER_STATUS_COLOR = {
  pending:           '#F59E0B',
  confirmed:         '#22C55E',
  out_for_delivery:  '#3B82F6',
  delivered:         '#6B7280',
  cancelled:         '#EF4444',
};
