import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  BookOpen,
  ChartColumn,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  RefreshCcw,
  Search,
  Settings,
  User,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from './Logo.jsx';

const employeeNav = [
  { label: 'Dashboard', to: '/employee', icon: LayoutDashboard },
  { label: 'Scan QR', to: '/employee/scan', icon: QrCode },
  { label: 'My Books', to: '/employee/book', icon: BookOpen },
  { label: 'Reservations', to: '/employee/reservations', icon: ClipboardList },
  { label: 'Return Book', to: '/employee/return', icon: RefreshCcw },
  { label: 'Notifications', to: '/employee/notifications', icon: Bell },
  { label: 'Profile', to: '/employee/profile', icon: User },
];

const adminNav = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Books', to: '/admin/books', icon: BookOpen },
  { label: 'Employees', to: '/admin/employees', icon: Users },
  { label: 'Reservations', to: '/admin/reservations', icon: ClipboardList },
  { label: 'lost Requests', to: '/admin/lost', icon: AlertTriangle },
  { label: 'Reports', to: '/admin/reports', icon: ChartColumn },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
];

function Sidebar({ mode, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = mode === 'admin' ? adminNav : employeeNav;

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <aside className="flex h-full w-72 flex-col bg-navy-950 px-4 py-5 text-white">
      <div className="flex items-center justify-between px-2">
        <Logo />
        <button className="rounded-lg p-2 text-white/80 lg:hidden" onClick={onClose} aria-label="Close menu">
          <X size={20} />
        </button>
      </div>
      <nav className="nav-scroll mt-8 flex-1 space-y-1 overflow-y-auto">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === `/${mode}`}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                isActive ? 'bg-white text-navy-900 shadow-soft' : 'text-sky-50/80 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <item.icon size={19} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-6 rounded-2xl bg-white/10 p-4">
        <p className="text-sm font-bold">{user?.name || (mode === 'admin' ? 'Library Admin' : 'Employee')}</p>
        <p className="mt-1 text-xs text-sky-100">{user?.department || (mode === 'admin' ? 'Central Library Control' : 'Operations Department')}</p>
        <button onClick={handleLogout} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-sky-100 hover:text-white">
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </aside>
  );
}

export default function AppShell({ mode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const section = location.pathname.split('/').filter(Boolean).at(-1) || 'dashboard';

  return (
    <div className="min-h-screen bg-corporate-bg">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block">
        <Sidebar mode={mode} />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="absolute inset-0 bg-navy-950/60" onClick={() => setOpen(false)} aria-label="Close overlay" />
            <motion.div initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} transition={{ type: 'spring', damping: 28, stiffness: 280 }} className="relative h-full">
              <Sidebar mode={mode} open={open} onClose={() => setOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-corporate-line bg-white/88 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button className="rounded-xl border border-corporate-line bg-white p-2.5 text-corporate-ink lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
                <Menu size={21} />
              </button>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-navy-500">{mode} portal</p>
                <p className="text-lg font-extrabold capitalize text-corporate-ink">{section.replace('-', ' ')}</p>
              </div>
            </div>
            <div className="hidden min-w-0 flex-1 justify-end gap-3 md:flex">
              <div className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-corporate-line bg-slate-50 px-3 py-2.5">
                <Search size={18} className="text-slate-400" />
                <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search books, employees, reports..." />
              </div>
              <button className="relative rounded-2xl border border-corporate-line bg-white p-3 text-corporate-ink">
                <Bell size={20} />
                <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
              </button>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
