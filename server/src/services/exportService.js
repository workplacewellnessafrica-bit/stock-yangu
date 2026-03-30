const ExcelJS = require('exceljs');

async function buildExcelReport(business, days, format = 'csv') {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Stock Yangu';
  workbook.created = new Date();

  const sym = business.currencySymbol || 'KES';

  // ── Summary Sheet ──────────────────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.addRow(['Stock Yangu — Business Report']);
  summarySheet.addRow([`Business: ${business.name}`]);
  summarySheet.addRow([`Owner: ${business.ownerName}`]);
  summarySheet.addRow([`Generated: ${new Date().toLocaleString('en-KE')}`]);
  summarySheet.addRow([]);
  summarySheet.addRow(['Date', 'Sales', 'Cash Sales', 'Mpesa Sales', 'Expenses', 'Profit', 'Cash Variance', 'Mpesa Variance', 'Transactions']);

  for (const day of days) {
    const totalSales = day.sales.reduce((s, x) => s + x.total, 0);
    const cashSales = day.sales.filter(x => x.paymentMethod === 'cash').reduce((s, x) => s + x.total, 0);
    const mpesaSales = day.sales.filter(x => x.paymentMethod === 'mpesa').reduce((s, x) => s + x.total, 0);
    const totalExpenses = day.expenses.reduce((s, x) => s + x.amount, 0);
    summarySheet.addRow([
      day.date, totalSales, cashSales, mpesaSales,
      totalExpenses, totalSales - totalExpenses,
      day.cashVariance || 0, day.mpesaVariance || 0,
      day.sales.length,
    ]);
  }

  // ── Sales Sheet ────────────────────────────────────────────────────────────
  const salesSheet = workbook.addWorksheet('Sales');
  salesSheet.addRow(['Date', 'Time', 'Item', 'Qty', 'Unit', 'Unit Price', 'Total', 'Payment', 'Cashier', 'Receipt No']);

  for (const day of days) {
    for (const sale of day.sales) {
      salesSheet.addRow([
        day.date,
        new Date(sale.timestamp).toLocaleTimeString('en-KE'),
        `${sale.emoji} ${sale.itemName}`,
        sale.qty, sale.unit,
        sale.unitPrice, sale.total,
        sale.paymentMethod,
        sale.staff?.name || 'Admin',
        sale.receiptNo,
      ]);
    }
  }

  // ── Expenses Sheet ─────────────────────────────────────────────────────────
  const expenseSheet = workbook.addWorksheet('Expenses');
  expenseSheet.addRow(['Date', 'Time', 'Category', 'Amount', 'Description', 'Payment', 'Recorded By']);

  for (const day of days) {
    for (const exp of day.expenses) {
      expenseSheet.addRow([
        day.date,
        new Date(exp.timestamp).toLocaleTimeString('en-KE'),
        exp.category, exp.amount,
        exp.description || '',
        exp.paymentMethod,
        exp.staff?.name || 'Admin',
      ]);
    }
  }

  // Style header rows green
  [summarySheet, salesSheet, expenseSheet].forEach(sheet => {
    const headerRow = sheet.getRow(sheet.rowCount > 5 ? 6 : 1);
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D5016' } };
    });
    sheet.columns?.forEach(col => { col.width = 18; });
  });

  const dateRange = days.length > 0 ? `${days[0].date}_${days[days.length - 1].date}` : 'all';
  const safeName = business.name.replace(/[^a-z0-9]/gi, '_');

  if (format === 'csv') {
    // Export as CSV using Summary sheet only
    const rows = [];
    summarySheet.eachRow(row => {
      rows.push(row.values.slice(1).map(v => (v === undefined ? '' : v)).join(','));
    });
    const buffer = Buffer.from(rows.join('\n'), 'utf-8');
    return {
      buffer,
      filename: `StockYangu_${safeName}_${dateRange}.csv`,
      contentType: 'text/csv',
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    buffer,
    filename: `StockYangu_${safeName}_${dateRange}.xlsx`,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}

module.exports = { buildExcelReport };
