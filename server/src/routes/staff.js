const express = require('express');
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/staff ───────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const staff = await prisma.staff.findMany({
      where: { businessId: req.user.businessId, active: true },
      select: {
        id: true, name: true, role: true, active: true, createdAt: true,
        _count: { select: { sales: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// ─── POST /api/staff ──────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { name, pin, role } = z.object({
      name: z.string().min(2),
      pin: z.string().length(4).regex(/^\d{4}$/),
      role: z.enum(['cashier', 'manager']).default('cashier'),
    }).parse(req.body);

    const pinHash = await bcrypt.hash(pin, 10);
    const staff = await prisma.staff.create({
      data: { name, pinHash, role, businessId: req.user.businessId },
      select: { id: true, name: true, role: true, createdAt: true },
    });
    res.status(201).json(staff);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Failed to create staff' });
  }
});

// ─── PUT /api/staff/:id ───────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, pin, role } = z.object({
      name: z.string().min(2).optional(),
      pin: z.string().length(4).regex(/^\d{4}$/).optional(),
      role: z.enum(['cashier', 'manager']).optional(),
    }).parse(req.body);

    const data = {};
    if (name) data.name = name;
    if (role) data.role = role;
    if (pin) data.pinHash = await bcrypt.hash(pin, 10);

    const updated = await prisma.staff.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, role: true },
    });
    res.json(updated);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Update failed' });
  }
});

// ─── DELETE /api/staff/:id (soft) ─────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.staff.update({
      where: { id: req.params.id },
      data: { active: false },
    });
    res.json({ message: 'Staff removed' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ─── GET /api/staff/:id/sales ─────────────────────────────────────────────────
router.get('/:id/sales', auth, async (req, res) => {
  try {
    const { days = '7' } = req.query;
    const from = new Date();
    from.setDate(from.getDate() - parseInt(days));

    const sales = await prisma.sale.findMany({
      where: {
        staffId: req.params.id,
        voided: false,
        timestamp: { gte: from },
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    const total = sales.reduce((s, x) => s + x.total, 0);
    res.json({ sales, total, count: sales.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch staff sales' });
  }
});

module.exports = router;
