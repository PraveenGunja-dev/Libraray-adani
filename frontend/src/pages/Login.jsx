import { motion } from 'framer-motion';
import { ArrowRight, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ActionButton from '../components/ActionButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    if (!email.toLowerCase().endsWith('@adani.com')) {
      setError('Please use your @adani.com email address.');
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      setError('PIN must be exactly 6 digits.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, pin);
      if (user.pin_is_default) {
        navigate('/pin-change', { replace: true });
      } else {
        navigate(user.role === 'admin' ? '/admin' : '/employee', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid email or PIN.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-navy-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(30,120,215,0.45),transparent_34%),radial-gradient(circle_at_80%_5%,rgba(72,202,168,0.24),transparent_28%),linear-gradient(135deg,#06192e,#08243f_52%,#0b3158)]" />
      <div className="relative grid min-h-screen items-center gap-10 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-12">
        <section className="mx-auto max-w-2xl text-white lg:mx-0">
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-sky-50">
            <ShieldCheck size={17} /> QR-enabled enterprise library
          </div>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            Adani Library Management System
          </motion.h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-sky-100">
            A premium portal for employee borrowing, QR returns, reservations, and library-wide operational analytics.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {['QR Scan Borrowing', 'Smart Reservations', 'Admin Analytics'].map((item) => (
              <div key={item} className="rounded-2xl border border-white/12 bg-white/10 p-4 text-sm font-bold text-white/95">
                {item}
              </div>
            ))}
          </div>
        </section>

        <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mx-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl accent-gradient text-2xl font-extrabold text-white shadow-soft">A</div>
            <h2 className="text-2xl font-extrabold text-corporate-ink">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500">Sign in with your @adani.com email and 6-digit PIN.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Email</span>
              <span className="mt-2 flex items-center gap-3 rounded-2xl border border-corporate-line bg-slate-50 px-4 py-3">
                <Mail size={18} className="text-slate-400" />
                <input
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder="name@adani.com"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </span>
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">6-digit PIN</span>
              <span className="mt-2 flex items-center gap-3 rounded-2xl border border-corporate-line bg-slate-50 px-4 py-3">
                <KeyRound size={18} className="text-slate-400" />
                <input
                  className="w-full bg-transparent text-sm outline-none tracking-widest font-mono"
                  placeholder="• • • • • •"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                />
              </span>
              <p className="mt-1 text-xs text-slate-400">Default PIN is your date of birth in DDMMYY format.</p>
            </label>

            {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}

            <ActionButton type="submit" icon={ArrowRight} variant="gradient" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </ActionButton>
          </form>
        </motion.section>
      </div>
    </main>
  );
}
