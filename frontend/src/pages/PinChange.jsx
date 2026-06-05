import { motion } from 'framer-motion';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ActionButton from '../components/ActionButton.jsx';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function PinChange() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(newPin)) {
      setError('New PIN must be exactly 6 digits.');
      return;
    }
    if (newPin !== confirm) {
      setError('PINs do not match.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/pin/change', { old_pin: oldPin, new_pin: newPin });
      navigate(user?.role === 'admin' ? '/admin' : '/employee', { replace: true });
    } catch (err) {
      setError(err.message || 'PIN change failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-navy-950 grid place-items-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(30,120,215,0.45),transparent_34%),linear-gradient(135deg,#06192e,#08243f_52%,#0b3158)]" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl mx-5"
      >
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl accent-gradient text-white shadow-soft">
            <ShieldCheck size={26} />
          </div>
          <h2 className="text-2xl font-extrabold text-corporate-ink">Change Your PIN</h2>
          <p className="mt-2 text-sm text-slate-500">
            Your PIN is still the default (your date of birth). Set a new 6-digit PIN to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Current PIN</span>
            <span className="mt-2 flex items-center gap-3 rounded-2xl border border-corporate-line bg-slate-50 px-4 py-3">
              <KeyRound size={18} className="text-slate-400" />
              <input
                className="w-full bg-transparent text-sm outline-none tracking-widest font-mono"
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="Current 6-digit PIN"
                value={oldPin}
                onChange={e => setOldPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
            </span>
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">New PIN</span>
            <span className="mt-2 flex items-center gap-3 rounded-2xl border border-corporate-line bg-slate-50 px-4 py-3">
              <KeyRound size={18} className="text-slate-400" />
              <input
                className="w-full bg-transparent text-sm outline-none tracking-widest font-mono"
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="New 6-digit PIN"
                value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
            </span>
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Confirm New PIN</span>
            <span className="mt-2 flex items-center gap-3 rounded-2xl border border-corporate-line bg-slate-50 px-4 py-3">
              <KeyRound size={18} className="text-slate-400" />
              <input
                className="w-full bg-transparent text-sm outline-none tracking-widest font-mono"
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="Repeat new PIN"
                value={confirm}
                onChange={e => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
            </span>
          </label>
          {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}
          <ActionButton type="submit" variant="gradient" className="w-full" disabled={saving}>
            {saving ? 'Saving…' : 'Set New PIN'}
          </ActionButton>
        </form>

        <button onClick={logout} className="mt-4 w-full text-center text-xs text-slate-400 hover:text-slate-600">
          Sign out instead
        </button>
      </motion.div>
    </main>
  );
}
