import { useEffect, useState } from 'react';
import api from '../api/client';
import { usePosStore } from '../stores/posStore';
import { format, parseISO } from 'date-fns';

function SaleRow({ sale, onVoid }) {
  return (
    <div className="flex items-center gap-3" style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 28, flex: '0 0 auto' }}>{sale.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sale.itemName}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {sale.qty} {sale.unit} · {sale.staff?.name || 'Admin'} · {format(new Date(sale.timestamp), 'HH:mm')}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--primary)' }}>
          KES {sale.total}
        </div>
        <span className={`badge ${sale.paymentMethod === 'mpesa' ? 'badge-mpesa' : sale.paymentMethod === 'card' ? '' : 'badge-cash'}`}
          style={sale.paymentMethod === 'card' ? { background: 'rgba(99,102,241,0.15)', color: '#6366F1' } : {}}>
          {sale.paymentMethod === 'mpesa' ? '📱' : sale.paymentMethod === 'card' ? '💳' : '💵'} {sale.paymentMethod}
        </span>
      </div>
      {onVoid && (
        <button
          className="btn btn-sm btn-danger"
          onClick={() => onVoid(sale.id)}
          style={{ flexShrink: 0, marginLeft: 4 }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default function LogScreen() {
  const { todaySales, todayExpenses, setTodaySales, setTodayExpenses, dayRecord, setDayRecord } = usePosStore();
  const [view, setView] = useState('sales');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/sales/today').then(r => {
      setDayRecord(r.data);
      setTodaySales(r.data.sales || []);
      setTodayExpenses(r.data.expenses || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function voidSale(id) {
    if (!confirm('Void this sale? Stock will be returned.')) return;
    try {
      await api.delete(`/sales/${id}`);
      setTodaySales(todaySales.filter(s => s.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Void failed');
    }
  }

  const activeSales = todaySales.filter(s => !s.voided);
  const totalSales  = activeSales.reduce((s, x) => s + x.total, 0);
  const totalExp    = todayExpenses.reduce((s, x) => s + x.amount, 0);

  return (
    <div className="flex-col h-full">
      {/* KPI row */}
      <div className="flex gap-3" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0, overflowX: 'auto' }}>
        {[
          { label: 'Sales', value: `KES ${totalSales.toFixed(0)}`, color: 'var(--primary)' },
          { label: 'Expenses', value: `KES ${totalExp.toFixed(0)}`, color: 'var(--cash)' },
          { label: 'Profit', value: `KES ${(totalSales - totalExp).toFixed(0)}`, color: totalSales - totalExp >= 0 ? 'var(--primary)' : 'var(--danger)' },
          { label: 'Txns', value: activeSales.length, color: 'var(--text-2)' },
        ].map(k => (
          <div key={k.label} style={{ flexShrink: 0, background: 'var(--surface-2)', padding: '10px 16px', borderRadius: 'var(--radius)', minWidth: 90 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>{k.label}</div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 18, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* View tabs */}
      <div className="flex" style={{ padding: '8px 16px', gap: 8, flexShrink: 0 }}>
        {[['sales', '💰 Sales'], ['expenses', '💸 Expenses']].map(([v, l]) => (
          <button key={v} onClick={() => setView(v)}
            className={`chip ${view === v ? 'active' : ''}`}>
            {l} {v === 'sales' ? `(${activeSales.length})` : `(${todayExpenses.length})`}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center" style={{ padding: 48 }}>
            <div className="spinner" />
          </div>
        )}

        {!loading && view === 'sales' && (
          activeSales.length === 0
            ? <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>💰 No sales yet today</div>
            : activeSales.map(s => <SaleRow key={s.id} sale={s} onVoid={!dayRecord?.finalized ? voidSale : null} />)
        )}

        {!loading && view === 'expenses' && (
          todayExpenses.length === 0
            ? <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>💸 No expenses today</div>
            : todayExpenses.map(e => (
              <div key={e.id} className="flex items-center gap-3" style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 24 }}>💸</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{e.category}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{e.description || ''} · {format(new Date(e.timestamp), 'HH:mm')}</div>
                </div>
                <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--cash)' }}>KES {e.amount}</span>
              </div>
            ))
        )}
      </div>

      {/* Add expense FAB */}
      <AddExpenseFab onAdd={(exp) => setTodayExpenses([...todayExpenses, exp])} />
    </div>
  );
}

function AddExpenseFab({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: 'restock', amount: '', description: '', paymentMethod: 'cash' });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.amount) return;
    setSaving(true);
    try {
      const { data } = await api.post('/expenses', { ...form, amount: parseFloat(form.amount) });
      onAdd(data);
      setOpen(false);
      setForm({ category: 'restock', amount: '', description: '', paymentMethod: 'cash' });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    } finally { setSaving(false); }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn btn-accent"
        style={{ position: 'fixed', bottom: 80, right: 16, borderRadius: '50%', width: 56, height: 56, fontSize: 24, boxShadow: 'var(--shadow-lg)', padding: 0, zIndex: 10 }}
      >
        +
      </button>
      {open && (
        <>
          <div className="overlay" onClick={() => setOpen(false)} />
          <div className="sheet" style={{ padding: '20px 20px 24px' }}>
            <div style={{ width: 40, height: 4, background: 'var(--border-md)', borderRadius: 2, margin: '0 auto 20px' }} />
            <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 20, marginBottom: 20 }}>💸 Log Expense</h3>
            <div className="flex-col gap-3">
              <div className="input-group">
                <label className="input-label">Category</label>
                <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {['restock','rent','labor','utilities','transport','supplies','other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Amount (KES)</label>
                <input className="input" type="number" placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Note (optional)</label>
                <input className="input" placeholder="e.g. Bought sukuma restock" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                {['cash','mpesa'].map(p => (
                  <button key={p} onClick={() => setForm(f => ({ ...f, paymentMethod: p }))}
                    className={`pay-option ${form.paymentMethod === p ? 'selected' : ''} ${p === 'cash' ? 'cash-opt' : 'mpesa-opt'}`}>
                    <span style={{ fontSize: 22 }}>{p === 'cash' ? '💵' : '📱'}</span>
                    <span className="pay-label">{p === 'cash' ? 'Cash' : 'M-Pesa'}</span>
                  </button>
                ))}
              </div>
              <button className="btn btn-accent btn-lg btn-full" onClick={save} disabled={saving || !form.amount}>
                {saving ? 'Saving…' : '💸 Log Expense'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
