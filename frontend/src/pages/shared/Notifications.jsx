import { BellRing, CheckCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import ActionButton from '../../components/ActionButton.jsx';
import { Card } from '../../components/Card.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import api from '../../lib/api.js';

const TYPE_LABEL = {
  due_reminder: 'Due reminder',
  overdue: 'Overdue',
  reservation_ready: 'Reservation ready',
  lost_update: 'lost update',
  system: 'System',
};

const TYPE_ICON_COLOR = {
  overdue: 'bg-rose-50 text-rose-600',
  due_reminder: 'bg-amber-50 text-amber-600',
  reservation_ready: 'bg-emerald-50 text-emerald-600',
  lost_update: 'bg-sky-50 text-sky-600',
  system: 'bg-navy-50 text-navy-600',
};

export default function Notifications({ audience }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => { fetchNotifications(); }, []);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const data = await api.get('/notifications');
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // leave empty
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id) {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {
      // silent — best-effort
    }
  }

  async function markAllRead() {
    const unread = notifications.filter(n => !n.read);
    if (!unread.length) return;
    setMarkingAll(true);
    await Promise.allSettled(unread.map(n => api.post(`/notifications/${n.id}/read`)));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setMarkingAll(false);
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <PageHeader
        eyebrow="Notification centre"
        title="Notifications"
        description={`Due reminders, overdue alerts, and reservation updates for the ${audience} portal.`}
        action={
          unreadCount > 0 ? (
            <ActionButton icon={CheckCheck} variant="subtle" onClick={markAllRead} disabled={markingAll}>
              {markingAll ? 'Marking…' : `Mark all read (${unreadCount})`}
            </ActionButton>
          ) : null
        }
      />

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : notifications.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-slate-400">
          <BellRing size={48} />
          <p className="text-sm font-semibold">No notifications yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {notifications.map(item => {
            const iconColor = TYPE_ICON_COLOR[item.type] || 'bg-slate-100 text-slate-600';
            return (
              <Card
                key={item.id}
                className={`p-5 transition ${item.read ? '' : 'ring-2 ring-navy-200'}`}
              >
                <div className="flex gap-4">
                  <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${iconColor}`}>
                    <BellRing size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-navy-500">
                          {TYPE_LABEL[item.type] || item.type}
                        </p>
                        <h2 className="mt-2 font-extrabold text-corporate-ink">{item.title}</h2>
                        <p className="mt-1 text-sm text-slate-500">{item.body}</p>
                        {item.created_at && (
                          <p className="mt-2 text-xs text-slate-400">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                      {!item.read && (
                        <button
                          onClick={() => markRead(item.id)}
                          className="shrink-0 rounded-lg p-1.5 text-navy-500 hover:bg-navy-50"
                          title="Mark as read"
                        >
                          <CheckCheck size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
