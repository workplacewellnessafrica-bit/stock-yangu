// src/storefront/utils/whatsapp.js
// Builds the WhatsApp deep-link URL from cart contents + order details.

import { formatCurrency, estimatedDelivery, formatDate } from './formatters.js';

function renderTemplate(template, tokens) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => tokens[key] ?? '');
}

/**
 * Build a full WhatsApp message URL.
 * @param {object} params
 * @param {object[]} params.cartItems   — [{ product, variant, quantity, price }]
 * @param {number}   params.subtotal
 * @param {number}   params.deliveryFee
 * @param {number}   params.total
 * @param {string}   params.referenceId
 * @param {string}   params.customerName
 * @param {string}   params.customerPhone
 * @param {string}   params.deliveryLocation
 * @param {string}   params.specialNote
 * @param {object}   params.config      — storefront config object
 */
export function buildWhatsAppUrl({
  cartItems,
  subtotal,
  deliveryFee,
  total,
  referenceId,
  customerName,
  customerPhone,
  deliveryLocation,
  specialNote,
  config,
}) {
  const number = config.whatsappNumber;
  const msgCfg = config.whatsappMessage || {};
  const currency = config.currency || { symbol: 'KES', locale: 'en-KE' };
  const fmt = (n) => formatCurrency(n, currency);

  // Build itemised list
  const itemLines = cartItems
    .map((item, i) => {
      const variantLabel = item.variant ? ` (${item.variant.name})` : '';
      return (
        `${i + 1}. *${item.product.name}*${variantLabel}\n` +
        `   Qty: ${item.quantity} × ${fmt(item.price)} = ${fmt(item.price * item.quantity)}`
      );
    })
    .join('\n\n');

  const now = new Date();
  const tokens = {
    shopName: config.shopName || 'Our Shop',
    referenceId,
    customerName: customerName || 'Customer',
    customerPhone: customerPhone || '',
    location: deliveryLocation || 'Not specified',
    note: specialNote || 'None',
    items: itemLines,
    subtotal: fmt(subtotal),
    deliveryFee: deliveryFee > 0 ? fmt(deliveryFee) : 'FREE',
    total: fmt(total),
    orderDate: formatDate(now),
    expectedDelivery: estimatedDelivery(msgCfg.estimatedDeliveryHours || 24),
  };

  const lines = [
    renderTemplate(msgCfg.header || '🛒 *New Order from {{shopName}}*', tokens),
    '─────────────────',
    `📋 *Order ID:* ${referenceId}`,
    `👤 *Customer:* ${tokens.customerName}`,
    `📞 *Phone:* ${tokens.customerPhone}`,
    `📍 *Delivery Location:* ${tokens.location}`,
    '─────────────────',
    `🛍️ *Items Ordered:*\n`,
    itemLines,
    '─────────────────',
    `💰 *Subtotal:*    ${tokens.subtotal}`,
    deliveryFee > 0 ? `🚚 *Delivery Fee:* ${tokens.deliveryFee}` : `🚚 *Delivery:*     FREE`,
    `✅ *TOTAL:*       *${tokens.total}*`,
    '─────────────────',
    ...(specialNote ? [`📝 *Special Instructions:*\n${specialNote}`, '─────────────────'] : []),
    `⏰ *Order Placed:* ${tokens.orderDate}`,
    `🚀 *Expected Delivery:* ${tokens.expectedDelivery}`,
    '─────────────────',
    renderTemplate(msgCfg.footer || 'Thank you for shopping with us! We will confirm your order shortly.', tokens),
  ];

  const message = lines.join('\n');
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(params) {
  const url = buildWhatsAppUrl(params);
  window.open(url, '_blank', 'noopener,noreferrer');
  return url;
}
