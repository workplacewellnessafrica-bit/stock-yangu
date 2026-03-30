const prisma = require('../lib/prisma');

/**
 * Get or create today's DayRecord for a business.
 * Uses YYYY-MM-DD string keyed to the business's local date.
 */
async function getOrCreateToday(businessId) {
  const today = new Date().toISOString().split('T')[0];

  let day = await prisma.dayRecord.findUnique({
    where: { businessId_date: { businessId, date: today } },
  });

  if (!day) {
    // Get yesterday's closing balance as today's opening
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const prevDay = await prisma.dayRecord.findUnique({
      where: { businessId_date: { businessId, date: yesterdayStr } },
      select: { cashClosing: true, mpesaClosing: true },
    });

    day = await prisma.dayRecord.create({
      data: {
        businessId,
        date: today,
        cashOpening: prevDay?.cashClosing ?? 0,
        mpesaOpening: prevDay?.mpesaClosing ?? 0,
      },
    });
  }

  return day;
}

module.exports = { getOrCreateToday };
