const express = require('express');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────
function mapItemToProduct(item) {
  return {
    id: item.id,
    sku: item.barcode || item.id.slice(0, 8).toUpperCase(),
    name: item.name,
    emoji: item.emoji,
    description: item.description || '',
    category: item.category,
    subcategory: item.subcategory || null,
    price: item.sellPrice,
    stock: item.stock,
    threshold: item.threshold,
    images: item.imageUrl ? [item.imageUrl] : [],
    unit: item.unit,
    sortOrder: item.sortOrder,
    active: item.active,
    featured: item.featured || false,
    tags: item.tags || [],
    createdAt: item.createdAt,
    // PriceTiers become selectable quantity variants
    variants: (item.priceTiers || []).map(t => ({
      id: t.id,
      name: t.label,   // e.g. "½ kg", "1L"
      price: t.price,
      qty: t.qty,
    })),
  };
}

function defaultStoreConfig(business) {
  return {
    shopName: business.name,
    shopTagline: 'Shop fresh, delivered fast',
    shopLogo: null,
    whatsappNumber: '',
    brandColor: '#22C55E',
    currency: { code: business.currencySymbol || 'KES', symbol: business.currencySymbol || 'KES', locale: 'en-KE' },
    delivery: { enabled: true, fee: 150, freeAbove: 2500 },
    operations: { isStoreOpen: true, closedMessage: "We're currently closed. Check back soon!", openingHours: [] },
    inventory: { lowStockThreshold: 5 },
    whatsappMessage: {
      header: '🛒 *New Order from {{shopName}}*',
      footer: 'Thank you for shopping with us! We will confirm your order shortly.',
      estimatedDeliveryHours: 24,
    },
    analytics: { enabled: true },
  };
}

// ── GET /api/store/:slug ───────────────────────────────────────────────────────
// Public — returns shop config + full active inventory
router.get('/:slug', async (req, res) => {
  try {
    const business = await prisma.business.findUnique({
      where: { demoSlug: req.params.slug },
      include: {
        items: {
          where: { active: true },
          include: { priceTiers: { orderBy: { qty: 'asc' } } },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });

    if (!business) return res.status(404).json({ error: 'Shop not found' });

    const storeConfig = {
      ...defaultStoreConfig(business),
      ...(business.storeConfig || {}),
    };

    res.json({
      config: storeConfig,
      products: business.items.map(mapItemToProduct),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load store' });
  }
});

// ── GET /api/store/:slug/cart ─────────────────────────────────────────────────
// Restore server-side cart session
router.get('/:slug/cart', async (req, res) => {
  const token = req.headers['x-cart-token'];
  if (!token) return res.json({ items: [] });

  try {
    const session = await prisma.storeCartSession.findUnique({ where: { token } });
    if (!session || session.expiresAt < new Date()) {
      return res.json({ items: [], expired: true });
    }
    res.json({ items: session.items });
  } catch (err) {
    res.status(500).json({ error: 'Cart fetch failed' });
  }
});

// ── PUT /api/store/:slug/cart ─────────────────────────────────────────────────
// Upsert server-side cart session (creates or updates)
router.put('/:slug/cart', async (req, res) => {
  try {
    const business = await prisma.business.findUnique({ where: { demoSlug: req.params.slug } });
    if (!business) return res.status(404).json({ error: 'Shop not found' });

    let token = req.headers['x-cart-token'] || uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.storeCartSession.upsert({
      where: { token },
      update: { items: req.body.items || [], expiresAt },
      create: { token, businessId: business.id, items: req.body.items || [], expiresAt },
    });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Cart save failed' });
  }
});

// ── DELETE /api/store/:slug/cart ──────────────────────────────────────────────
router.delete('/:slug/cart', async (req, res) => {
  const token = req.headers['x-cart-token'];
  if (!token) return res.json({ ok: true });
  try {
    await prisma.storeCartSession.deleteMany({ where: { token } });
    res.json({ ok: true });
  } catch {
    res.json({ ok: true });
  }
});

module.exports = router;
