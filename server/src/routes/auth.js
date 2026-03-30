const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');
const prisma = require('../lib/prisma');

const router = express.Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────
function signAccess(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

function signRefresh(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
}

// ─── POST /api/auth/register ─────────────────────────────────────────────────
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  businessName: z.string().min(2),
  ownerName: z.string().min(2),
  businessType: z.enum(['kibanda', 'small-supermarket', 'supermarket']),
  adminPin: z.string().length(4).regex(/^\d{4}$/),
});

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(data.password, 12);
    const adminPinHash = await bcrypt.hash(data.adminPin, 10);

    const business = await prisma.business.create({
      data: {
        name: data.businessName,
        ownerName: data.ownerName,
        type: data.businessType,
        adminPinHash,
        paymentMethods: ['cash', 'mpesa'],
        productCategories: [],
        users: {
          create: {
            email: data.email,
            passwordHash,
            name: data.name,
            role: 'owner',
          },
        },
      },
      include: { users: true },
    });

    const user = business.users[0];
    const accessToken = signAccess({ userId: user.id, businessId: business.id, role: 'owner' });
    const refreshToken = signRefresh({ userId: user.id });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      business: { id: business.id, name: business.name, type: business.type },
    });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = z.object({
      email: z.string().email(),
      password: z.string(),
    }).parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { business: true },
    });

    if (!user || !user.active) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken = signAccess({ userId: user.id, businessId: user.businessId, role: user.role });
    const refreshToken = signRefresh({ userId: user.id });

    // Rotate: delete old tokens, create new
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      business: {
        id: user.business.id,
        name: user.business.name,
        type: user.business.type,
        language: user.business.language,
        currencySymbol: user.business.currencySymbol,
        paymentMethods: user.business.paymentMethods,
        productCategories: user.business.productCategories,
      },
    });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── POST /api/auth/pin — Staff PIN verify ────────────────────────────────────
router.post('/pin', async (req, res) => {
  try {
    const { pin, businessId } = z.object({
      pin: z.string().length(4),
      businessId: z.string(),
    }).parse(req.body);

    // Check admin PIN first
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return res.status(404).json({ error: 'Business not found' });

    const isAdmin = await bcrypt.compare(pin, business.adminPinHash);
    if (isAdmin) {
      const token = signAccess({ businessId, role: 'admin', staffId: null, staffName: 'Admin' });
      return res.json({ token, role: 'admin', staffName: 'Admin' });
    }

    // Check staff PINs
    const staff = await prisma.staff.findMany({ where: { businessId, active: true } });
    for (const s of staff) {
      const match = await bcrypt.compare(pin, s.pinHash);
      if (match) {
        const token = signAccess({ businessId, role: s.role, staffId: s.id, staffName: s.name });
        return res.json({ token, role: s.role, staffId: s.id, staffName: s.name });
      }
    }

    return res.status(401).json({ error: 'Incorrect PIN' });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'PIN verification failed' });
  }
});

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });

    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Refresh token expired or invalid' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.active) return res.status(401).json({ error: 'User not found' });

    const newAccess = signAccess({ userId: user.id, businessId: user.businessId, role: user.role });
    const newRefresh = signRefresh({ userId: user.id });

    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { token: newRefresh, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    });

    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => {});
  }
  res.json({ message: 'Logged out' });
});

module.exports = router;
