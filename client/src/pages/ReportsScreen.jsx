import { useState, useEffect } from 'react';
import api from '../api/client';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function ReportsScreen() {
  const [range, setRange] = useState(7);
  const [data, setData]   = useState(null);
  const [topItems, setTop] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, [range]);

  async function load() {
    setLoading(true);
    const to   = format(new Date(), 'yyyy-MM-dd');
    const from = format(subDays(new Date(), range - 1), 'yyyy-MM-dd');
    try {
      const [r, t] = await Promise.all([
        api.get(`/reports/range?from=${from}&to=${to}`),
        api.get(`/reports/top-items?days=${range}`),
      ]);
      setData(r.data);
      setTop(t.data);
    } catch { /**/ }
    finally { setLoading(false); }
  }

  async function exportExcel() {
    const to   = format(new Date(), 'yyyy-MM-dd');
    const from = format(subDays(new Date(), range - 1), 'yyyy-MM-dd');
    window.open(`/api/reports/export?format=xlsx&from=${from}&to=${to}`, '_blank');
  }

  const chartData = data?.days?.map(d => ({
    name: format(new Date(d.date + 'T12:00:00'), 'EEE dd'),
    Sales: d.totalSales,
    Expenses: d.totalExpenses,
    Profit: d.profit,
  })) || [];

  const totals = data?.totals || {};

  return (
    <div className="flex-col h-full overflow-auto" style={{ padding: '16px' }}>
      {/* Range selector */}
      <div className="flex gap-2" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        {[7, 14, 30].map(d => (
          <button key={d} className={`chip ${range === d ? 'active' : ''}`}
            onClick={() => setRange(d)}>Last {d} days</button>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={exportExcel} style={{ marginLeft: 'auto' }}>
          📊 Export Excel
        </button>
      </div>

      {loading && <div className="flex items-center justify-center" style={{ padding: 32 }}><div className="spinner" /></div>}

      {!loading && data && (
        <>
          {/* KPI Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Revenue', val: `KES ${(totals.sales || 0).toFixed(0)}`, color: 'var(--primary)' },
              { label: 'Expenses', val: `KES ${(totals.expenses || 0).toFixed(0)}`, color: 'var(--cash)' },
              { label: 'Profit', val: `KES ${(totals.profit || 0).toFixed(0)}`, color: totals.profit >= 0 ? 'var(--primary)' : 'var(--danger)' },
            ].map(k => (
              <div key={k.label} className="kpi-card">
                <div className="kpi-label">{k.label}</div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 18, color: k.color }}>{k.val}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="card" style={{ padding: '16px 8px', marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, padding: '0 12px 12px', color: 'var(--text-2)' }}>
              Revenue vs Expenses
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border-md)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text-2)', fontSize: 11 }}
                  formatter={(v) => [`KES ${v.toFixed(0)}`, null]}
                />
                <Bar dataKey="Sales"    fill="var(--primary)" radius={[4,4,0,0]} />
                <Bar dataKey="Expenses" fill="var(--cash)"    radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Items */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14 }}>
              🏆 Top Items (by revenue)
            </div>
            {topItems.map((item, i) => (
              <div key={item.itemId} className="flex items-center gap-3" style={{ padding: '10px 16px', borderBottom: i < topItems.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 16, color: i === 0 ? 'var(--cash)' : 'var(--text-muted)', width: 24, textAlign: 'center' }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 26 }}>{item.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{item.itemName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.txCount} transactions</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--primary)' }}>KES {item.total.toFixed(0)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.qty.toFixed(1)} sold</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
