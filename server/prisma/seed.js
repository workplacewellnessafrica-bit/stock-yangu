const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');

// ─── Seed helper ─────────────────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function randBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── DEMO INVENTORY PROFILES ──────────────────────────────────────────────────
const DEMO_ITEMS = {
  'mama-amina': [
    { name: 'Sukuma Wiki', emoji: '🥬', category: 'vegetables', unit: 'bunch', buyPrice: 8, sellPrice: 15, stock: 40, threshold: 5,
      priceTiers: [{ qty: 1, label: '1 bunch', price: 15 }, { qty: 3, label: '3 bunches', price: 40 }] },
    { name: 'Dania (Coriander)', emoji: '🌿', category: 'vegetables', unit: 'bunch', buyPrice: 5, sellPrice: 10, stock: 25, threshold: 5,
      priceTiers: [{ qty: 1, label: '1 bunch', price: 10 }] },
    { name: 'Tomatoes', emoji: '🍅', category: 'vegetables', unit: 'kg', buyPrice: 50, sellPrice: 80, stock: 15, threshold: 3,
      priceTiers: [{ qty: 0.5, label: '½ kg', price: 40 }, { qty: 1, label: '1 kg', price: 80 }] },
    { name: 'Eggs', emoji: '🥚', category: 'dairy', unit: 'pcs', buyPrice: 13, sellPrice: 18, stock: 60, threshold: 10,
      priceTiers: [{ qty: 1, label: '1 egg', price: 18 }, { qty: 6, label: '6 eggs', price: 100 }, { qty: 12, label: 'Tray (30)', price: 450 }] },
    { name: 'Milk (Brookside)', emoji: '🥛', category: 'dairy', unit: 'L', buyPrice: 55, sellPrice: 70, stock: 20, threshold: 5,
      priceTiers: [{ qty: 0.5, label: '500ml', price: 35 }, { qty: 1, label: '1L', price: 70 }] },
    { name: 'Bread (Supa Loaf)', emoji: '🍞', category: 'basics', unit: 'pcs', buyPrice: 52, sellPrice: 60, stock: 15, threshold: 5,
      priceTiers: [{ qty: 1, label: '1 loaf', price: 60 }] },
    { name: 'Sugar (Mumias)', emoji: '🍬', category: 'basics', unit: 'kg', buyPrice: 155, sellPrice: 180, stock: 25, threshold: 5,
      priceTiers: [{ qty: 0.5, label: '½ kg', price: 95 }, { qty: 1, label: '1 kg', price: 180 }, { qty: 2, label: '2 kg', price: 350 }] },
    { name: 'Unga (Jogoo)', emoji: '🌾', category: 'basics', unit: 'kg', buyPrice: 130, sellPrice: 155, stock: 30, threshold: 5,
      priceTiers: [{ qty: 1, label: '1 kg', price: 155 }, { qty: 2, label: '2 kg', price: 300 }] },
    { name: 'Cooking Oil (Elianto)', emoji: '🫙', category: 'basics', unit: 'L', buyPrice: 230, sellPrice: 270, stock: 12, threshold: 3,
      priceTiers: [{ qty: 0.5, label: '500ml', price: 140 }, { qty: 1, label: '1L', price: 270 }] },
    { name: 'Onions', emoji: '🧅', category: 'vegetables', unit: 'kg', buyPrice: 45, sellPrice: 70, stock: 18, threshold: 4,
      priceTiers: [{ qty: 0.5, label: '½ kg', price: 35 }, { qty: 1, label: '1 kg', price: 70 }] },
  ],
  'kariuki-team': [
    { name: 'Pishori Rice', emoji: '🍚', category: 'basics', unit: 'kg', buyPrice: 130, sellPrice: 160, stock: 80, threshold: 10,
      priceTiers: [{ qty: 1, label: '1 kg', price: 160 }, { qty: 2, label: '2 kg', price: 310 }, { qty: 5, label: '5 kg', price: 750 }] },
    { name: 'Pembe Flour', emoji: '🌾', category: 'basics', unit: 'kg', buyPrice: 110, sellPrice: 135, stock: 60, threshold: 10,
      priceTiers: [{ qty: 1, label: '1 kg', price: 135 }, { qty: 2, label: '2 kg', price: 265 }] },
    { name: 'Omo Detergent', emoji: '🧴', category: 'toiletries', unit: 'pcs', buyPrice: 130, sellPrice: 165, stock: 30, threshold: 5,
      priceTiers: [{ qty: 1, label: '500g', price: 165 }, { qty: 1, label: '1kg', price: 310 }] },
    { name: 'Coca-Cola 500ml', emoji: '🥤', category: 'drinks', unit: 'pcs', buyPrice: 55, sellPrice: 80, stock: 48, threshold: 12,
      priceTiers: [{ qty: 1, label: '500ml', price: 80 }] },
    { name: 'Kimbo (Cooking Fat)', emoji: '🫙', category: 'basics', unit: 'kg', buyPrice: 180, sellPrice: 220, stock: 20, threshold: 4,
      priceTiers: [{ qty: 0.5, label: '500g', price: 115 }, { qty: 1, label: '1 kg', price: 220 }] },
    { name: 'Sunlight Bar Soap', emoji: '🧼', category: 'toiletries', unit: 'pcs', buyPrice: 60, sellPrice: 80, stock: 25, threshold: 5,
      priceTiers: [{ qty: 1, label: '1 bar', price: 80 }] },
    { name: 'Blueband', emoji: '🧈', category: 'dairy', unit: 'pcs', buyPrice: 70, sellPrice: 90, stock: 20, threshold: 5,
      priceTiers: [{ qty: 1, label: '250g', price: 90 }] },
    { name: 'Royco (Mchuzi Mix)', emoji: '🌶️', category: 'basics', unit: 'pcs', buyPrice: 8, sellPrice: 15, stock: 60, threshold: 10,
      priceTiers: [{ qty: 1, label: '1 sachet', price: 15 }, { qty: 10, label: '10 sachets', price: 130 }] },
    { name: 'Water (Keringet 500ml)', emoji: '💧', category: 'drinks', unit: 'pcs', buyPrice: 25, sellPrice: 40, stock: 48, threshold: 12,
      priceTiers: [{ qty: 1, label: '500ml', price: 40 }] },
    { name: 'Safaricom Airtime 50', emoji: '📱', category: 'other', unit: 'pcs', buyPrice: 48, sellPrice: 50, stock: 100, threshold: 20,
      priceTiers: [{ qty: 1, label: 'KES 50', price: 50 }, { qty: 1, label: 'KES 100', price: 100 }] },
  ],
  'freshmart': [
    { name: 'Pishori Premium', emoji: '🍚', category: 'basics', unit: 'kg', buyPrice: 145, sellPrice: 180, stock: 200, threshold: 20, barcode: '6001009012345',
      priceTiers: [{ qty: 1, label: '1 kg', price: 180 }, { qty: 5, label: '5 kg', price: 870 }, { qty: 10, label: '10 kg', price: 1700 }] },
    { name: 'Tuskys Maize Flour 2kg', emoji: '🌽', category: 'basics', unit: 'pcs', buyPrice: 150, sellPrice: 185, stock: 60, threshold: 10, barcode: '6001009056789',
      priceTiers: [{ qty: 1, label: '2 kg pack', price: 185 }] },
    { name: 'Caress Soap', emoji: '🧼', category: 'toiletries', unit: 'pcs', buyPrice: 90, sellPrice: 120, stock: 40, threshold: 8, barcode: '6001009099001',
      priceTiers: [{ qty: 1, label: '1 bar', price: 120 }] },
    { name: 'Fresho Yoghurt 500g', emoji: '🥛', category: 'dairy', unit: 'pcs', buyPrice: 110, sellPrice: 145, stock: 30, threshold: 5, barcode: '6001009011111',
      priceTiers: [{ qty: 1, label: '500g', price: 145 }] },
    { name: 'Stoney Tangawizi 500ml', emoji: '🥤', category: 'drinks', unit: 'pcs', buyPrice: 55, sellPrice: 80, stock: 96, threshold: 24, barcode: '6001009022222',
      priceTiers: [{ qty: 1, label: '500ml', price: 80 }] },
    { name: 'Pampers Size 4 (x20)', emoji: '👶', category: 'toiletries', unit: 'pcs', buyPrice: 450, sellPrice: 580, stock: 20, threshold: 5, barcode: '6001009033333',
      priceTiers: [{ qty: 1, label: 'Pack of 20', price: 580 }] },
    { name: 'Tusker Lager 500ml', emoji: '🍺', category: 'drinks', unit: 'pcs', buyPrice: 160, sellPrice: 210, stock: 48, threshold: 12, barcode: '6001009044444',
      priceTiers: [{ qty: 1, label: '500ml', price: 210 }] },
    { name: 'Colgate Toothpaste', emoji: '🦷', category: 'toiletries', unit: 'pcs', buyPrice: 130, sellPrice: 165, stock: 30, threshold: 6, barcode: '6001009055555',
      priceTiers: [{ qty: 1, label: '75ml', price: 165 }] },
    { name: 'Sukuma Wiki', emoji: '🥬', category: 'vegetables', unit: 'bunch', buyPrice: 8, sellPrice: 20, stock: 60, threshold: 10,
      priceTiers: [{ qty: 1, label: '1 bunch', price: 20 }] },
    { name: 'Coke 1.5L', emoji: '🥤', category: 'drinks', unit: 'pcs', buyPrice: 90, sellPrice: 130, stock: 36, threshold: 12, barcode: '6001009066666',
      priceTiers: [{ qty: 1, label: '1.5L bottle', price: 130 }] },
  ],
};

