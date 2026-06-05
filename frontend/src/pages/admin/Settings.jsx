import { Bell, Database, Lock, RefreshCw, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import ActionButton from '../../components/ActionButton.jsx';
import { Card } from '../../components/Card.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import api from '../../lib/api.js';

const DEFAULTS = {
  require_otp_admin: false,
  employee_id_login: true,
  password_reset_approval: false,
  due_reminder_enabled: true,
  due_reminder_days_before: 2,
  reservation_ready_alerts: true,
  default_borrow_days: 7,
  max_active_books: 5,
  qr_required: true,
};

export default function Settings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState({ msg: '', ok: true });

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      setSettings({ ...DEFAULTS, ...res });
    } catch {
      setSettings(DEFAULTS);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function showFlash(msg, ok = true) {
    setFlash({ msg, ok });
    setTimeout(() => setFlash({ msg: '', ok: true }), 4000);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put('/settings', settings);
      showFlash('Settings saved successfully');
    } catch (err) {
      showFlash(err.data?.message || 'Failed to save settings', false);
    } finally {
      setSaving(false);
    }
  }

  function toggle(key) {
    setSettings(s => ({ ...s, [key]: !s[key] }));
  }

  function setNum(key, raw) {
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n > 0) setSettings(s => ({ ...s, [key]: n }));
  }

  if (loading) {
    return (
      <>
        <PageHeader eyebrow="Settings" title="System Settings" description="Admin controls for authentication, notifications, catalogue preferences, and borrowing limits." />
        <p className="text-sm text-slate-400">Loading settings…</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="System Settings"
        description="Admin controls for authentication, notifications, catalogue preferences, and borrowing limits."
        action={<ActionButton icon={RefreshCw} variant="subtle" onClick={load}>Reload</ActionButton>}
      />

      {flash.msg && (
        <div className={`mb-4 rounded-2xl px-5 py-3 text-sm font-semibold ${flash.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {flash.msg}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Authentication */}
        <Card className="p-6">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-navy-50 text-navy-700">
            <Lock size={24} />
          </div>
          <h2 className="mt-5 text-xl font-extrabold text-corporate-ink">Authentication</h2>
          <div className="mt-5 space-y-3">
            {[
              ['Require OTP for admin login', 'require_otp_admin'],
              ['Employee ID login enabled', 'employee_id_login'],
              ['Password reset approval', 'password_reset_approval'],
            ].map(([label, key]) => (
              <label key={key} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                {label}
                <input
                  type="checkbox"
                  checked={!!settings[key]}
                  onChange={() => toggle(key)}
                  className="h-5 w-5 accent-navy-700"
                />
              </label>
            ))}
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-navy-50 text-navy-700">
            <Bell size={24} />
          </div>
          <h2 className="mt-5 text-xl font-extrabold text-corporate-ink">Notifications</h2>
          <div className="mt-5 space-y-3">
            <label className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
              Due reminders enabled
              <input
                type="checkbox"
                checked={!!settings.due_reminder_enabled}
                onChange={() => toggle('due_reminder_enabled')}
                className="h-5 w-5 accent-navy-700"
              />
            </label>
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
              <span>Reminder days before due</span>
              <input
                type="number"
                min={1}
                max={14}
                value={settings.due_reminder_days_before}
                onChange={e => setNum('due_reminder_days_before', e.target.value)}
                className="w-16 rounded-xl border border-corporate-line px-2 py-1 text-center text-sm outline-none focus:border-navy-700"
              />
            </div>
            <label className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
              Reservation ready alerts
              <input
                type="checkbox"
                checked={!!settings.reservation_ready_alerts}
                onChange={() => toggle('reservation_ready_alerts')}
                className="h-5 w-5 accent-navy-700"
              />
            </label>
          </div>
        </Card>

        {/* Library Rules */}
        <Card className="p-6">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-navy-50 text-navy-700">
            <Database size={24} />
          </div>
          <h2 className="mt-5 text-xl font-extrabold text-corporate-ink">Library Rules</h2>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
              <span>Default borrow days</span>
              <input
                type="number"
                min={1}
                max={90}
                value={settings.default_borrow_days}
                onChange={e => setNum('default_borrow_days', e.target.value)}
                className="w-16 rounded-xl border border-corporate-line px-2 py-1 text-center text-sm outline-none focus:border-navy-700"
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
              <span>Max active books per user</span>
              <input
                type="number"
                min={1}
                max={20}
                value={settings.max_active_books}
                onChange={e => setNum('max_active_books', e.target.value)}
                className="w-16 rounded-xl border border-corporate-line px-2 py-1 text-center text-sm outline-none focus:border-navy-700"
              />
            </div>
            <label className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
              QR verification required
              <input
                type="checkbox"
                checked={!!settings.qr_required}
                onChange={() => toggle('qr_required')}
                className="h-5 w-5 accent-navy-700"
              />
            </label>
          </div>
        </Card>
      </div>

      <ActionButton icon={Save} variant="gradient" className="mt-6" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save System Settings'}
      </ActionButton>
    </>
  );
}
