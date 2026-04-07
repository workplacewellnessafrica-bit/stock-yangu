const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateRefId() {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${d}-${rand}`;
}

// ── POST /api/store/:slug/orders ──────────────────────────────────────────────
// Public — place a new web order
router.post('/:slug/orders', async (req, res) => {
  const { slug } = req.params;
  const { cartItems, customerName, customerPhone, deliveryLocation, specialNote, paymentMethod, cartToken } = req.body;

  if (!cartItems?.length) return res.status(400).json({ error: 'Cart is empty' });
  if (!customerName || !customerPhone) return res.status(400).json({ error: 'Name and phone are required' });
  if (!deliveryLocation) return res.status(400).json({ error: 'Delivery location is required' });

  try {
    const business = await prisma.business.findUnique({ where: { demoSlug: slug } });
    if (!business) return res.status(404).json({ error: 'Shop not found' });

    const storeConfig = { ...(business.storeConfig || {}) };

    // ── Validate stock & build order items ────────────────────────────────────
    const orderItems = [];
    let subtotal = 0;

    for (const ci of cartItems) {
      const item = await prisma.item.findFirst({
        where: { id: ci.itemId, businessId: business.id, active: true },
      });
      if (!item) return res.status(400).json({ error: `Item not found: ${ci.itemId}` });
      if (item.stock < ci.qty) {
        return res.status(409).json({ error: `Insufficient stock for ${item.name}. Available: ${item.stock}` });
      }

      const lineTotal = ci.unitPrice * ci.qty;
      subtotal += lineTotal;
      orderItems.push({
        itemId: item.id,
        name: item.name,
        emoji: item.emoji,
        variantLabel: ci.variantLabel || null,
        qty: ci.qty,
        unitPrice: ci.unitPrice,
        total: lineTotal,
      });
    }

    // ── Delivery fee calculation ───────────────────────────────────────────────
    const feeConfig = storeConfig.delivery || {};
    const freeAbove = feeConfig.freeAbove || 0;
    const deliveryFee = (feeConfig.enabled !== false && subtotal < freeAbove) ? (feeConfig.fee || 0) : 0;
    const total = subtotal + deliveryFee;

    // ── Customer auto-create / find ───────────────────────────────────────────
    let customer = await prisma.storeCustomer.findUnique({
      where: { businessId_phone: { businessId: business.id, phone: customerPhone } },
    });
    const newSessionToken = require('crypto').randomUUID();

    if (!customer) {
      customer = await prisma.storeCustomer.create({
        data: {
          businessId: business.id,
          name: customerName,
          phone: customerPhone,
          sessionToken: newSessionToken,
        },
      });
    } else {
      // Rotate token on every order
      customer = await prisma.storeCustomer.update({
        where: { id: customer.id },
        data: { name: customerName, sessionToken: newSessionToken },
      });
    }

    // ── Create order ──────────────────────────────────────────────────────────
    const referenceId = generateRefId();
    const order = await prisma.$transaction(async (tx) => {
      // Deduct stock from each item
      for (const ci of cartItems) {
        await tx.item.update({
          where: { id: ci.itemId },
          data: { stock: { decrement: ci.qty } },
        });
      }

      // Create the store order
      const newOrder = await tx.storeOrder.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          referenceId,
          items: orderItems,
          subtotal,
          deliveryFee,
          total,
          deliveryLocation,
          specialNote: specialNote || null,
          paymentMethod: paymentMethod || 'cash_on_delivery',
          whatsappSent: false,
          channel: 'web',
        },
      });

      // Clear the cart session
      if (cartToken) {
        await tx.storeCartSession.deleteMany({ where: { token: cartToken } }).catch(() => {});
      }

      return newOrder;
    });

    // ── Emit to POS dashboard ─────────────────────────────────────────────────
    const io = req.app.get('io');
    if (io) {
      io.emit('store:new_order', {
        businessId: business.id,
        referenceId,
        customerName,
        total,
        itemCount: orderItems.length,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(201).json({
      orderId: order.id,
      referenceId,
      customerToken: newSessionToken,
      total,
      deliveryFee,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Order placement failed' });
  }
});

// ── PATCH /api/store/:slug/orders/:referenceId/whatsapp ──────────────────────
// Mark that whatsapp was opened (called from frontend after redirect)
router.patch('/:slug/orders/:referenceId/whatsapp', async (req, res) => {
  try {
    await prisma.storeOrder.updateMany({
      where: { referenceId: req.params.referenceId },
      data: { whatsappSent: true },
    });
    res.json({ ok: true });
  } catch {
    res.json({ ok: true });
  }
});

// ── PATCH /api/store/:slug/orders/:orderId/status — Admin ────────────────────
// Used from admin panel to update order status
router.patch('/:slug/orders/:orderId/status', async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  try {
    const business = await prisma.business.findUnique({ where: { demoSlug: req.params.slug } });
    if (!business) return res.status(404).json({ error: 'Not found' });

    // Restore stock if order is cancelled
    if (status === 'cancelled') {
      const order = await prisma.storeOrder.findFirst({
        where: { id: req.params.orderId, businessId: business.id },
      });
      if (order && order.status !== 'cancelled') {
        await prisma.$transaction(async (tx) => {
          for (const oi of order.items) {
            await tx.item.update({ where: { id: oi.itemId }, data: { stock: { increment: oi.qty } } });
          }
          await tx.storeOrder.update({ where: { id: order.id }, data: { status } });
        });
        return res.json({ ok: true });
      }
    }

    await prisma.storeOrder.updateMany({
      where: { id: req.params.orderId, businessId: business.id },
      data: { status },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Status update failed' });
  }
});

// ── GET /api/store/:slug/orders — Admin ──────────────────────────────────────
router.get('/:slug/orders', async (req, res) => {
  try {
    const business = await prisma.business.findUnique({ where: { demoSlug: req.params.slug } });
    if (!business) return res.status(404).json({ error: 'Not found' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const orders = await prisma.storeOrder.findMany({
      where: { businessId: business.id },
      include: { customer: { select: { name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.storeOrder.count({ where: { businessId: business.id } });
    res.json({ orders, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

module.exports = router;