async function seedDemoProfile(slug, config) {
  console.log(`🌱 Seeding demo: ${config.name}...`);

  // Check if already exists
  const existing = await prisma.business.findUnique({ where: { demoSlug: slug } });
  if (existing) {
    console.log(`  ⏭️  Already exists, skipping.`);
    return;
  }

  const adminPinHash = await bcrypt.hash('1234', 10);
  const passwordHash = await bcrypt.hash('demo123', 12);

  const business = await prisma.business.create({
    data: {
      name: config.name,
      ownerName: config.ownerName,
      type: config.type,
      operatingModel: config.operatingModel,
      paymentMethods: config.paymentMethods,
      productCategories: config.productCategories,
      perishablePercent: config.perishablePercent,
      avgDailyTx: config.avgDailyTx,
      taxRegistered: config.taxRegistered,
      adminPinHash,
      isDemo: true,
      demoSlug: slug,
      smsCredits: 247,
      users: {
        create: {
          email: `${slug}@demo.stockyangu.co.ke`,
          passwordHash,
          name: config.ownerName,
          role: 'owner',
        },
      },
      staff: slug !== 'mama-amina' ? {
        create: config.staffList.map(s => ({
          name: s.name,
          pinHash: s.pinHash,
          role: s.role,
        })),
      } : undefined,
    },
  });

  // Seed items
  const items = DEMO_ITEMS[slug];
  const createdItems = [];
  for (const item of items) {
    const { priceTiers, ...itemData } = item;
    const created = await prisma.item.create({
      data: {
        ...itemData,
        businessId: business.id,
        priceTiers: { create: priceTiers },
      },
    });
    createdItems.push(created);
  }

  // Seed 14 days of history
  for (let d = 14; d >= 1; d--) {
    const date = daysAgo(d);
    const txCount = randBetween(config.minTx, config.maxTx);
    const cashOpening = d === 14 ? config.seedCash : 0; // will be auto-calculated for subsequent days

    const day = await prisma.dayRecord.create({
      data: {
        businessId: business.id,
        date,
        cashOpening: d === 14 ? config.seedCash : 0,
        mpesaOpening: d === 14 ? config.seedMpesa : 0,
      },
    });

    let totalCash = 0;
    let totalMpesa = 0;

    // Generate sales
    for (let i = 0; i < txCount; i++) {
      const item = createdItems[randBetween(0, createdItems.length - 1)];
      const tier = item.priceTiers?.[0] || { qty: 1, price: item.sellPrice };
      const qty = tier.qty;
      const unitPrice = tier.price;
      const total = qty * unitPrice;
      const payMethod = Math.random() < 0.55 ? 'cash' : 'mpesa';
      if (payMethod === 'cash') totalCash += total; else totalMpesa += total;

      await prisma.sale.create({
        data: {
          dayId: day.id,
          itemId: item.id,
          itemName: item.name,
          emoji: item.emoji,
          qty, unit: item.unit, unitPrice, total,
          paymentMethod: payMethod,
          receiptNo: `SY-${slug.toUpperCase().slice(0,4)}-${date.replace(/-/g, '')}-${i.toString().padStart(4, '0')}`,
          timestamp: new Date(`${date}T${String(8 + Math.floor(i * 10 / txCount)).padStart(2,'0')}:${String(randBetween(0,59)).padStart(2,'0')}:00`),
        },
      });
    }

    // Generate 1-3 expenses
    const expenseCount = randBetween(1, 3);
    const expCats = ['restock', 'transport', 'supplies', 'labor'];
    let totalExpCash = 0;
    for (let e = 0; e < expenseCount; e++) {
      const amount = randBetween(200, 1500);
      totalExpCash += amount;
      await prisma.expense.create({
        data: {
          dayId: day.id,
          category: expCats[randBetween(0, expCats.length - 1)],
          amount, paymentMethod: 'cash',
          description: 'Demo expense',
        },
      });
    }

    // Finalize day
    const cashClose = (d === 14 ? config.seedCash : 0) + totalCash - totalExpCash;
    const mpesaClose = (d === 14 ? config.seedMpesa : 0) + totalMpesa;

    await prisma.dayRecord.update({
      where: { id: day.id },
      data: {
        cashClosing: cashClose,
        mpesaClosing: mpesaClose,
        cashVariance: 0,
        mpesaVariance: 0,
        finalized: true,
        finalizedAt: new Date(`${date}T21:00:00`),
      },
    });
  }

  console.log(`  ✅ ${config.name} seeded with ${createdItems.length} items and 14 days history.`);
}

