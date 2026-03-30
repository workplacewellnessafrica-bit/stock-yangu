const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { buildExcelReport } = require('../services/exportService');

const router = express.Router();

// ─── GET /api/reports/daily?date=YYYY-MM-DD ───────────────────────────────────
router.get('/daily', auth, async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const businessId = req.user.businessId;

    const day = await prisma.dayRecord.findUnique({
      where: { businessId_date: { businessId, date } },
      include: {
        sales: {
          where: { voided: false },
          include: { staff: { select: { name: true } } },
          orderBy: { timestamp: 'asc' },
        },
        expenses: {
          include: { staff: { select: { name: true } } },
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!day) return res.status(404).json({ error: 'No record for this date' });
    res.json(day);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch daily report' });
  }
});

// ─── GET /api/reports/range?from=&to= ────────────────────────────────────────
router.get('/range', auth, async (req, res) => {
  try {
    const { from, to } = z.object({
      from: z.string(),
      to: z.string(),
    }).parse(req.query);

    const businessId = req.user.businessId;

    const days = await prisma.dayRecord.findMany({
      where: {
        businessId,
        date: { gte: from, lte: to },
        finalized: true,
      },
      include: {
        sales: { where: { voided: false } },
        expenses: true,
      },
      orderBy: { date: 'asc' },
    });

    const summary = days.map(d => {
      const totalSales = d.sales.reduce((s, x) => s + x.total, 0);
      const cashSales = d.sales.filter(x => x.paymentMethod === 'cash').reduce((s, x) => s + x.total, 0);
      const mpesaSales = d.sales.filter(x => x.paymentMethod === 'mpesa').reduce((s, x) => s + x.total, 0);
      const totalExpenses = d.expenses.reduce((s, x) => s + x.amount, 0);
      return {
        date: d.date,
        totalSales, cashSales, mpesaSales, totalExpenses,
        profit: totalSales - totalExpenses,
        cashVariance: d.cashVariance,
        mpesaVariance: d.mpesaVariance,
        saleCount: d.sales.length,
        expenseCount: d.expenses.length,
      };
    });

    const totals = summary.reduce((acc, d) => ({
      sales: acc.sales + d.totalSales,
      expenses: acc.expenses + d.totalExpenses,
      profit: acc.profit + d.profit,
    }), { sales: 0, expenses: 0, profit: 0 });

    res.json({ days: summary, totals, from, to });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Failed to fetch range report' });
  }
});

// ─── GET /api/reports/top-items?days=7 ───────────────────────────────────────
router.get('/top-items', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days || '7');
    const from = new Date();
    from.setDate(from.getDate() - days);
    const fromStr = from.toISOString().split('T')[0];

    const businessId = req.user.businessId;

    const sales = await prisma.sale.findMany({
      where: {
        voided: false,
        day: { businessId, date: { gte: fromStr } },
      },
      select: { itemId: true, itemName: true, emoji: true, qty: true, total: true },
    });

    // Group by itemId
    const map = {};
    for (const s of sales) {
      if (!map[s.itemId]) {
        map[s.itemId] = { itemId: s.itemId, itemName: s.itemName, emoji: s.emoji, qty: 0, total: 0, txCount: 0 };
      }
      map[s.itemId].qty += s.qty;
      map[s.itemId].total += s.total;
      map[s.itemId].txCount++;
    }

    const ranked = Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10);
    res.json(ranked);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch top items' });
  }
});

// ─── GET /api/reports/export?format=csv&from=&to= ────────────────────────────
router.get('/export', auth, async (req, res) => {
  try {
    const { format = 'csv', from, to } = req.query;
    const businessId = req.user.businessId;

    const days = await prisma.dayRecord.findMany({
      where: {
        businessId,
        ...(from && to ? { date: { gte: from, lte: to } } : {}),
      },
      include: {
        sales: { where: { voided: false }, include: { staff: { select: { name: true } } } },
        expenses: { include: { staff: { select: { name: true } } } },
      },
      orderBy: { date: 'asc' },
    });

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, ownerName: true, currencySymbol: true },
    });

    const { buffer, filename, contentType } = await buildExcelReport(business, days, format);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Export failed' });
  }
});

// ─── GET /api/reports/whatsapp-summary ───────────────────────────────────────
router.get('/whatsapp-summary', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const businessId = req.user.businessId;

    const [day, business] = await Promise.all([
      prisma.dayRecord.findUnique({
        where: { businessId_date: { businessId, date: today } },
        include: { sales: { where: { voided: false } }, expenses: true },
      }),
      prisma.business.findUnique({
        where: { id: businessId },
        select: { name: true, currencySymbol: true },
      }),
    ]);

    if (!day) return res.json({ text: 'No data for today yet.' });

    const totalSales = day.sales.reduce((s, x) => s + x.total, 0);
    const cashSales = day.sales.filter(x => x.paymentMethod === 'cash').reduce((s, x) => s + x.total, 0);
    const mpesaSales = day.sales.filter(x => x.paymentMethod === 'mpesa').reduce((s, x) => s + x.total, 0);
    const totalExpenses = day.expenses.reduce((s, x) => s + x.amount, 0);
    const profit = totalSales - totalExpenses;
    const sym = business.currencySymbol;

    const dateStr = new Date(today).toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' });

    const text = [
      `📊 *Stock Yangu — ${business.name}*`,
      `📅 ${dateStr}`,
      ``,
      `💰 Sales: ${sym} ${totalSales.toFixed(0)}`,
      `  💵 Cash: ${sym} ${cashSales.toFixed(0)}`,
      `  📱 M-Pesa: ${sym} ${mpesaSales.toFixed(0)}`,
      `💸 Expenses: ${sym} ${totalExpenses.toFixed(0)}`,
      `📈 Profit: ${sym} ${profit.toFixed(0)}`,
      ``,
      day.cashVariance !== null
        ? `✅ Variance: ${sym} ${(Math.abs(day.cashVariance || 0) + Math.abs(day.mpesaVariance || 0)).toFixed(0)}`
        : `⏳ Day not yet finalized`,
    ].join('\n');

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    res.json({ text, url });
  } catch (err) {
    res.status(500).json({ error: 'WhatsApp summary failed' });
  }
});

module.exports = router;
