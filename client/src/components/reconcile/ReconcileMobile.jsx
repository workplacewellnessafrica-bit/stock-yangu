import React, { useState } from 'react';

// Common Mobile Styles
const C = {
  bg: "#0A0F0D",       // Very dark green/black
  surface: "#111A15",  // Slightly lighter
  card: "#16221C",     // Card background
  border: "#1E2F26",   // Subtle borders
  accent: "#00FF88",   // Neon green active
  muted: "#6B8E7B",    // Secondary text
  text: "#E8F5EE",     // Primary text
  red: "#FF4444",      // Expenses/negative
  orange: "#FFAA00",   // Restock/warnings
  gold: "#FFD700",     // Sales/revenue
  mpesa: "#25D366",    // M-Pesa green
};

const fmt = (num) => "KES " + (num || 0).toLocaleString();

// Tiny helper UI components
const SectionHeader = ({ icon, title, color }) => (
  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
    <div style={{ 
      background: color+"1A", color: color, 
      width:36, height:36, borderRadius:12, 
      display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 
    }}>
      {icon}
    </div>
    <div style={{ fontSize:15, fontWeight:800, color:C.text }}>{title}</div>
  </div>
);

const Input = ({ label, value, onChange, placeholder, type="text", prefix }) => (
  <div style={{ marginBottom:14 }}>
    <label style={{ display:"block", fontSize:10, fontWeight:800, color:C.muted, marginBottom:6, letterSpacing:0.5 }}>{label}</label>
    <div style={{ position:"relative" }}>
      {prefix && <span style={{ position:"absolute", left:14, top:13, fontSize:13, fontWeight:800, color:C.muted }}>{prefix}</span>}
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width:"100%", padding:`12px 14px 12px ${prefix?50:14}px`,
          background:C.surface, border:`1px solid ${C.border}`, borderRadius:10,
          color:C.text, fontSize:14, fontWeight:700, outline:"none", boxSizing:"border-box"
        }}
        onFocus={e => e.target.style.borderColor = C.accent}
        onBlur={e => e.target.style.borderColor = C.border}
      />
    </div>
  </div>
);

const BigBtn = ({ label, color, onClick, disabled }) => (
  <button 
    onClick={onClick} disabled={disabled}
    style={{
      width:"100%", padding:16, borderRadius:12,
      background: disabled ? C.surface : color,
      color: disabled ? C.muted : "#0F1B0A",
      border: disabled ? `1px solid ${C.border}` : "none",
      fontSize:14, fontWeight:900, letterSpacing:1,
      cursor: disabled ? "not-allowed" : "pointer"
    }}
  >
    {label}
  </button>
);

const Pill = ({ children, color, style }) => (
  <span style={{ 
    display:"inline-block", padding:"2px 6px", borderRadius:4, 
    background:color+"22", color:color, fontSize:9, fontWeight:800, letterSpacing:0.5, ...style 
  }}>
    {children}
  </span>
);

const Row = ({ left, right, dimLeft, accent, sub }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0" }}>
    <div>
      <div style={{ fontSize:12, fontWeight:700, color: dimLeft ? C.muted : C.text }}>{left}</div>
      {sub && <div style={{ fontSize:9, color:C.muted, marginTop:2 }}>{sub}</div>}
    </div>
    <div style={{ fontSize:14, fontWeight:900, color: accent || C.text }}>{right}</div>
  </div>
);


