import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { useInventoryStore } from '../stores/posStore';

// ─── Item Manager ────────────────────────────────────────────────────────────
function ItemManager() {
  const { items, setItems } = useInventoryStore();
  const [open, setOpen]    = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]    = useState({ name: '', emoji: '📦', category: 'basics', unit: 'piece', sellPrice: '', buyPrice: '', stock: '', threshold: 5 });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/items').then(r => setItems(r.data)).catch(() => {});
  }, []);

  function openNew()  { setForm({ name: '', emoji: '📦', category: 'basics', unit: 'piece', sellPrice: '', buyPrice: '', stock: '', threshold: 5 }); setEditing(null); setOpen(true); }
  function openEdit(item) { setForm({ ...item, sellPrice: item.sellPrice, buyPrice: item.buyPrice || '', stock: item.stock, threshold: item.threshold }); setEditing(item.id); setOpen(true); }

  async function save() {
    if (!form.name || !form.sellPrice) return;
    setSaving(true);
    try {
      if (editing) {
        const { data } = await api.put(`/items/${editing}`, form);
        setItems(items.map(i => i.id === editing ? data : i));
      } else {
        const { data } = await api.post('/items', form);
        setItems([...items, data]);
      }
      setOpen(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    } finally { setSaving(false); }
  }

  const filtered = items.filter(i => search ? i.name.toLowerCase().includes(search.toLowerCase()) : true);

  const UNITS = ['piece','kg','g','litre','ml','dozen','bundle','bag','box'];
  const CATS  = ['vegetables','dairy','basics','drinks','toiletries','meat','electronics','clothing','other'];
  const EMOJIS = ['📦','🥬','🥛','🌾','🥤','🧴','🥩','👕','📱','🍳','🧅','🧄','🌽','🍅','🥔','🧈','🥚','🍞','☕','🧃','🫙','🛒'];

  return (
    <div>
      {/* Search + Add */}
      <div className="flex gap-2" style={{ marginBottom: 14 }}>
        <input className="input" style={{ flex: 1 }} placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add</button>
      </div>

      {/* Item list */}
      <div className="card" style={{ marginBottom: 16 }}>
        {filtered.map(item => (
          <div key={item.id} className="flex items-center gap-3" style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 26 }}>{item.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                Stock: {item.stock} {item.unit} · KES {item.sellPrice}
                {item.stock <= item.threshold && <span style={{ color: 'var(--warn)', marginLeft: 8 }}>⚠️ Low</span>}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>✏️</button>
          </div>
        ))}
      </div>

      {/* Form modal */}
      {open && (
        <>
          <div className="overlay" onClick={() => setOpen(false)} />
          <div className="sheet" style={{ padding: '20px', maxHeight: '80dvh', overflowY: 'auto' }}>
            <div style={{ width: 40, height: 4, background: 'var(--border-md)', borderRadius: 2, margin: '0 auto 20px' }} />
            <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 18, marginBottom: 20 }}>
              {editing ? '✏️ Edit Item' : '+ Add Item'}
            </h3>

            {/* Emoji picker */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 16 }}>
              {EMOJIS.map(e => (
                <button key={e}
                  onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  style={{ fontSize: 26, padding: 8, borderRadius: 8, background: form.emoji === e ? 'var(--primary-dim)' : 'var(--surface-2)', border: `2px solid ${form.emoji === e ? 'var(--primary)' : 'transparent'}` }}>
                  {e}
                </button>
              ))}
            </div>

            <div className="flex-col gap-3">
              <div className="input-group">
                <label className="input-label">Name</label>
                <input className="input" placeholder="e.g. Sukuma Wiki" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="input-group">
                  <label className="input-label">Category</label>
                  <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Unit</label>
                  <select className="input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="input-group">
                  <label className="input-label">Sell Price (KES)</label>
                  <input className="input" type="number" placeholder="0" value={form.sellPrice} onChange={e => setForm(f => ({ ...f, sellPrice: parseFloat(e.target.value) || '' }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Buy Price (KES)</label>
                  <input className="input" type="number" placeholder="optional" value={form.buyPrice} onChange={e => setForm(f => ({ ...f, buyPrice: parseFloat(e.target.value) || '' }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="input-group">
                  <label className="input-label">Current Stock</label>
                  <input className="input" type="number" placeholder="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: parseFloat(e.target.value) || '' }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Low-stock Alert</label>
                  <input className="input" type="number" placeholder="5" value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
              <button className="btn btn-primary btn-full" onClick={save} disabled={saving || !form.name || !form.sellPrice}>
                {saving ? 'Saving…' : editing ? '💾 Update Item' : '+ Add Item'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Staff Manager ───────────────────────────────────────────────────────────
function StaffManager() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', pin: '', role: 'staff' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/staff').then(r => setStaff(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function add() {
    setSaving(true);
    try {
      const { data } = await api.post('/staff', form);
      setStaff([...staff, data]);
      setOpen(false);
      setForm({ name: '', pin: '', role: 'staff' });
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  }

  async function deactivate(id) {
    try {
      await api.delete(`/staff/${id}`);
      setStaff(staff.filter(s => s.id !== id));
    } catch { alert('Failed'); }
  }

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
        <span style={{ fontWeight: 700 }}>👥 Staff ({staff.length})</span>
        <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>+ Add</button>
      </div>

      {loading ? <div className="flex items-center justify-center" style={{ padding: 24 }}><div className="spinner" /></div> : (
        <div className="card">
          {staff.map(s => (
            <div key={s.id} className="flex items-center gap-3" style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--primary)' }}>
                {s.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>PIN: ••••  · {s.role}</div>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => deactivate(s.id)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {open && (
        <>
          <div className="overlay" onClick={() => setOpen(false)} />
          <div className="sheet" style={{ padding: '20px 20px 24px' }}>
            <div style={{ width: 40, height: 4, background: 'var(--border-md)', borderRadius: 2, margin: '0 auto 20px' }} />
            <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 18, marginBottom: 20 }}>+ Add Staff Member</h3>
            <div className="flex-col gap-3">
              <div className="input-group">
                <label className="input-label">Name</label>
                <input className="input" placeholder="Jane Wanjiku" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">4-digit PIN</label>
                <input className="input" type="password" maxLength={4} placeholder="••••" value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g,'').slice(0,4) }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Role</label>
                <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="staff">Staff (cashier)</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <button className="btn btn-primary btn-full" onClick={add} disabled={saving || !form.name || form.pin.length !== 4}>
                {saving ? 'Saving…' : '+ Add Staff'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Admin Screen ─────────────────────────────────────────────────────────────
export default function AdminScreen() {
  const [tab, setTab] = useState('items');
  const { user, business, logout } = useAuthStore();

  return (
    <div className="flex-col h-full overflow-auto" style={{ padding: '16px' }}>
      {/* Business info */}
      <div className="card card-p" style={{ marginBottom: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
          🏪
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 17 }}>{business?.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{user?.email}</div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2" style={{ marginBottom: 16 }}>
        {[['items', '📦 Items'], ['staff', '👥 Staff']].map(([v, l]) => (
          <button key={v} className={`chip ${tab === v ? 'active' : ''}`} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>

      {tab === 'items' && <ItemManager />}
      {tab === 'staff' && <StaffManager />}

      {/* Sign out */}
      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button className="btn btn-danger btn-full" onClick={() => {
          if (confirm('Sign out of Stock Yangu?')) logout();
        }}>
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
}
