const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { getOrCreateToday } = require('../lib/dayHelper');
const { emitToRoom } = require('../services/socketService');

const router = express.Router();

function genReceiptNo() {
  const d = new Date();
  return `SY-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.random().toString(36).substr(2,6).toUpperCase()}`;
}

// ─── GET /api/sales/today ─────────────────────────────────────────────────────
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const day = await prisma.dayRecord.findUnique({
      where: { businessId_date: { businessId: req.user.businessId, date: today } },
      include: {
        sales: {
          where: { voided: false },
          include: { staff: { select: { id: true, name: true } } },
          orderBy: { timestamp: 'desc' },
        },
        expenses: {
          include: { staff: { select: { id: true, name: true } } },
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!day) return res.json({ sales: [], expenses: [], cashOpening: 0, mpesaOpening: 0 });
    res.json(day);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch today' });
  }
});

// ─── POST /api/sales ──────────────────────────────────────────────────────────
const saleSchema = z.object({
  itemId: z.string(),
  qty: z.number().positive(),
  unit: z.string(),
  unitPrice: z.number().positive(),
  paymentMethod: z.enum(['cash', 'mpesa', 'credit', 'card']),
  staffId: z.string().optional(),
});

router.post('/', auth, async (req, res) => {
  try {
    const data = saleSchema.parse(req.body);
    const businessId = req.user.businessId;

    const item = await prisma.item.findFirst({
      where: { id: data.itemId, businessId, active: true },
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const day = await getOrCreateToday(businessId);
    const total = data.qty * data.unitPrice;

    const sale = await prisma.$transaction(async (tx) => {
      // Decrement stock
      await tx.item.update({
        where: { id: data.itemId },
        data: { stock: { decrement: data.qty } },
      });

      return tx.sale.create({
        data: {
          dayId: day.id,
          itemId: data.itemId,
          itemName: item.name,
          emoji: item.emoji,
          qty: data.qty,
          unit: data.unit,
          unitPrice: data.unitPrice,
          total,
          paymentMethod: data.paymentMethod,
          staffId: data.staffId || null,
          receiptNo: genReceiptNo(),
        },
        include: { staff: { select: { id: true, name: true } } },
      });
    });

    // Check low stock — emit SMS alert if below threshold
    const updatedItem = await prisma.item.findUnique({ where: { id: data.itemId } });
    if (updatedItem.stock <= updatedItem.threshold) {
      const { sendLowStockAlert } = require('../services/smsService');
      sendLowStockAlert(businessId, updatedItem).catch(console.error);
    }

    // Emit real-time to desktop
    const io = req.app.get('io');
    emitToRoom(io, businessId, 'sale:new', { sale, itemStock: updatedItem.stock });

    res.status(201).json(sale);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    console.error(err);
    res.status(500).json({ error: 'Failed to record sale' });
  }
});

// ─── DELETE /api/sales/:id — Void sale ───────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const sale = await prisma.sale.findFirst({
      where: { id: req.params.id },
      include: { day: true },
    });
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    if (sale.day.businessId !== req.user.businessId) return res.status(403).json({ error: 'Forbidden' });
    if (sale.day.finalized) return res.status(400).json({ error: 'Cannot void sale from a finalized day' });

    await prisma.$transaction(async (tx) => {
      // Re-increment stock
      await tx.item.update({
        where: { id: sale.itemId },
        data: { stock: { increment: sale.qty } },
      });
      await tx.sale.update({
        where: { id: req.params.id },
        data: { voided: true, voidedAt: new Date() },
      });
    });

    const io = req.app.get('io');
    emitToRoom(io, req.user.businessId, 'sale:voided', { saleId: req.params.id });

    res.json({ message: 'Sale voided' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Void failed' });
  }
});

module.exports = router;
