import { useState, useEffect } from 'react';
import api from '../api/client';

const sym = 'KES';

export default function DesktopReconcileScreen() {
  const [loading, setLoading]             = useState(true);
  const [dayData, setDayData]             = useState(null);
  const [cashCount, setCashCount]         = useState('');
  const [mpesaCount, setMpesaCount]       = useState('');
  const [notes, setNotes]                 = useState('');
  const [closing, setClosing]             = useState(false);
  const [closed, setClosed]               = useState(false);
  const [closedSummary, setClosedSummary] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/reconcile/status');
      setDayData(res.data);
      if (res.data.finalized) setClosed(true);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const d            = dayData ?? {};
  const totalRevenue = d.totalSales    ?? 0;
  const cashSales    = d.cashSales     ?? 0;
  const mpesaSales   = d.mpesaSales    ?? 0;
  const totalExpenses= d.totalExpenses ?? 0;
  const txCount      = d.saleCount     ?? 0;
  const netProfit    = totalRevenue - totalExpenses;
  const expectedCash = d.expectedCash  ?? 0;
  const expectedMpesa= d.expectedMpesa ?? 0;

  const countedCash  = parseFloat(cashCount)  || 0;
  const countedMpesa = parseFloat(mpesaCount) || 0;
  const cashVariance  = cashCount  !== '' ? countedCash  - expectedCash  : null;
  const mpesaVariance = mpesaCount !== '' ? countedMpesa - expectedMpesa : null;

  const cashEntered  = cashCount  !== '';
  const mpesaEntered = mpesaCount !== '';
  const allEntered   = cashEntered && mpesaEntered;
  const cashOk       = cashVariance  === 0;
  const mpesaOk      = mpesaVariance === 0;
  const allOk        = cashOk && mpesaOk;
  const totalVariance= Math.abs(cashVariance ?? 0) + Math.abs(mpesaVariance ?? 0);

  async function handleCloseDay() {
    if (!allEntered) return;
    setClosing(true);
    try {
      const res = await api.post('/reconcile/finalize', {
        cashClosing: countedCash, mpesaClosing: countedMpesa, notes,
      });
      setClosedSummary(res.data.summary);
      setClosed(true);
    } catch (e) { console.error(e); }
    finally { setClosing(false); }
  }

  // ─── CLOSED ───────────────────────────────────────────────────────────────
  if (closed) {
    const s = closedSummary ?? {};
    return (
      <div style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <div style={{ fontSize: 72 }}>🌙</div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 900, margin: 0 }}>Day Closed</h2>
          <p style={{ color: 'var(--text-3)', marginTop: 6 }}>All records saved. Ready for tomorrow.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, width: '100%', maxWidth: 700 }}>
          <StatCard label="Total Revenue"  value={`${sym} ${(s.totalSales ?? totalRevenue).toLocaleString()}`}              color="var(--primary)" />
          <StatCard label="Total Expenses" value={`${sym} ${(s.totalExpenses ?? totalExpenses).toLocaleString()}`}           color="var(--warn)" />
          <StatCard label="Net Profit"     value={`${sym} ${(s.profit ?? netProfit).toLocaleString()}`}                      color={netProfit >= 0 ? 'var(--primary)' : 'var(--danger)'} />
        </div>
        {(s.totalVariance > 0) && (
          <div style={{ padding: '12px 20px', borderRadius: 'var(--radius)', background: 'rgba(231,76,60,0.1)', border: '1px solid var(--danger)', fontSize: 13, color: 'var(--danger)' }}>
            ⚠ Variance recorded: {sym} {(s.totalVariance ?? totalVariance).toLocaleString()}
          </div>
        )}
      </div>
    );
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 12 }}>
      <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      <span style={{ color: 'var(--text-3)' }}>Loading today's figures…</span>
    </div>
  );

  return (
    <div style={{ overflowY: 'auto', padding: 28, maxWidth: 1100, margin: '0 auto' }}>

      {/* Page title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 900, margin: 0 }}>⚖️ End of Day Balance</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Count your money and reconcile today's transactions</p>
      </div>

      {/* ── Row 1: KPI cards ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Revenue"  value={`${sym} ${totalRevenue.toLocaleString()}`}   sub={`${txCount} sales`} color="var(--primary)" />
        <StatCard label="Cash Sales"     value={`${sym} ${cashSales.toLocaleString()}`}      sub="Physical cash"      color="var(--accent)" />
        <StatCard label="M-Pesa Sales"   value={`${sym} ${mpesaSales.toLocaleString()}`}     sub="Mobile money"       color="#7C5CBF" />
        <StatCard label="Expenses"       value={`${sym} ${totalExpenses.toLocaleString()}`}   sub="Paid out"          color="var(--warn)" />
      </div>

      {/* Net profit banner */}
      <div style={{
        padding: '14px 20px', borderRadius: 'var(--radius-lg)', marginBottom: 24,
        background: netProfit >= 0 ? 'var(--primary-dim)' : 'rgba(231,76,60,0.1)',
        border: `1px solid ${netProfit >= 0 ? 'var(--primary)' : 'var(--danger)'}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 700 }}>NET PROFIT (BEFORE TAX)</span>
        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 26, color: netProfit >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
          {sym} {netProfit.toLocaleString()}
        </span>
      </div>

      {/* ── Row 2: Count inputs + Verdict side by side ─────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* Left: count your money */}
        <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 16, marginBottom: 4 }}>🔢 Count Your Money</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>Physically count cash & check M-Pesa statement</div>

          {/* Cash */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <label style={{ fontWeight: 700, fontSize: 13 }}>💵 Cash in Hand</label>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                Expected: <strong style={{ color: 'var(--text)' }}>{sym} {expectedCash.toLocaleString()}</strong>
              </span>
            </div>
            <input
              type="number" inputMode="numeric"
              placeholder="Count bills & coins — enter total"
              value={cashCount} onChange={e => setCashCount(e.target.value)}
              className="input"
              style={{ fontSize: 22, fontWeight: 800, textAlign: 'center' }}
            />
            {d.cashOpening > 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                = {sym} {(d.cashOpening ?? 0).toLocaleString()} opening + {sym} {cashSales.toLocaleString()} cash sales − {sym} {(d.cashExpenses ?? 0).toLocaleString()} expenses
              </div>
            )}
            {cashEntered && <VarianceChip variance={cashVariance} ok={cashOk} sym={sym} label="Cash" />}
          </div>

          {/* M-Pesa */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <label style={{ fontWeight: 700, fontSize: 13 }}>📱 M-Pesa Balance</label>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                Expected: <strong style={{ color: 'var(--text)' }}>{sym} {expectedMpesa.toLocaleString()}</strong>
              </span>
            </div>
            <input
              type="number" inputMode="numeric"
              placeholder="Check M-Pesa app — enter balance"
              value={mpesaCount} onChange={e => setMpesaCount(e.target.value)}
              className="input"
              style={{ fontSize: 22, fontWeight: 800, textAlign: 'center' }}
            />
            {mpesaEntered && <VarianceChip variance={mpesaVariance} ok={mpesaOk} sym={sym} label="M-Pesa" />}
          </div>
        </div>

        {/* Right: verdict + close */}
        <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 16, marginBottom: 4 }}>⚖️ Verdict</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>Your count vs system expectation</div>

          {!allEntered ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
              ← Enter cash & M-Pesa amounts to see your balance check
            </div>
          ) : allOk ? (
            <div style={{
              padding: 28, borderRadius: 'var(--radius)', textAlign: 'center',
              background: 'var(--primary-dim)', border: '2px solid var(--primary)', marginBottom: 20,
            }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>✅</div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 900, color: 'var(--primary)' }}>Perfect Balance!</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6 }}>Cash and M-Pesa match the system exactly.</div>
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                padding: '14px 16px', borderRadius: 'var(--radius)',
                background: 'rgba(231,76,60,0.08)', border: '2px solid var(--danger)',
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
              }}>
                <span style={{ fontSize: 28 }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--danger)' }}>Off by {sym} {totalVariance.toLocaleString()}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Review entries or add a note below</div>
                </div>
              </div>
              {!cashOk && (
                <MismatchCard label="💵 Cash" sym={sym}
                  expected={expectedCash} counted={countedCash} variance={cashVariance} />
              )}
              {!mpesaOk && (
                <MismatchCard label="📱 M-Pesa" sym={sym}
                  expected={expectedMpesa} counted={countedMpesa} variance={mpesaVariance} />
              )}
            </div>
          )}

          {allEntered && (
            <>
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Notes (optional) — explain variance, e.g. 'gave KES 200 change from opening float'"
                rows={3} className="input"
                style={{ resize: 'none', fontSize: 13, marginBottom: 14 }}
              />
              <button
                className="btn btn-lg"
                style={{
                  width: '100%',
                  background: allOk ? 'var(--primary)' : 'var(--warn)',
                  color: '#fff', fontWeight: 900, fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  border: 'none', borderRadius: 'var(--radius)', padding: '16px 0', cursor: 'pointer',
                }}
                onClick={handleCloseDay}
                disabled={closing}
              >
                {closing
                  ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: '#fff', borderTopColor: 'transparent' }} /> Closing…</>
                  : allOk
                    ? '🌙 Close the Day'
                    : `⚠️ Close Anyway (${sym} ${totalVariance.toLocaleString()} variance)`
                }
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)',
      padding: '18px 20px', border: '1px solid var(--border)',
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 6 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 22, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function VarianceChip({ variance, ok, sym, label }) {
  return (
    <div style={{
      marginTop: 8, padding: '8px 14px', borderRadius: 'var(--radius)',
      background: ok ? 'var(--primary-dim)' : 'rgba(231,76,60,0.1)',
      border: `1px solid ${ok ? 'var(--primary)' : 'var(--danger)'}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: ok ? 'var(--primary)' : 'var(--danger)' }}>
        {ok ? `✅ ${label} matches!` : `⚠️ ${label} off by ${sym} ${Math.abs(variance).toLocaleString()}`}
      </span>
      {!ok && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{variance > 0 ? `+${variance}` : `${variance}`}</span>}
    </div>
  );
}

function MismatchCard({ label, sym, expected, counted, variance }) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 'var(--radius)',
      background: 'var(--surface-3)', border: '1px solid var(--border-md)', marginBottom: 10,
    }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: 'var(--text-3)' }}>Expected</span>
        <span style={{ fontWeight: 600 }}>{sym} {expected.toLocaleString()}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: 'var(--text-3)' }}>You counted</span>
        <span style={{ fontWeight: 600 }}>{sym} {counted.toLocaleString()}</span>
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 900,
        marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--border)',
      }}>
        <span>Difference</span>
        <span style={{ color: variance > 0 ? 'var(--primary)' : 'var(--danger)' }}>
          {variance > 0 ? '+' : ''}{sym} {variance.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
