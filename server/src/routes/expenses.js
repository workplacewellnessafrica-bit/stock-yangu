const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { getOrCreateToday } = require('../lib/dayHelper');
const { emitToRoom } = require('../services/socketService');

const router = express.Router();

// ─── POST /api/expenses ───────────────────────────────────────────────────────
const expenseSchema = z.object({
  category: z.enum(['restock', 'rent', 'labor', 'utilities', 'transport', 'supplies', 'other']),
  amount: z.number().positive(),
  description: z.string().optional(),
  paymentMethod: z.enum(['cash', 'mpesa']),
  staffId: z.string().optional(),
});

router.post('/', auth, async (req, res) => {
  try {
    const data = expenseSchema.parse(req.body);
    const businessId = req.user.businessId;
    const day = await getOrCreateToday(businessId);

    const expense = await prisma.expense.create({
      data: {
        dayId: day.id,
        category: data.category,
        amount: data.amount,
        description: data.description,
        paymentMethod: data.paymentMethod,
        staffId: data.staffId || null,
      },
      include: { staff: { select: { id: true, name: true } } },
    });

    const io = req.app.get('io');
    emitToRoom(io, businessId, 'expense:new', { expense });

    res.status(201).json(expense);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    console.error(err);
    res.status(500).json({ error: 'Failed to record expense' });
  }
});

// ─── DELETE /api/expenses/:id ─────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await prisma.expense.findFirst({
      where: { id: req.params.id },
      include: { day: true },
    });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    if (expense.day.businessId !== req.user.businessId) return res.status(403).json({ error: 'Forbidden' });
    if (expense.day.finalized) return res.status(400).json({ error: 'Cannot delete from finalized day' });

    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
