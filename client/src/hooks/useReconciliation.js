import { useState, useEffect } from 'react';
import api from '../api/client';

export default function useReconciliation() {
  const [loading, setLoading] = useState(true);
  const [dayData, setDayData] = useState(null);
  
  // 4 Steps: 0=Money, 1=Deductions, 2=EOD Sales, 3=Summary
  const [step, setStep] = useState(0);
  
  // Money
  const [cashCount, setCashCount] = useState('');
  const [mpesaCount, setMpesaCount] = useState('');
  
  // Deductions
  const [notes, setNotes] = useState([]);
  
  // EOD Sales adding
  const [unrecordedSales, setUnrecordedSales] = useState([]);
  const [inventory, setInventory] = useState([]);

  // Submission state
  const [closing, setClosing] = useState(false);
  const [closed, setClosed] = useState(false);
  const [closedSummary, setClosedSummary] = useState(null);

  useEffect(() => {
    loadStatus();
    loadInventory();
  }, []);

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await api.get('/reconcile/status');
      setDayData(res.data);
      if (res.data.finalized) setClosed(true);
    } catch (e) {
      console.error("Failed to load reconcile status", e);
    } finally {
      setLoading(false);
    }
  }

  async function loadInventory() {
    try {
      const res = await api.get('/inventory');
      setInventory(res.data);
    } catch (e) {
      console.error("Failed to load inventory", e);
    }
  }

  // Derived figures
  const d = dayData ?? {};
  const openingBal    = (d.cashOpening ?? 0) + (d.mpesaOpening ?? 0);
  const todaySales    = d.totalSales ?? 0;
  const existingExp   = d.totalExpenses ?? 0;
  
  // New input
  const countedCash = parseFloat(cashCount) || 0;
  const countedMpesa = parseFloat(mpesaCount) || 0;
  const totalHand = countedCash + countedMpesa;

  // Manual Deductions Added during reconcile
  const addedExpList = notes.filter(n => n.type === 'expense' || n.type === 'personal');
  const addedRestockList = notes.filter(n => n.type === 'restock');
  const addedExpAmount = addedExpList.reduce((s, n) => s + parseFloat(n.amount), 0);
  const addedRestock = addedRestockList.reduce((s, n) => s + parseFloat(n.amount), 0);
  const totalAddedDeductions = addedExpAmount + addedRestock;

  // Manual Sales Added during reconcile
  const addedUnrecordedSalesTotal = unrecordedSales.reduce((s, sale) => s + (parseFloat(sale.qty) * parseFloat(sale.unitPrice)), 0);

  // Math: 
  const expectedTotal = openingBal + todaySales + addedUnrecordedSalesTotal - existingExp - totalAddedDeductions;
  
  const expectedCashTotal = (d.cashOpening ?? 0) + (d.cashSales ?? 0) 
    + unrecordedSales.filter(s => s.paymentMethod === 'cash').reduce((s, sale) => s + (sale.qty * sale.unitPrice), 0)
    - (d.cashExpenses ?? 0) 
    - notes.filter(n => n.paymentMethod === 'cash' || !n.paymentMethod).reduce((s, n) => s + parseFloat(n.amount), 0);
  
  const expectedMpesaTotal = (d.mpesaOpening ?? 0) + (d.mpesaSales ?? 0)
    + unrecordedSales.filter(s => s.paymentMethod === 'mpesa').reduce((s, sale) => s + (sale.qty * sale.unitPrice), 0)
    - (d.mpesaExpenses ?? 0)
    - notes.filter(n => n.paymentMethod === 'mpesa').reduce((s, n) => s + parseFloat(n.amount), 0);

  const variance = totalHand - expectedTotal;

  // Final Action
  async function finalizeDay() {
    setClosing(true);
    try {
      // Create deductions first
      for (const n of notes) {
        await api.post('/expenses', {
          category: n.type === 'restock' ? 'restock' : 'other',
          amount: parseFloat(n.amount),
          description: n.label,
          paymentMethod: n.paymentMethod || 'cash'
        });
      }

      // Create missing sales
      for (const sale of unrecordedSales) {
        await api.post('/sales', {
          itemId: sale.itemId,
          qty: parseFloat(sale.qty),
          unit: sale.unit || 'pcs',
          unitPrice: parseFloat(sale.unitPrice),
          paymentMethod: sale.paymentMethod || 'cash'
        });
      }

      // Finalize Day
      const notesStr = notes.map(n => `[${n.type.toUpperCase()}] ${n.label}: ${n.amount}`).join(', ');
      
      const payload = {
        cashClosing: countedCash,
        mpesaClosing: countedMpesa,
      };
      if (notesStr.length > 0) payload.notes = notesStr;

      const res = await api.post('/reconcile/finalize', payload);

      setClosedSummary(res.data.summary);
      setClosed(true);
    } catch (e) {
      console.error(e);
      alert('Failed to finalize day.');
    } finally {
      setClosing(false);
    }
  }

  // Generate Excel (CSV)
  const exportToExcel = async () => {
    const csvContent = [
      ["Stock Yangu - Daily Summary", new Date().toLocaleDateString()],
      [],
      ["METRIC", "AMOUNT (KES)"],
      ["Opening Balance (Total)", openingBal],
      ["Total Recorded Sales", todaySales + addedUnrecordedSalesTotal],
      ["Total Expenses & Deductions", existingExp + totalAddedDeductions],
      ["Net Expected Balance", expectedTotal],
      [],
      ["ACTUAL METRICS (COUNTED)"],
      ["Cash At Hand", countedCash],
      ["M-Pesa At Hand", countedMpesa],
      ["Total Physical Hand", totalHand],
      ["Calculated Variance", variance]
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Check if Web Share API is available (for Mobile native sharing)
    if (navigator.share) {
      const file = new File([blob], `Day_Summary_${new Date().toISOString().split('T')[0]}.csv`, { type: 'text/csv' });
      try {
        await navigator.share({
          title: 'Stock Yangu Daily Summary',
          text: 'Here is the daily reconciliation summary spreadsheet.',
          files: [file]
        });
      } catch (err) {
        console.warn("Share failed, falling back to download", err);
        triggerDownload(url);
      }
    } else {
      triggerDownload(url);
    }
  };

  const triggerDownload = (url) => {
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `StockYangu_Reconciliation_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    loading, step, setStep, closed, closing, setClosed,
    d, closedSummary,
    
    // Step 0: Cash & Mpesa
    cashCount, setCashCount, mpesaCount, setMpesaCount,
    countedCash, countedMpesa, totalHand,

    // Step 1: Deductions
    notes, setNotes, totalAddedDeductions, addedExpAmount, addedRestock,

    // Step 2: Unrecorded Sales
    inventory, unrecordedSales, setUnrecordedSales, addedUnrecordedSalesTotal,

    // Summary
    openingBal, todaySales, existingExp,
    expectedTotal, expectedCashTotal, expectedMpesaTotal, variance,
    
    finalizeDay, exportToExcel
  };
}