export default function ReconcileMobile({ hookData }) {
  const {
    loading, step, setStep, closed, closing, setClosed, d, closedSummary,
    cashCount, setCashCount, mpesaCount, setMpesaCount, countedCash, countedMpesa, totalHand,
    notes, setNotes, totalAddedDeductions, addedExpAmount, addedRestock,
    inventory, unrecordedSales, setUnrecordedSales, addedUnrecordedSalesTotal,
    openingBal, todaySales, existingExp, expectedTotal, expectedCashTotal, expectedMpesaTotal, variance,
    finalizeDay, exportToExcel
  } = hookData;

  const [newNote, setNewNote] = useState({ label:"", amount:"", type:"expense" });
  const [newSale, setNewSale] = useState({ itemId: "", qty: "", unitPrice: "" });

  const steps = ["Count Money", "Deductions", "Missed Sales", "Summary"];

  const addNote = () => {
    if (!newNote.label || !newNote.amount) return;
    setNotes(p => [...p, {...newNote, id: Date.now(), amount: parseFloat(newNote.amount)}]);
    setNewNote({ label:"", amount:"", type:"expense" });
  };

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

  if (loading) {
    return (
      <div style={{ background:C.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ color:C.accent, fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ background:C.bg, minHeight:"100vh", paddingBottom: 20 }}>
      {/* Header */}
      <div style={{ background:C.surface, padding:"12px 14px 10px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ fontSize:16, fontWeight:900, color:C.accent }}>Daily Reconciliation</div>
        <div style={{ fontSize:9, color:C.muted, fontWeight:700, letterSpacing:1, marginTop:1 }}>
          RECONCILIATION • {new Date().toLocaleDateString("en-KE",{weekday:"long",day:"numeric",month:"short"}).toUpperCase()}
        </div>
        
        {!closed && (
          <div style={{ display:"flex", gap:4, marginTop:10 }}>
            {steps.map((s,i) => (
              <button key={i} onClick={() => setStep(i)} style={{
                flex:1, padding:"6px 2px", borderRadius:8,
                background: step===i ? C.accent : C.card, color: step===i ? "#0F1B0A" : C.muted,
                border:`1px solid ${step===i ? C.accent : C.border}`, fontSize:9, fontWeight:800, cursor:"pointer",
              }}>{i+1}.</button>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding:"14px 14px 16px" }}>
        {/* STEP 0 - Count money */}
        {step === 0 && !closed && (
          <>
            <SectionHeader icon="💰" title="Count Your Money Now" color={C.gold} />
            <div style={{ background:C.card, borderRadius:14, padding:"14px", border:`1px solid ${C.border}`, marginBottom:12 }}>
              <Input label="💵 CASH (Physical)" value={cashCount} onChange={setCashCount} type="number" placeholder="0" prefix="KES" />
              <Input label="📱 M-PESA (Balance)" value={mpesaCount} onChange={setMpesaCount} type="number" placeholder="0" prefix="KES" />
              {(countedCash > 0 || countedMpesa > 0) && (
                <div style={{ background:C.surface, borderRadius:10, padding:"10px 12px", border:`1px solid ${C.border}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:11, color:C.muted }}>Cash</span>
                    <span style={{ fontSize:13, fontWeight:800, color:C.accent }}>{fmt(countedCash)}</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:11, color:C.muted }}>M-Pesa</span>
                    <span style={{ fontSize:13, fontWeight:800, color:C.mpesa }}>{fmt(countedMpesa)}</span>
                  </div>
                  <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:6, marginTop:6, display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:11, fontWeight:800, color:C.muted }}>TOTAL</span>
                    <span style={{ fontSize:16, fontWeight:900, color:C.gold }}>{fmt(totalHand)}</span>
                  </div>
                </div>
              )}
            </div>
            <BigBtn label="CONTINUE →" color={C.accent} onClick={() => setStep(1)} disabled={!countedCash && !countedMpesa} />
          </>
        )}

        {/* STEP 1 - Record deductions */}
        {step === 1 && !closed && (
          <>
            <SectionHeader icon="📝" title="Record Expenses / Restock" color={C.orange} />
            <div style={{ background:C.card, borderRadius:14, padding:"14px", border:`1px solid ${C.border}`, marginBottom:10 }}>
              <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                {["expense","restock"].map(t => (
                  <button key={t} onClick={() => setNewNote(p => ({...p, type:t}))} style={{
                    flex:1, padding:"6px 4px", borderRadius:8,
                    background: newNote.type===t ? (t==="expense"?C.red:C.orange)+"33" : C.surface,
                    color: newNote.type===t ? (t==="expense"?C.red:C.orange) : C.muted,
                    border:`1px solid ${newNote.type===t ? (t==="expense"?C.red:C.orange) : C.border}`,
                    fontSize:9, fontWeight:800, cursor:"pointer",
                  }}>
                    {t==="expense"?"💸 EXPENSE":"📦 RESTOCK"}
                  </button>
                ))}
              </div>
              <Input label="DESCRIPTION" value={newNote.label} onChange={v => setNewNote(p => ({...p, label:v}))} placeholder="e.g. Transport" />
              <Input label="AMOUNT" value={newNote.amount} onChange={v => setNewNote(p => ({...p, amount:v}))} type="number" placeholder="0" prefix="KES" />
              <BigBtn label="+ ADD" color={C.orange} onClick={addNote} disabled={!newNote.label||!newNote.amount} />
            </div>
            {notes.length > 0 && (
              <div style={{ background:C.card, borderRadius:14, padding:"12px 14px", border:`1px solid ${C.border}`, marginBottom:10 }}>
                {notes.map(n => (
                  <div key={n.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${C.border}` }}>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{n.label}</div>
                      <Pill color={n.type==="expense"?C.red:C.orange} style={{marginTop:2}}>{n.type.toUpperCase()}</Pill>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:13, fontWeight:900, color:C.red }}>-{fmt(n.amount)}</span>
                      <button onClick={() => setNotes(p => p.filter(x => x.id!==n.id))} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:14 }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setStep(0)} style={{ flex:1, padding:12, borderRadius:10, background:C.card, border:`1px solid ${C.border}`, color:C.muted, fontSize:13, fontWeight:700, cursor:"pointer" }}>← Back</button>
              <button onClick={() => setStep(2)} style={{ flex:2, padding:12, borderRadius:10, background:C.accent, border:"none", color:"#0F1B0A", fontSize:13, fontWeight:900, cursor:"pointer" }}>CONTINUE →</button>
            </div>
          </>
        )}

        {/* STEP 2 - Record Sales (EOD) */}
        {step === 2 && !closed && (
          <>
             <SectionHeader icon="🛒" title="Record Missed Sales" color={C.gold} />
             <div style={{ background:C.card, borderRadius:14, padding:"14px", border:`1px solid ${C.border}`, marginBottom:10 }}>
                <label style={{ display:"block", fontSize:10, fontWeight:800, color:C.muted, marginBottom:6, letterSpacing:0.5 }}>SELECT ITEM</label>
                <select 
                  value={newSale.itemId} 
                  onChange={(e) => {
                    const it = inventory.find(i => i.id === parseInt(e.target.value));
                    setNewSale(p => ({ ...p, itemId: e.target.value, unitPrice: it ? it.sellingPrice : "" }));
                  }}
                  style={{
                    width:"100%", padding:`12px 14px`, marginBottom: 14,
                    background:C.surface, border:`1px solid ${C.border}`, borderRadius:10,
                    color:C.text, fontSize:14, fontWeight:700, outline:"none", boxSizing:"border-box"
                  }}
                >
                  <option value="">-- Choose Item --</option>
                  {inventory.map(i => (
                    <option key={i.id} value={i.id}>{i.name} (Max: {i.stockCount})</option>
                  ))}
                </select>

                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <Input label="QUANTITY" value={newSale.qty} onChange={v => setNewSale(p => ({...p, qty:v}))} type="number" placeholder="1" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Input label="UNIT PRICE" value={newSale.unitPrice} onChange={v => setNewSale(p => ({...p, unitPrice:v}))} type="number" placeholder="0" />
                  </div>
                </div>

                <BigBtn label="+ ADD SALE" color={C.gold} onClick={addSale} disabled={!newSale.itemId||!newSale.qty||!newSale.unitPrice} />
             </div>

             {unrecordedSales.length > 0 && (
              <div style={{ background:C.card, borderRadius:14, padding:"12px 14px", border:`1px solid ${C.border}`, marginBottom:10 }}>
                {unrecordedSales.map(n => (
                  <div key={n.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${C.border}` }}>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{n.name}</div>
                      <Pill color={C.accent} style={{marginTop:2}}>{n.qty} x {fmt(n.unitPrice)}</Pill>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:13, fontWeight:900, color:C.accent }}>+{fmt(n.qty * n.unitPrice)}</span>
                      <button onClick={() => setUnrecordedSales(p => p.filter(x => x.id!==n.id))} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:14 }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setStep(1)} style={{ flex:1, padding:12, borderRadius:10, background:C.card, border:`1px solid ${C.border}`, color:C.muted, fontSize:13, fontWeight:700, cursor:"pointer" }}>← Back</button>
              <button onClick={() => setStep(3)} style={{ flex:2, padding:12, borderRadius:10, background:C.accent, border:"none", color:"#0F1B0A", fontSize:13, fontWeight:900, cursor:"pointer" }}>SUMMARY →</button>
            </div>
          </>
        )}

        {/* STEP 3 - Summary & reconciliation */}
        {step === 3 && !closed && (
          <>
            <SectionHeader icon="📊" title="Daily Summary" color={C.accent} />
            <div style={{ background:C.card, borderRadius:14, padding:"14px", border:`1px solid ${C.border}`, marginBottom:12 }}>
              <Row left="Starting Balance" right={fmt(openingBal)} sub="Cash + M-Pesa" dimLeft />
              <Row left="Recorded Sales" right={fmt(todaySales)} accent={C.gold} />
              {unrecordedSales.length > 0 && <Row left="Added Sales (EOD)" right={fmt(addedUnrecordedSalesTotal)} accent={C.gold} />}
              
              {existingExp > 0 && <Row left="Existing Expenses" right={`-${fmt(existingExp)}`} accent={C.red} />}
              {addedExpAmount > 0 && <Row left="Added Expenses" right={`-${fmt(addedExpAmount)}`} accent={C.red} />}
              {addedRestock > 0 && <Row left="Added Restock" right={`-${fmt(addedRestock)}`} accent={C.orange} />}
              
              <div style={{ borderTop:`2px solid ${C.border}`, paddingTop:8, marginTop:4 }}>
                <Row left="EXPECTED TOTAL" right={fmt(expectedTotal)} accent={C.gold} />
                <Row left="ACTUAL (Cash + M-Pesa)" right={fmt(totalHand)} accent={totalHand >= expectedTotal ? C.accent : C.red} />
              </div>
              
              <div style={{ background: Math.abs(variance) < 100 ? C.accent+"22" : C.red+"22", borderRadius:10, padding:"10px 12px", marginTop:10, border:`1px solid ${Math.abs(variance)<100 ? C.accent : C.red}44` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:12, fontWeight:800, color:C.muted }}>VARIANCE</span>
                  <span style={{ fontSize:18, fontWeight:900, color: Math.abs(variance)<100 ? C.accent : C.red }}>
                    {variance >= 0 ? "+" : ""}{fmt(Math.abs(variance))}
                  </span>
                </div>
                <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>
                  {Math.abs(variance) <= 5 ? "✅ Perfectly balanced!" : variance > 5 ? "⬆️ Surplus amount" : "⬇️ Shortfall — check again"}
                </div>
              </div>
            </div>
            
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setStep(2)} style={{ flex:1, padding:12, borderRadius:10, background:C.card, border:`1px solid ${C.border}`, color:C.muted, fontSize:13, fontWeight:700, cursor:"pointer" }}>← Back</button>
              <button onClick={finalizeDay} disabled={closing} style={{ flex:2, padding:12, borderRadius:10, background:C.accent, border:"none", color:"#0F1B0A", fontSize:13, fontWeight:900, cursor: closing ? "not-allowed" : "pointer" }}>
                {closing ? "CLOSING..." : "FINALIZE DAY ✓"}
              </button>
            </div>
          </>
        )}

        {/* COMPLETED VIEW */}
        {closed && (
           <div style={{ textAlign:"center", padding:"30px 0" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
            <div style={{ fontSize:20, fontWeight:900, color:C.accent, marginBottom:8 }}>Day Finalized!</div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:20 }}>Records saved. Ready for tomorrow.</div>
            
            <div style={{ background:C.card, borderRadius:14, padding:14, border:`1px solid ${C.border}`, marginBottom:16 }}>
              <Row left="Net Expected" right={fmt(expectedTotal)} accent={C.gold} />
              <Row left="Actual Handed" right={fmt(totalHand)} accent={C.accent} />
              <Row left="Variance" right={fmt(variance)} accent={variance >= 0 ? C.accent : C.red} />
            </div>

            <button onClick={exportToExcel} style={{
               background: C.gold, color:"#0F1B0A", 
               border:"none", borderRadius:10, padding:"12px 20px", 
               fontSize:14, fontWeight:900, cursor:"pointer", width: "100%", marginBottom: 12
            }}>
              📥 EXPORT / SHARE CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
