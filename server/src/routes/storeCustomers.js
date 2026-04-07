const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// ── Middleware: verify customer session token ─────────────────────────────────
async function customerAuth(req, res, next) {
  const token = req.headers['x-customer-token'];
  if (!token) return res.status(401).json({ error: 'No session token' });

  const customer = await prisma.storeCustomer.findUnique({ where: { sessionToken: token } });
  if (!customer) return res.status(401).json({ error: 'Invalid or expired token' });

  req.customer = customer;
  next();
}

// ── POST /api/store/:slug/customers/login ─────────────────────────────────────
// Customer enters their phone number to retrieve a session token
router.post('/:slug/customers/login', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  try {
    const business = await prisma.business.findUnique({ where: { demoSlug: req.params.slug } });
    if (!business) return res.status(404).json({ error: 'Shop not found' });

    const customer = await prisma.storeCustomer.findUnique({
      where: { businessId_phone: { businessId: business.id, phone } },
    });

    if (!customer) {
      return res.status(404).json({ error: 'No account found for this number. Place an order first to create your account.' });
    }

    // Rotate session token
    const sessionToken = require('crypto').randomUUID();
    await prisma.storeCustomer.update({ where: { id: customer.id }, data: { sessionToken } });

    res.json({ sessionToken, name: customer.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── GET /api/store/:slug/customers/me ─────────────────────────────────────────
router.get('/:slug/customers/me', customerAuth, async (req, res) => {
  res.json({ id: req.customer.id, name: req.customer.name, phone: req.customer.phone, createdAt: req.customer.createdAt });
});

// ── GET /api/store/:slug/customers/me/orders ──────────────────────────────────
router.get('/:slug/customers/me/orders', customerAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const orders = await prisma.storeOrder.findMany({
      where: { customerId: req.customer.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.storeOrder.count({ where: { customerId: req.customer.id } });
    res.json({ orders, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

module.exports = router;
