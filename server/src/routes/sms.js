const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { sendSMS } = require('../services/smsService');

const router = express.Router();

// ─── POST /api/sms/test ───────────────────────────────────────────────────────
router.post('/test', auth, async (req, res) => {
  try {
    const { phone } = z.object({ phone: z.string() }).parse(req.body);
    const business = await prisma.business.findUnique({
      where: { id: req.user.businessId },
      select: { name: true },
    });

    const result = await sendSMS(phone, `✅ Stock Yangu test SMS for ${business.name}. Your SMS alerts are working!`);
    res.json({ message: 'SMS sent', result });
  } catch (err) {
    res.status(500).json({ error: err.message || 'SMS failed' });
  }
});

// ─── PUT /api/sms/settings ────────────────────────────────────────────────────
router.put('/settings', auth, async (req, res) => {
  try {
    const data = z.object({
      smsLowStock: z.boolean().optional(),
      smsDailySummary: z.boolean().optional(),
      smsMpesaConfirm: z.boolean().optional(),
      smsRestockRemind: z.boolean().optional(),
      atApiKey: z.string().optional(),
      atUsername: z.string().optional(),
    }).parse(req.body);

    await prisma.business.update({
      where: { id: req.user.businessId },
      data,
    });
    res.json({ message: 'SMS settings updated' });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Update failed' });
  }
});

// ─── GET /api/sms/credits ─────────────────────────────────────────────────────
router.get('/credits', auth, async (req, res) => {
  try {
    const business = await prisma.business.findUnique({
      where: { id: req.user.businessId },
      select: { smsCredits: true },
    });
    res.json({ credits: business.smsCredits });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch credits' });
  }
});

module.exports = router;
