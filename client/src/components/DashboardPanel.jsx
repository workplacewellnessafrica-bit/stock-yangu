import { useEffect, useState } from 'react';
import api from '../api/client';
import { usePosStore } from '../stores/posStore';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';

function KPICard({ label, value, sub, color, icon }) {
  return (
    <div className="kpi-card" style={{ borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="kpi-label">{label}</div>
          <div className="kpi-value" style={{ color }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
        </div>
        <span style={{ fontSize: 28 }}>{icon}</span>
      </div>
    </div>
  );
}

export default function DashboardPanel() {
  const { todaySales, todayExpenses, setTodaySales, setTodayExpenses, dayRecord, setDayRecord } = usePosStore();
  const { isOnline } = useUIStore();
  const { business } = useAuthStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dayRecord) return;
    setLoading(true);
    api.get('/sales/today').then(r => {
      setDayRecord(r.data);
      setTodaySales(r.data.sales || []);
      setTodayExpenses(r.data.expenses || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const activeSales = todaySales.filter(s => !s.voided);
  const revenue   = activeSales.reduce((s, x) => s + x.total, 0);
  const expenses  = todayExpenses.reduce((s, x) => s + x.amount, 0);
  const cashTotal = activeSales.filter(s => s.paymentMethod === 'cash').reduce((s, x) => s + x.total, 0);
  const mpesaTotal = activeSales.filter(s => s.paymentMethod === 'mpesa').reduce((s, x) => s + x.total, 0);
  const profit    = revenue - expenses;

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 900 }}>Today's Overview</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>
            {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: isOnline ? 'var(--primary)' : 'var(--warn)', background: isOnline ? 'var(--primary-dim)' : 'rgba(251,191,36,0.12)', padding: '6px 12px', borderRadius: 'var(--radius-full)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
            {isOnline ? 'Live' : 'Offline'}
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <KPICard label="Total Revenue"  value={`KES ${revenue.toFixed(0)}`}    sub={`${activeSales.length} transactions`} color="var(--primary)" icon="💰" />
        <KPICard label="Cash Sales"     value={`KES ${cashTotal.toFixed(0)}`}   sub="Physical cash"                        color="var(--cash)"    icon="💵" />
        <KPICard label="M-Pesa Sales"   value={`KES ${mpesaTotal.toFixed(0)}`}  sub="Mobile money"                         color="var(--mpesa)"   icon="📱" />
        <KPICard label="Expenses"       value={`KES ${expenses.toFixed(0)}`}    sub={`${todayExpenses.length} entries`}    color="var(--danger)"  icon="💸" />
        <KPICard label="Net Profit"     value={`KES ${profit.toFixed(0)}`}      sub="Revenue - Expenses"                   color={profit >= 0 ? 'var(--primary)' : 'var(--danger)'} icon="📈" />
      </div>

      {loading && <div className="flex items-center justify-center" style={{ padding: 32 }}><div className="spinner" /></div>}

      {/* Live sale feed */}
      {!loading && (
        <div className="card">
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700 }}>📋 Live Sales Feed</span>
            <span className="badge badge-gray">{activeSales.length} sales</span>
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {activeSales.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                No sales yet today.{' '}
                <button onClick={() => window.location.hash = '#pos'} style={{ color: 'var(--primary)', fontWeight: 700 }}>
                  Start selling →
                </button>
              </div>
            )}
            {activeSales.map(s => (
              <div key={s.id} className="flex items-center gap-3" style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 26 }}>{s.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{s.itemName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.qty} {s.unit} · {s.staff?.name || 'Admin'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--primary)' }}>KES {s.total}</div>
                  <span className={`badge ${s.paymentMethod === 'mpesa' ? 'badge-mpesa' : 'badge-cash'}`}>
                    {s.paymentMethod}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
