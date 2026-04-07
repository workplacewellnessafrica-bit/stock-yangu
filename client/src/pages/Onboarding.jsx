import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../stores/authStore';

const STEPS = [
  { id: 'type',       title: '🏪 What kind of business?', sub: 'This helps us tailor the experience for you.' },
  { id: 'model',      title: '👥 How do you operate?',    sub: 'Tell us about your team setup.' },
  { id: 'categories', title: '📦 What do you sell?',      sub: 'Select all that apply.' },
  { id: 'payments',   title: '💳 Payment methods?',       sub: 'Choose how your customers pay.' },
  { id: 'volume',     title: '📈 Daily transaction volume?', sub: 'Rough estimate is fine.' },
  { id: 'records',    title: '📝 Current record-keeping?', sub: 'How are you tracking now?' },
  { id: 'done',       title: "🎉 You're all set!",         sub: "Your account is ready. Let's make money." },
];

const BIZ_TYPES = [
  { value: 'kibanda',          emoji: '🏠', title: 'Kibanda / Kiosk', desc: 'Small stall, market or roadside shop' },
  { value: 'small-supermarket',emoji: '🏪', title: 'Small Supermarket', desc: 'Shelved shop with multiple product lines' },
  { value: 'supermarket',      emoji: '🛒', title: 'Supermarket', desc: 'Larger store with barcode scanner' },
];
const OP_MODELS = [
  { value: 'solo',        emoji: '🙋', title: 'Just me',      desc: 'I run everything myself' },
  { value: 'small-team',  emoji: '👫', title: '2–5 staff',    desc: 'Small dedicated team' },
  { value: 'medium',      emoji: '👥', title: '5–20 staff',   desc: 'Medium-sized operation' },
  { value: 'large',       emoji: '🏢', title: '20+ staff',    desc: 'Large business with shifts' },
];
const CATEGORIES = [
  { value: 'vegetables',  emoji: '🥬', label: 'Vegetables & Greens' },
  { value: 'dairy',       emoji: '🥛', label: 'Dairy & Eggs' },
  { value: 'basics',      emoji: '🌾', label: 'Basics & Staples' },
  { value: 'drinks',      emoji: '🥤', label: 'Drinks' },
  { value: 'toiletries',  emoji: '🧴', label: 'Toiletries' },
  { value: 'meat',        emoji: '🥩', label: 'Meat & Fish' },
  { value: 'clothing',    emoji: '👕', label: 'Clothing' },
  { value: 'electronics', emoji: '📱', label: 'Electronics' },
  { value: 'other',       emoji: '📦', label: 'Other' },
];
const PAYMENT_METHODS = [
  { value: 'cash',   emoji: '💵', label: 'Cash' },
  { value: 'mpesa',  emoji: '📱', label: 'M-Pesa' },
  { value: 'card',   emoji: '💳', label: 'Card/POS' },
  { value: 'credit', emoji: '📒', label: 'Credit (Tab)' },
];
const TX_VOLUMES = [
  { value: 20,  label: 'Under 30/day',   emoji: '🌱' },
  { value: 60,  label: '30–100/day',     emoji: '🌿' },
  { value: 150, label: '100–200/day',    emoji: '🌳' },
  { value: 300, label: '200+/day',       emoji: '🏔️' },
];
const RECORDS = [
  { value: 'nothing',   emoji: '🤷', label: 'Nothing currently' },
  { value: 'notebook',  emoji: '📓', label: 'Notebook / ledger' },
  { value: 'excel',     emoji: '📊', label: 'Excel / Google Sheets' },
  { value: 'app',       emoji: '📱', label: 'Another app' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { setBusiness } = useAuthStore();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    type: '', operatingModel: '', paymentMethods: [],
    productCategories: [], perishablePercent: 30,
    avgDailyTx: 60, existingRecords: '', taxRegistered: false,
  });

  function toggle(key, val) {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(v => v !== val) : [...f[key], val],
    }));
  }

  function pick(key, val) { setForm(f => ({ ...f, [key]: val })); }

  function canNext() {
    const s = STEPS[step].id;
    if (s === 'type')       return !!form.type;
    if (s === 'model')      return !!form.operatingModel;
    if (s === 'categories') return form.productCategories.length > 0;
    if (s === 'payments')   return form.paymentMethods.length > 0;
    if (s === 'volume')     return !!form.avgDailyTx;
    if (s === 'records')    return !!form.existingRecords;
    return true;
  }

  async function handleNext() {
    if (step < STEPS.length - 2) { setStep(s => s + 1); return; }
    if (STEPS[step].id === 'records') {
      // Save and advance to done
      setSaving(true);
      try {
        const { data } = await api.post('/business/onboard', form);
        // Refresh business data
        const { data: biz } = await api.get('/business/profile');
        setBusiness(biz);
        setStep(s => s + 1);
      } catch (err) {
        alert('Save failed: ' + (err.response?.data?.error || err.message));
      } finally { setSaving(false); }
    }
  }

  const current = STEPS[step];
  const progress = (step / (STEPS.length - 1)) * 100;

  return (
    <div className="flex-col app-shell">
      {/* Progress */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700 }}>🌿 Setup</span>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Step {step + 1} of {STEPS.length}</span>
        </div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
      </div>

      {/* Body */}
      <div className="onboard-step app-content">
        <div>
          <h2 className="onboard-title">{current.title}</h2>
          <p className="onboard-sub">{current.sub}</p>
        </div>

        {/* STEP: business type */}
        {current.id === 'type' && (
          <div className="flex-col gap-3">
            {BIZ_TYPES.map(opt => (
              <div key={opt.value} className={`option-card ${form.type === opt.value ? 'selected' : ''}`}
                onClick={() => pick('type', opt.value)}>
                <span className="option-icon">{opt.emoji}</span>
                <div>
                  <div className="option-title">{opt.title}</div>
                  <div className="option-desc">{opt.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP: operating model */}
        {current.id === 'model' && (
          <div className="flex-col gap-3">
            {OP_MODELS.map(opt => (
              <div key={opt.value} className={`option-card ${form.operatingModel === opt.value ? 'selected' : ''}`}
                onClick={() => pick('operatingModel', opt.value)}>
                <span className="option-icon">{opt.emoji}</span>
                <div>
                  <div className="option-title">{opt.title}</div>
                  <div className="option-desc">{opt.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP: categories */}
        {current.id === 'categories' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {CATEGORIES.map(c => (
              <div key={c.value}
                className={`option-card ${form.productCategories.includes(c.value) ? 'selected' : ''}`}
                onClick={() => toggle('productCategories', c.value)}
                style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 16 }}>
                <span style={{ fontSize: 32 }}>{c.emoji}</span>
                <div className="option-title" style={{ marginTop: 8, fontSize: 13 }}>{c.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* STEP: payment methods */}
        {current.id === 'payments' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {PAYMENT_METHODS.map(p => (
              <div key={p.value}
                className={`option-card ${form.paymentMethods.includes(p.value) ? 'selected' : ''}`}
                onClick={() => toggle('paymentMethods', p.value)}
                style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 20 }}>
                <span style={{ fontSize: 36 }}>{p.emoji}</span>
                <div className="option-title" style={{ marginTop: 8 }}>{p.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* STEP: volume */}
        {current.id === 'volume' && (
          <div className="flex-col gap-3">
            {TX_VOLUMES.map(v => (
              <div key={v.value}
                className={`option-card ${form.avgDailyTx === v.value ? 'selected' : ''}`}
                onClick={() => pick('avgDailyTx', v.value)}>
                <span className="option-icon">{v.emoji}</span>
                <div className="option-title">{v.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* STEP: records */}
        {current.id === 'records' && (
          <div className="flex-col gap-3">
            {RECORDS.map(r => (
              <div key={r.value}
                className={`option-card ${form.existingRecords === r.value ? 'selected' : ''}`}
                onClick={() => pick('existingRecords', r.value)}>
                <span className="option-icon">{r.emoji}</span>
                <div className="option-title">{r.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* STEP: done */}
        {current.id === 'done' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 80, marginBottom: 24 }}>🎉</div>
            <p style={{ fontSize: 16, color: 'var(--text-2)', marginBottom: 32, lineHeight: 1.6 }}>
              Your business is set up and ready to go. Start recording sales from your phone, or open the desktop dashboard on a bigger screen.
            </p>
            <button className="btn btn-primary btn-lg btn-full" onClick={() => navigate('/app')}>
              🚀 Go to my Dashboard →
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      {current.id !== 'done' && (
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }}>
          {step > 0 && (
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep(s => s - 1)}>
              ← Back
            </button>
          )}
          <button
            className="btn btn-primary"
            style={{ flex: 2 }}
            onClick={handleNext}
            disabled={!canNext() || saving}
          >
            {saving
              ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving…</>
              : STEPS[step].id === 'records' ? '✅ Finish Setup' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  );
}