async function main() {
  const staffPinHashes = {
    '5678': await bcrypt.hash('5678', 10),
    '9012': await bcrypt.hash('9012', 10),
    '3456': await bcrypt.hash('3456', 10),
  };

  await seedDemoProfile('mama-amina', {
    name: "Mama Amina's Kiosk",
    ownerName: 'Amina Hassan',
    type: 'kibanda',
    operatingModel: 'solo',
    paymentMethods: ['cash', 'mpesa'],
    productCategories: ['vegetables', 'dairy', 'basics'],
    perishablePercent: 60,
    avgDailyTx: 45,
    taxRegistered: false,
    seedCash: 3200,
    seedMpesa: 1500,
    minTx: 30, maxTx: 55,
  });

  await seedDemoProfile('kariuki-team', {
    name: 'Kariuku General Stores',
    ownerName: 'James Kariuki',
    type: 'kibanda',
    operatingModel: 'small-team',
    paymentMethods: ['cash', 'mpesa'],
    productCategories: ['basics', 'drinks', 'toiletries'],
    perishablePercent: 20,
    avgDailyTx: 80,
    taxRegistered: false,
    seedCash: 8500,
    seedMpesa: 4200,
    minTx: 60, maxTx: 100,
    staffList: [
      { name: 'Wanjiku', pinHash: staffPinHashes['5678'], role: 'cashier' },
      { name: 'Otieno', pinHash: staffPinHashes['9012'], role: 'cashier' },
    ],
  });

  await seedDemoProfile('freshmart', {
    name: 'FreshMart Supermarket',
    ownerName: 'Grace Njoroge',
    type: 'supermarket',
    operatingModel: 'medium',
    paymentMethods: ['cash', 'mpesa', 'card'],
    productCategories: ['basics', 'drinks', 'dairy', 'toiletries', 'vegetables'],
    perishablePercent: 35,
    avgDailyTx: 220,
    taxRegistered: true,
    seedCash: 45000,
    seedMpesa: 28000,
    minTx: 180, maxTx: 260,
    staffList: [
      { name: 'Cynthia (Tills)', pinHash: staffPinHashes['5678'], role: 'cashier' },
      { name: 'Brian (Tills)', pinHash: staffPinHashes['9012'], role: 'cashier' },
      { name: 'Mercy (Manager)', pinHash: staffPinHashes['3456'], role: 'manager' },
    ],
  });

  console.log('\n🎉 Demo seed complete!');
  console.log('Demo login credentials:');
  console.log('  mama-amina@demo.stockyangu.co.ke / demo123 | Admin PIN: 1234');
  console.log('  kariuku-team@demo.stockyangu.co.ke / demo123 | Admin PIN: 1234 | Staff PINs: 5678, 9012');
  console.log('  freshmart@demo.stockyangu.co.ke / demo123 | Admin PIN: 1234 | Staff PINs: 5678, 9012, 3456');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
