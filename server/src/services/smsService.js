const AfricasTalking = require('africastalking');
const prisma = require('../lib/prisma');

// Default AT client (sandbox)
const defaultAt = AfricasTalking({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME || 'sandbox',
});

/**
 * Get AT SMS instance — uses business-specific key if configured, falls back to env default.
 */
async function getAtSMS(businessId) {
  if (!businessId) return defaultAt.SMS;
  const biz = await prisma.business.findUnique({
    where: { id: businessId },
    select: { atApiKey: true, atUsername: true },
  });
  if (biz?.atApiKey && biz?.atUsername) {
    const client = AfricasTalking({ apiKey: biz.atApiKey, username: biz.atUsername });
    return client.SMS;
  }
  return defaultAt.SMS;
}

/**
 * Send a raw SMS.
 */
async function sendSMS(to, message, businessId = null) {
  const smsSvc = await getAtSMS(businessId);
  const result = await smsSvc.send({ to: [to], message });
  console.log('📱 SMS sent:', JSON.stringify(result));
  return result;
}

/**
 * Send low-stock alert to owner.
 */
async function sendLowStockAlert(businessId, item) {
  try {
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { smsLowStock: true, users: { select: { email: true } } },
    });
    if (!biz?.smsLowStock) return;
    // Note: In production, store owner phone number on business profile
    // For now, log only (phone field not yet in schema)
    console.log(`⚠️ Low stock alert: ${item.emoji} ${item.name} — ${item.stock} ${item.unit} remaining`);
  } catch (err) {
    console.error('Low stock SMS failed:', err.message);
  }
}

/**
 * Send daily summary SMS.
 */
async function sendDailySummary(businessId, summary) {
  try {
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { smsDailySummary: true, name: true, currencySymbol: true },
    });
    if (!biz?.smsDailySummary) return;

    const sym = biz.currencySymbol;
    const msg = [
      `📊 ${biz.name} — Daily Summary`,
      `Sales: ${sym} ${summary.totalSales.toFixed(0)}`,
      `Expenses: ${sym} ${summary.totalExpenses.toFixed(0)}`,
      `Profit: ${sym} ${summary.profit.toFixed(0)}`,
      `Variance: ${sym} ${summary.totalVariance.toFixed(0)}`,
    ].join('\n');

    console.log('📱 Daily summary SMS ready:', msg);
    // sendSMS(ownerPhone, msg, businessId); // Activate when phone stored
  } catch (err) {
    console.error('Daily summary SMS failed:', err.message);
  }
}

module.exports = { sendSMS, sendLowStockAlert, sendDailySummary };
