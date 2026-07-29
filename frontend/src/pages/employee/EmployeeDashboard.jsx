import { Bell, BookOpen, CalendarClock, ClipboardList, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../lib/api.js';

const QUICK_ACTIONS = [
  { label: 'My Borrowed Books', icon: BookOpen, to: '/employee/book' },
  { label: 'My Reservations', icon: ClipboardList, to: '/employee/reservations' },
  { label: 'Return Book', icon: RefreshCcw, to: '/employee/return' },
  { label: 'Notifications', icon: Bell, to: '/employee/notifications' },
];

const TYPE_LABEL = {
  due_reminder: 'Due reminder',
  overdue: 'Overdue',
  reservation_ready: 'Reservation ready',
  lost_update: 'Lost update',
  system: 'System',
};

function nearestDue(borrows) {
  const active = borrows.filter(r => (r.status === 'active' || r.status === 'overdue') && r.due_date);
  if (!active.length) return null;
  return active.sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0].due_date;
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'there';

  const [borrows, setBorrows] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/borrow/mine'),
      api.get('/reservations/mine'),
      api.get('/notifications'),
    ]).then(([b, r, n]) => {
      if (b.status === 'fulfilled') setBorrows(b.value.borrow_records || []);
      if (r.status === 'fulfilled') setReservations(r.value.reservations || []);
      if (n.status === 'fulfilled') setNotifications(Array.isArray(n.value) ? n.value : []);
    }).finally(() => setLoading(false));
  }, []);

  const activeBorrows = borrows.filter(r => r.status === 'active' || r.status === 'overdue');
  const activeReservations = reservations.filter(r => r.status === 'waiting' || r.status === 'ready');
  const dueDate = nearestDue(borrows);
  const hasOverdue = activeBorrows.some(r => r.status === 'overdue');

  return (
    <>
      <PageHeader
        eyebrow="Employee workspace"
        title={`Good day, ${firstName}`}
        description="Track borrowed books, reservations, returns, and due-date alerts from one workspace."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={BookOpen}
          label="Currently Borrowed"
          value={loading ? '—' : String(activeBorrows.length)}
          tone={hasOverdue ? 'rose' : 'blue'}
          delta={hasOverdue ? 'Some books are overdue!' : undefined}
        />
        <StatCard
          icon={ClipboardList}
          label="Active Reservations"
          value={loading ? '—' : String(activeReservations.length)}
          tone="green"
          delta={activeReservations.some(r => r.status === 'ready') ? 'Book ready for pickup' : undefined}
        />
        <StatCard
          icon={CalendarClock}
          label="Nearest Due Date"
          value={loading ? '—' : (dueDate ? new Date(dueDate).toLocaleDateString() : 'None')}
          tone="amber"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <Card>
          <CardHeader title="Quick Actions" subtitle="Common library workflows are one tap away." />
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                to={action.to}
                className="group rounded-2xl border border-corporate-line bg-slate-50 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-soft"
              >
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl accent-gradient text-white shadow-soft">
                  <action.icon size={22} />
                </div>
                <p className="font-bold text-corporate-ink">{action.label}</p>
                <p className="mt-2 text-sm text-slate-500">Open workflow</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Borrowed Books" subtitle="Active issues and due dates." />
          {loading ? (
            <p className="p-5 text-sm text-slate-500">Loading…</p>
          ) : activeBorrows.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">No active borrows.</p>
          ) : (
            <div className="space-y-3 p-5">
              {activeBorrows.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center gap-4 rounded-2xl border border-corporate-line p-3">
                  <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-2xl">📚</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-corporate-ink">{r.book?.title || '—'}</p>
                    <p className="text-sm text-slate-500">
                      Due {r.due_date ? new Date(r.due_date).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <Badge>{r.status === 'overdue' ? 'Overdue' : 'Issued'}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Latest Notifications"
          subtitle={notifications.filter(n => !n.read).length > 0
            ? `${notifications.filter(n => !n.read).length} unread`
            : 'All caught up'}
        />
        {loading ? (
          <p className="p-5 text-sm text-slate-500">Loading…</p>
        ) : notifications.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No notifications yet.</p>
        ) : (
          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
            {notifications.slice(0, 4).map(item => (
              <div
                key={item.id}
                className={`rounded-2xl p-4 ${item.read ? 'bg-slate-50' : 'bg-navy-50 ring-1 ring-navy-200'}`}
              >
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-navy-500">
                  {TYPE_LABEL[item.type] || item.type}
                </p>
                <p className="mt-2 font-bold text-corporate-ink">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">{item.body}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
