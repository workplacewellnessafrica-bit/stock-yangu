const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { emitToRoom } = require('../services/socketService');
const { sendDailySummary } = require('../services/smsService');

const router = express.Router();

// ─── POST /api/reconcile/finalize ────────────────────────────────────────────
router.post('/finalize', auth, async (req, res) => {
  try {
    const { cashClosing, mpesaClosing, notes } = z.object({
      cashClosing: z.number().min(0),
      mpesaClosing: z.number().min(0),
      notes: z.string().optional(),
    }).parse(req.body);

    const businessId = req.user.businessId;
    const today = new Date().toISOString().split('T')[0];

    const day = await prisma.dayRecord.findUnique({
      where: { businessId_date: { businessId, date: today } },
      include: { sales: { where: { voided: false } }, expenses: true },
    });

    if (!day) return res.status(404).json({ error: 'No record for today' });
    if (day.finalized) return res.status(400).json({ error: 'Day already finalized' });

    // Calculate expected balances
    const cashSales = day.sales
      .filter(s => s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + s.total, 0);
    const mpesaSales = day.sales
      .filter(s => s.paymentMethod === 'mpesa')
      .reduce((sum, s) => sum + s.total, 0);
    const cashExpenses = day.expenses
      .filter(e => e.paymentMethod === 'cash')
      .reduce((sum, e) => sum + e.amount, 0);
    const mpesaExpenses = day.expenses
      .filter(e => e.paymentMethod === 'mpesa')
      .reduce((sum, e) => sum + e.amount, 0);

    const expectedCash = day.cashOpening + cashSales - cashExpenses;
    const expectedMpesa = day.mpesaOpening + mpesaSales - mpesaExpenses;

    const cashVariance = cashClosing - expectedCash;
    const mpesaVariance = mpesaClosing - expectedMpesa;

    // Finalize current day
    const finalized = await prisma.dayRecord.update({
      where: { id: day.id },
      data: {
        cashClosing,
        mpesaClosing,
        cashVariance,
        mpesaVariance,
        notes,
        finalized: true,
        finalizedAt: new Date(),
      },
    });

    // Create tomorrow's opening record
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    await prisma.dayRecord.upsert({
      where: { businessId_date: { businessId, date: tomorrowStr } },
      create: {
        businessId,
        date: tomorrowStr,
        cashOpening: cashClosing,
        mpesaOpening: mpesaClosing,
      },
      update: {},
    });

    const totalSales = day.sales.reduce((sum, s) => sum + s.total, 0);
    const totalExpenses = day.expenses.reduce((sum, e) => sum + e.amount, 0);

    const summary = {
      date: today,
      totalSales,
      totalExpenses,
      profit: totalSales - totalExpenses,
      cashVariance,
      mpesaVariance,
      totalVariance: Math.abs(cashVariance) + Math.abs(mpesaVariance),
    };

    // Emit to desktop
    const io = req.app.get('io');
    emitToRoom(io, businessId, 'day:finalized', { summary });

    // SMS daily summary if enabled
    sendDailySummary(businessId, summary).catch(console.error);

    res.json({ message: 'Day finalized', summary });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    console.error(err);
    res.status(500).json({ error: 'Finalization failed' });
  }
});

// ─── GET /api/reconcile/status ────────────────────────────────────────────────
router.get('/status', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const businessId = req.user.businessId;

    const day = await prisma.dayRecord.findUnique({
      where: { businessId_date: { businessId, date: today } },
      include: {
        sales: { where: { voided: false } },
        expenses: true,
      },
    });

    if (!day) {
      return res.json({ hasData: false, finalized: false, cashOpening: 0, mpesaOpening: 0 });
    }

    const totalSales = day.sales.reduce((sum, s) => sum + s.total, 0);
    const cashSales = day.sales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0);
    const mpesaSales = day.sales.filter(s => s.paymentMethod === 'mpesa').reduce((sum, s) => sum + s.total, 0);
    const totalExpenses = day.expenses.reduce((sum, e) => sum + e.amount, 0);
    const cashExpenses = day.expenses.filter(e => e.paymentMethod === 'cash').reduce((sum, e) => sum + e.amount, 0);
    const mpesaExpenses = day.expenses.filter(e => e.paymentMethod === 'mpesa').reduce((sum, e) => sum + e.amount, 0);

    res.json({
      hasData: true,
      finalized: day.finalized,
      date: day.date,
      cashOpening: day.cashOpening,
      mpesaOpening: day.mpesaOpening,
      cashSales,
      mpesaSales,
      cashExpenses,
      mpesaExpenses,
      totalSales,
      totalExpenses,
      expectedCash: day.cashOpening + cashSales - cashExpenses,
      expectedMpesa: day.mpesaOpening + mpesaSales - mpesaExpenses,
      profit: totalSales - totalExpenses,
      saleCount: day.sales.length,
      expenseCount: day.expenses.length,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get reconciliation status' });
  }
});

module.exports = router;
