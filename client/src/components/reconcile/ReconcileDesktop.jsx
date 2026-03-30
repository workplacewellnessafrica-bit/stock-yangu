import React, { useState } from 'react';

const sym = 'KES';

function SecHead({ icon, title, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, letterSpacing: 1, color, fontFamily: 'var(--font-head)' }}>{title}</h3>
    </div>
  );
}

function SumRow({ label, value, color, big }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <span style={{ fontSize: big ? 14 : 12, color: 'var(--text-3)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: big ? 20 : 15, color }}>{value}</span>
    </div>
  );
}

export default function ReconcileDesktop({ hookData }) {
  const {
    loading, step, setStep, closed, closing, setClosed, d, closedSummary,
    cashCount, setCashCount, mpesaCount, setMpesaCount, countedCash, countedMpesa, totalHand,
    notes, setNotes, totalAddedDeductions, addedExpAmount, addedRestock,
    inventory, unrecordedSales, setUnrecordedSales, addedUnrecordedSalesTotal,
    openingBal, todaySales, existingExp, expectedTotal, expectedCashTotal, expectedMpesaTotal, variance,
    finalizeDay, exportToExcel
  } = hookData;

  const [newNote, setNewNote] = useState({ label: '', amount: '', type: 'expense' });
  const [newSale, setNewSale] = useState({ itemId: '', qty: '', unitPrice: '' });

  const steps = ["Count Money", "Record Deductions", "Missed Sales", "Summary"];

  const addNote = () => {
    if (!newNote.label || !newNote.amount) return;
    setNotes(p => [...p, { ...newNote, id: Date.now(), amount: parseFloat(newNote.amount) }]);
    setNewNote({ label: "", amount: "", type: "expense" });
  };

  const removeNote = (id) => setNotes(p => p.filter(x => x.id !== id));

  const addSale = () => {
    if (!newSale.itemId || !newSale.qty || !newSale.unitPrice) return;
    const item = inventory.find(i => i.id === parseInt(newSale.itemId));
    if (!item) return;
    setUnrecordedSales(p => [...p, {
      ...newSale, id: Date.now(),
      name: item.name,
      qty: parseFloat(newSale.qty),
      unitPrice: parseFloat(newSale.unitPrice)
    }]);
    setNewSale({ itemId: "", qty: "", unitPrice: "" });
  };

  // ─── CLOSED STATE ─────────────────────────────────────────────────────────
  if (closed) {
    const s = closedSummary ?? {};
    return (
      <div style={{ padding: 40, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
        <div style={{ fontSize: 72, marginBottom: 20 }}>🌙</div>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 900, marginBottom: 8, color: 'var(--text-1)' }}>Day Closed Successfully</h2>
        <p style={{ color: 'var(--text-3)', marginBottom: 32, fontSize: 16 }}>All records saved and verified. Ready for tomorrow.</p>
        <div style={{
          background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', padding: 24,
          border: '1px solid var(--border)', textAlign: 'left',
        }}>
          <SumRow label="Total Revenue (Recorded + Added)"  value={`${sym} ${(todaySales + addedUnrecordedSalesTotal).toLocaleString()}`} color="var(--primary)" />
          <SumRow label="Total Expenses & Restock" value={`${sym} ${(existingExp + totalAddedDeductions).toLocaleString()}`} color="var(--danger)" />
          <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0' }} />
          <SumRow label="Net Expected Hand" value={`${sym} ${(expectedTotal).toLocaleString()}`} color="var(--accent)" big />
          <SumRow label="Actual Counted" value={`${sym} ${(totalHand).toLocaleString()}`} color="var(--primary)" big />
          
          {variance !== 0 && (
            <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 8, background: 'rgba(231,76,60,0.1)', fontSize: 14, color: 'var(--danger)', fontWeight: 600 }}>
              ⚠ Final Variance Recorded: {sym} {variance.toLocaleString()}
            </div>
          )}
        </div>
        
        <button className="btn" style={{ marginTop: 24, fontSize: 16, padding: "12px 24px", background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-1)' }} onClick={exportToExcel}>
          <span style={{ marginRight: 8}}>📥</span> Export CSV Summary
        </button>
      </div>
    );
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
      <span style={{ color: 'var(--text-3)', fontSize: 16 }}>Loading today's figures…</span>
    </div>
  );

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', padding: '32px 48px', maxWidth: 1000, margin: '0 auto' }}>
      {/* ── Tabs header ── */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)', margin: '0 0 4px 0', fontFamily: 'var(--font-head)' }}>Day Balance</h1>
        <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
          Reconciliation • {new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
        </div>
        
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          {steps.map((s, i) => (
            <button key={i} onClick={() => setStep(i)}
                    style={{
                      flex: 1, padding: "12px", borderRadius: 'var(--radius)',
                      background: step === i ? 'var(--accent)' : 'var(--surface-2)',
                      color: step === i ? '#111' : 'var(--text-3)',
                      border: `1px solid ${step === i ? 'var(--accent)' : 'var(--border)'}`,
                      fontSize: 13, fontWeight: 800, cursor: "pointer", transition: '0.2s',
                      boxShadow: step === i ? '0 4px 12px rgba(0,255,136,0.2)' : 'none'
                    }}>
              Step {i + 1}: {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius-lg)', padding: 32, border: '1px solid var(--border)' }}>
        
        {/* ── STEP 0: Count Money ── */}
        {step === 0 && (
          <div className="animate-fade-in" style={{ maxWidth: 600, margin: '0 auto' }}>
            <SecHead icon="💰" title="COUNT PHYSICAL MONEY & M-PESA" color="var(--accent)" />
            <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--border)', marginBottom: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8 }}>💵 CASH IN REGISTER</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--text-3)', fontSize: 16 }}>{sym}</span>
                  <input type="number" value={cashCount} onChange={e => setCashCount(e.target.value)} placeholder="0" className="input" style={{ paddingLeft: 64, fontSize: 20, fontWeight: 700, height: 56 }} />
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8 }}>📱 M-PESA END BALANCE</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--text-3)', fontSize: 16 }}>{sym}</span>
                  <input type="number" value={mpesaCount} onChange={e => setMpesaCount(e.target.value)} placeholder="0" className="input" style={{ paddingLeft: 64, fontSize: 20, fontWeight: 700, height: 56 }} />
                </div>
              </div>
              
              <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: "16px 20px", border: '1px solid var(--border)' }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: 'var(--text-3)' }}>Cash Total</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)' }}>{sym} {countedCash.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: 'var(--text-3)' }}>M-Pesa Total</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#7C5CBF' }}>{sym} {countedMpesa.toLocaleString()}</span>
                </div>
                <div style={{ borderTop: `1px solid var(--border)`, paddingTop: 12, marginTop: 8, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-2)' }}>Combined Total Handed</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary)' }}>{sym} {totalHand.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <button className="btn btn-lg" style={{ width: '100%', background: 'var(--accent)', color: '#111', fontWeight: 800, height: 56 }} onClick={() => setStep(1)} disabled={!countedCash && !countedMpesa}>
              Continue to Deductions →
            </button>
          </div>
        )}

        {/* ── STEP 1: Record Deductions ── */}
        {step === 1 && (
          <div className="animate-fade-in" style={{ maxWidth: 600, margin: '0 auto' }}>
            <SecHead icon="📝" title="RECORD ANY UNRECORDED EXPENSES OR RESTOCK" color="var(--warn)" />
            <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--border)', marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {[["expense", "General Expense", "var(--danger)"], ["restock", "Restock Items", "var(--warn)"]].map(([type, label, color]) => (
                  <button key={type} onClick={() => setNewNote(p => ({...p, type}))}
                          style={{
                            flex: 1, padding: "12px", borderRadius: 8,
                            background: newNote.type === type ? color + '22' : 'var(--bg)',
                            color: newNote.type === type ? color : 'var(--text-3)',
                            border: `1px solid ${newNote.type === type ? color : 'var(--border)'}`,
                            fontSize: 13, fontWeight: 800, cursor: "pointer", transition: '0.2s'
                          }}>
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ marginBottom: 16 }}>
                <input value={newNote.label} onChange={e => setNewNote(p => ({...p, label: e.target.value}))} placeholder="Description (e.g. Fare to market)" className="input" style={{ fontSize: 15, padding: 14 }} />
              </div>
              <div style={{ marginBottom: 20, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--text-3)' }}>{sym}</span>
                <input type="number" value={newNote.amount} onChange={e => setNewNote(p => ({...p, amount: e.target.value}))} placeholder="Amount" className="input" style={{ paddingLeft: 64, fontSize: 16, fontWeight: 700, padding: 14 }} />
              </div>
              <button className="btn" style={{ width: '100%', padding: 14, background: 'transparent', border: '2px solid var(--warn)', color: 'var(--warn)', fontWeight: 800, fontSize: 15 }} onClick={addNote} disabled={!newNote.label || !newNote.amount}>
                + Add Record
              </button>
            </div>
            
            {notes.length > 0 && (
              <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', padding: 20, border: '1px solid var(--border)', marginBottom: 24 }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 13, color: 'var(--text-2)' }}>Added Deductions</h4>
                {notes.map((n, i) => (
                  <div key={n.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < notes.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{n.label}</div>
                      <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 800, color: n.type==='expense'?'var(--danger)':'var(--warn)', marginTop: 6, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 4 }}>
                        {n.type.toUpperCase()}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--danger)' }}>−{sym} {n.amount.toLocaleString()}</span>
                      <button onClick={() => removeNote(n.id)} style={{ background: "none", border: "none", color: 'var(--text-3)', cursor: "pointer", fontSize: 20, padding: 4 }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ display: "flex", gap: 16 }}>
              <button onClick={() => setStep(0)} className="btn" style={{ flex: 1, padding: 16, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', fontWeight: 700, fontSize: 15 }}>← Back</button>
              <button onClick={() => setStep(2)} className="btn btn-primary" style={{ flex: 2, padding: 16, fontWeight: 800, fontSize: 15 }}>Continue to Sales →</button>
            </div>
          </div>
        )}

         {/* ── STEP 2: Record Missed Sales ── */}
         {step === 2 && (
          <div className="animate-fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
            <SecHead icon="🛒" title="RECORD MISSED EOD SALES" color="var(--accent)" />
            <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--border)', marginBottom: 20 }}>
               
               <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                 <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8 }}>ITEM SOLD</label>
                    <select 
                      value={newSale.itemId} 
                      onChange={(e) => {
                        const it = inventory.find(i => i.id === parseInt(e.target.value));
                        setNewSale(p => ({ ...p, itemId: e.target.value, unitPrice: it ? it.sellingPrice : "" }));
                      }}
                      className="input"
                      style={{ width: '100%', fontSize: 15, padding: 14 }}
                    >
                      <option value="">-- Choose Item --</option>
                      {inventory.map(i => (
                        <option key={i.id} value={i.id}>{i.name} (Stock: {i.stockCount})</option>
                      ))}
                    </select>
                 </div>
                 
                 <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8 }}>QUANTITY</label>
                    <input type="number" value={newSale.qty} onChange={e => setNewSale(p => ({...p, qty: e.target.value}))} placeholder="1" className="input" style={{ width: '100%', fontSize: 15, padding: 14 }} />
                 </div>

                 <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8 }}>PRICE ({sym})</label>
                    <input type="number" value={newSale.unitPrice} onChange={e => setNewSale(p => ({...p, unitPrice: e.target.value}))} placeholder="0" className="input" style={{ width: '100%', fontSize: 15, padding: 14 }} />
                 </div>
               </div>

               <button className="btn" style={{ width: '100%', padding: 14, background: 'transparent', border: '2px solid var(--accent)', color: 'var(--accent)', fontWeight: 800, fontSize: 15 }} onClick={addSale} disabled={!newSale.itemId || !newSale.qty || !newSale.unitPrice}>
                + Add Sale To Day
              </button>
            </div>

            {unrecordedSales.length > 0 && (
              <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', padding: 20, border: '1px solid var(--border)', marginBottom: 24 }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 13, color: 'var(--text-2)' }}>Added End-Of-Day Sales</h4>
                {unrecordedSales.map((n, i) => (
                  <div key={n.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < unrecordedSales.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{n.name}</div>
                      <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 800, color: 'var(--primary)', marginTop: 6, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 4 }}>
                        {n.qty} units @ {sym} {n.unitPrice}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--primary)' }}>+{sym} {(n.qty * n.unitPrice).toLocaleString()}</span>
                      <button onClick={() => setUnrecordedSales(p => p.filter(x => x.id !== n.id))} style={{ background: "none", border: "none", color: 'var(--text-3)', cursor: "pointer", fontSize: 20, padding: 4 }}>✕</button>
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: '2px solid var(--border)', paddingTop: 12, marginTop: 12, textAlign: 'right' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-3)', marginRight: 16 }}>Total Extra Sales</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)' }}>{sym} {addedUnrecordedSalesTotal.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 16 }}>
              <button onClick={() => setStep(1)} className="btn" style={{ flex: 1, padding: 16, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', fontWeight: 700, fontSize: 15 }}>← Back</button>
              <button onClick={() => setStep(3)} className="btn btn-primary" style={{ flex: 2, padding: 16, fontWeight: 800, fontSize: 15 }}>Review Summary →</button>
            </div>
          </div>
         )}


        {/* ── STEP 3: Day Summary ── */}
        {step === 3 && (
          <div className="animate-fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
            <SecHead icon="📋" title="FINAL RECONCILIATION SUMMARY" color="var(--primary)" />
            
            <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', padding: 32, border: '1px solid var(--border)', marginBottom: 24 }}>
              <SumRow label="Opening Day Balance" value={`${sym} ${openingBal.toLocaleString()}`} color="var(--text-1)" />
              
              <SumRow label="Tracked Shift Sales" value={`${sym} ${todaySales.toLocaleString()}`} color="var(--primary)" />
              {addedUnrecordedSalesTotal > 0 && (
                <SumRow label="Late/EOD Sales Added" value={`+${sym} ${addedUnrecordedSalesTotal.toLocaleString()}`} color="var(--primary)" />
              )}
              
              {existingExp > 0 && <SumRow label="Previously Tracked Expenses" value={`−${sym} ${existingExp.toLocaleString()}`} color="var(--danger)" />}
              {addedExpAmount > 0 && <SumRow label="EOD Expenses Added" value={`−${sym} ${addedExpAmount.toLocaleString()}`} color="var(--danger)" />}
              {addedRestock > 0 && <SumRow label="EOD Restock Added" value={`−${sym} ${addedRestock.toLocaleString()}`} color="var(--warn)" />}
              
              <div style={{ borderTop: `2px solid var(--border)`, margin: '20px 0' }} />
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>System Target Amount</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary)' }}>{sym} {expectedTotal.toLocaleString()}</span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, padding: "16px", background: 'var(--bg)', borderRadius: 'var(--radius-lg)' }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)' }}>Counted Standard Total</span>
                <span style={{ fontSize: 24, fontWeight: 900, color: totalHand >= expectedTotal ? 'var(--accent)' : 'var(--danger)' }}>{sym} {totalHand.toLocaleString()}</span>
              </div>

              {/* Box specifically for variance */}
              <div style={{ 
                padding: 20, borderRadius: 'var(--radius-lg)', 
                background: Math.abs(variance) <= 5 ? 'rgba(0,255,136,0.1)' : 'rgba(231,76,60,0.1)',
                border: `1px solid ${Math.abs(variance) <= 5 ? 'var(--accent)' : 'var(--danger)'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                 <div>
                   <h4 style={{ margin: '0 0 6px 0', fontSize: 15, color: Math.abs(variance) <= 5 ? 'var(--accent)' : 'var(--danger)', fontWeight: 800 }}>Variance Assessment</h4>
                   <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
                     {Math.abs(variance) <= 5 ? "✅ Your count matches the system expectations perfectly." : 
                      variance > 5 ? "⬆️ You counted a surplus compared to the system." : 
                      "⬇️ You are short compared to system expectations."}
                   </span>
                 </div>
                 <div style={{ fontSize: 32, fontWeight: 900, color: Math.abs(variance) <= 5 ? 'var(--accent)' : 'var(--danger)' }}>
                    {variance > 0 ? '+' : ''}{sym} {variance.toLocaleString()}
                 </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              <button onClick={() => setStep(2)} className="btn" style={{ flex: 1, padding: 18, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', fontWeight: 700, fontSize: 16 }} disabled={closing}>Edit</button>
              <button onClick={finalizeDay} className="btn-lg" style={{ 
                flex: 2, padding: 18, background: 'var(--primary)', border: 'none', color: '#fff', fontWeight: 900, fontSize: 16, borderRadius: 'var(--radius)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12
              }} disabled={closing}>
                {closing ? <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 3, borderColor: '#fff', borderTopColor: 'transparent' }} /> Processing & Syncing...</> : '🔒 SUBMIT & CLOSE REGISTER'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
