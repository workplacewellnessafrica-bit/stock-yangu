const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/items ───────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { category, search } = req.query;
    const where = {
      businessId: req.user.businessId,
      active: true,
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search } },
        ],
      }),
    };

    const items = await prisma.item.findMany({
      where,
      include: { priceTiers: { orderBy: { qty: 'asc' } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// ─── GET /api/items/barcode/:code ─────────────────────────────────────────────
router.get('/barcode/:code', auth, async (req, res) => {
  try {
    const item = await prisma.item.findFirst({
      where: { businessId: req.user.businessId, barcode: req.params.code, active: true },
      include: { priceTiers: { orderBy: { qty: 'asc' } } },
    });
    if (!item) return res.status(404).json({ error: 'Item not found for barcode' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Barcode lookup failed' });
  }
});

// ─── POST /api/items ──────────────────────────────────────────────────────────
const itemSchema = z.object({
  name: z.string().min(1),
  emoji: z.string().default('📦'),
  category: z.string(),
  unit: z.string(),
  buyPrice: z.number().min(0).default(0),
  sellPrice: z.number().min(0),
  stock: z.number().min(0).default(0),
  threshold: z.number().min(0).default(5),
  barcode: z.string().optional(),
  imageUrl: z.string().optional(),
  sortOrder: z.number().default(0),
  priceTiers: z.array(z.object({
    qty: z.number(),
    label: z.string(),
    price: z.number(),
  })).default([]),
});

router.post('/', auth, async (req, res) => {
  try {
    const data = itemSchema.parse(req.body);
    const { priceTiers, ...itemData } = data;

    const item = await prisma.item.create({
      data: {
        ...itemData,
        businessId: req.user.businessId,
        priceTiers: {
          create: priceTiers,
        },
      },
      include: { priceTiers: true },
    });

    res.status(201).json(item);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    console.error(err);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// ─── PUT /api/items/:id ───────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const existing = await prisma.item.findFirst({
      where: { id: req.params.id, businessId: req.user.businessId },
    });
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    const data = itemSchema.partial().parse(req.body);
    const { priceTiers, ...itemData } = data;

    // Update item + replace price tiers
    const updated = await prisma.$transaction(async (tx) => {
      if (priceTiers !== undefined) {
        await tx.priceTier.deleteMany({ where: { itemId: req.params.id } });
        await tx.priceTier.createMany({
          data: priceTiers.map(t => ({ ...t, itemId: req.params.id })),
        });
      }
      return tx.item.update({
        where: { id: req.params.id },
        data: { ...itemData, updatedAt: new Date() },
        include: { priceTiers: { orderBy: { qty: 'asc' } } },
      });
    });

    res.json(updated);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// ─── DELETE /api/items/:id (soft delete) ─────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const existing = await prisma.item.findFirst({
      where: { id: req.params.id, businessId: req.user.businessId },
    });
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    await prisma.item.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ─── POST /api/items/bulk ─────────────────────────────────────────────────────
router.post('/bulk', auth, async (req, res) => {
  try {
    const { items } = z.object({
      items: z.array(itemSchema),
    }).parse(req.body);

    let created = 0;
    for (const item of items) {
      const { priceTiers, ...itemData } = item;
      await prisma.item.create({
        data: {
          ...itemData,
          businessId: req.user.businessId,
          priceTiers: { create: priceTiers },
        },
      });
      created++;
    }

    res.status(201).json({ message: `${created} items imported` });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Bulk import failed' });
  }
});

// ─── PATCH /api/items/:id/stock — Receive new stock ──────────────────────────
router.patch('/:id/stock', auth, async (req, res) => {
  try {
    const { qty, buyPrice } = z.object({
      qty: z.number().positive(),
      buyPrice: z.number().optional(),
    }).parse(req.body);

    const existing = await prisma.item.findFirst({
      where: { id: req.params.id, businessId: req.user.businessId },
    });
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    const updated = await prisma.item.update({
      where: { id: req.params.id },
      data: {
        stock: { increment: qty },
        ...(buyPrice !== undefined && { buyPrice }),
      },
    });

    res.json({ id: updated.id, stock: updated.stock });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Stock update failed' });
  }
});

module.exports = router;
