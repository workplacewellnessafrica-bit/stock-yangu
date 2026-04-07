require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const businessRoutes = require('./routes/business');
const itemsRoutes = require('./routes/items');
const salesRoutes = require('./routes/sales');
const expensesRoutes = require('./routes/expenses');
const reconcileRoutes = require('./routes/reconcile');
const reportsRoutes = require('./routes/reports');
const smsRoutes = require('./routes/sms');
const staffRoutes = require('./routes/staff');
const storefrontRoutes = require('./routes/storefront');
const storeOrdersRoutes = require('./routes/storeOrders');
const storeCustomersRoutes = require('./routes/storeCustomers');

const { setupSocket } = require('./services/socketService');

const app = express();
const httpServer = http.createServer(app);

// ─── Socket.io ───────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

setupSocket(io);

// Make io accessible in routes
app.set('io', io);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/reconcile', reconcileRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/staff', staffRoutes);
// ─ Public Storefront ──────────────────────────────────────────────────────────
app.use('/api/store', storefrontRoutes);
app.use('/api/store', storeOrdersRoutes);
app.use('/api/store', storeCustomersRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ─ Production: Serve Static Frontend ──────────────────────────────────────────
const clientDir = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDir));

// Fallback for SPA routing (React Router handles all non-API paths)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(clientDir, 'index.html'));
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Stock Yangu server running on port ${PORT}`);
});
