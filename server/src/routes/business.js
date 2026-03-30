const express = require('express');
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/business/profile ────────────────────────────────────────────────
router.get('/profile', auth, async (req, res) => {
  try {
    const business = await prisma.business.findUnique({
      where: { id: req.user.businessId },
      select: {
        id: true, name: true, ownerName: true, type: true,
        operatingModel: true, paymentMethods: true, productCategories: true,
        perishablePercent: true, avgDailyTx: true, existingRecords: true,
        taxRegistered: true, currencySymbol: true, language: true,
        smsCredits: true, smsLowStock: true, smsDailySummary: true,
        smsMpesaConfirm: true, smsRestockRemind: true, isDemo: true,
        createdAt: true,
      },
    });
    if (!business) return res.status(404).json({ error: 'Business not found' });
    res.json(business);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ─── PUT /api/business/profile ────────────────────────────────────────────────
const updateSchema = z.object({
  name: z.string().min(2).optional(),
  ownerName: z.string().min(2).optional(),
  type: z.enum(['kibanda', 'small-supermarket', 'supermarket']).optional(),
  operatingModel: z.enum(['solo', 'small-team', 'medium', 'large']).optional(),
  paymentMethods: z.array(z.string()).optional(),
  productCategories: z.array(z.string()).optional(),
  perishablePercent: z.number().min(0).max(100).optional(),
  avgDailyTx: z.number().min(1).optional(),
  taxRegistered: z.boolean().optional(),
  currencySymbol: z.string().optional(),
  language: z.enum(['en', 'sw']).optional(),
  smsLowStock: z.boolean().optional(),
  smsDailySummary: z.boolean().optional(),
  smsMpesaConfirm: z.boolean().optional(),
  smsRestockRemind: z.boolean().optional(),
});

router.put('/profile', auth, async (req, res) => {
  try {
    const data = updateSchema.parse(req.body);
    const updated = await prisma.business.update({
      where: { id: req.user.businessId },
      data,
    });
    res.json({ message: 'Profile updated', business: { id: updated.id, name: updated.name } });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// ─── PUT /api/business/admin-pin ─────────────────────────────────────────────
router.put('/admin-pin', auth, async (req, res) => {
  try {
    const { currentPin, newPin } = z.object({
      currentPin: z.string().length(4),
      newPin: z.string().length(4).regex(/^\d{4}$/),
    }).parse(req.body);

    const business = await prisma.business.findUnique({ where: { id: req.user.businessId } });
    const valid = await bcrypt.compare(currentPin, business.adminPinHash);
    if (!valid) return res.status(401).json({ error: 'Current PIN is incorrect' });

    const adminPinHash = await bcrypt.hash(newPin, 10);
    await prisma.business.update({ where: { id: req.user.businessId }, data: { adminPinHash } });
    res.json({ message: 'Admin PIN updated' });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'PIN update failed' });
  }
});

// ─── POST /api/business/onboard ──────────────────────────────────────────────
// Completes the onboarding wizard for an existing business (saves all wizard data)
const onboardSchema = z.object({
  type: z.enum(['kibanda', 'small-supermarket', 'supermarket']),
  operatingModel: z.enum(['solo', 'small-team', 'medium', 'large']),
  paymentMethods: z.array(z.string()).min(1),
  productCategories: z.array(z.string()).min(1),
  perishablePercent: z.number().min(0).max(100),
  avgDailyTx: z.number().min(1),
  existingRecords: z.string(),
  topPainPoint: z.string().optional(),
  taxRegistered: z.boolean(),
});

router.post('/onboard', auth, async (req, res) => {
  try {
    const data = onboardSchema.parse(req.body);
    await prisma.business.update({
      where: { id: req.user.businessId },
      data,
    });
    res.json({ message: 'Onboarding complete' });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Onboarding failed' });
  }
});

// ─── GET /api/business/demo/:slug ────────────────────────────────────────────
// Load a pre-seeded demo profile (no auth required)
router.get('/demo/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const business = await prisma.business.findUnique({
      where: { demoSlug: slug },
      include: {
        items: { include: { priceTiers: true }, where: { active: true } },
        staff: { where: { active: true } },
        days: {
          orderBy: { date: 'desc' },
          take: 7,
          include: { sales: true, expenses: true },
        },
        users: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
    });

    if (!business) return res.status(404).json({ error: 'Demo profile not found' });
    res.json(business);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load demo' });
  }
});

// ─── GET /api/business/demos ──────────────────────────────────────────────────
router.get('/demos', async (_req, res) => {
  try {
    const demos = await prisma.business.findMany({
      where: { isDemo: true },
      select: {
        id: true, name: true, ownerName: true, type: true,
        demoSlug: true, productCategories: true,
      },
    });
    res.json(demos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list demos' });
  }
});

module.exports = router;
