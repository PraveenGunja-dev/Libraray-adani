import { BookmarkPlus, CheckCircle2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import ActionButton from '../../components/ActionButton.jsx';
import Badge from '../../components/Badge.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import DataTable from '../../components/DataTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import api from '../../lib/api.js';

const STATUS_BADGE = {
  waiting: 'Waiting',
  ready: 'Ready Soon',
  cancelled: 'Cancelled',
  fulfilled: 'Available',
};

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [flash, setFlash] = useState({ type: '', msg: '' });

  useEffect(() => { fetchReservations(); }, []);

  async function fetchReservations() {
    setLoading(true);
    try {
      const data = await api.get('/reservations/mine');
      setReservations(data.reservations || []);
    } catch {
      // leave empty
    } finally {
      setLoading(false);
    }
  }

  function showFlash(type, msg) {
    setFlash({ type, msg });
    setTimeout(() => setFlash({ type: '', msg: '' }), 4000);
  }

  async function handleCancel(id) {
    setCancelling(id);
    try {
      await api.delete(`/reservations/${id}`);
      showFlash('success', 'Reservation cancelled.');
      await fetchReservations();
    } catch (err) {
      showFlash('error', err.message || 'Cancel failed. Please try again.');
    } finally {
      setCancelling(null);
    }
  }

  const active = reservations.filter(r => r.status === 'waiting' || r.status === 'ready');
  const past = reservations.filter(r => r.status === 'cancelled' || r.status === 'fulfilled');
  const readyItem = reservations.find(r => r.status === 'ready');

  return (
    <>
      <PageHeader
        eyebrow="Reservations"
        title="My Reservations"
        description="Track your queue positions and be notified when a book becomes available."
      />

      {flash.msg && (
        <div className={`mb-4 rounded-2xl p-4 font-bold ${flash.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {flash.msg}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Active Reservations" subtitle="Books you are waiting for." />
            {loading ? (
              <p className="p-6 text-slate-500">Loading…</p>
            ) : active.length === 0 ? (
              <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 p-6 text-slate-400">
                <BookmarkPlus size={40} />
                <p className="text-sm font-semibold">No active reservations.</p>
              </div>
            ) : (
              <DataTable
                columns={['Book', 'Expected Available', 'Queue Position', 'Status', 'Action']}
                rows={active.map(r => [
                  r.book?.title || '—',
                  r.expected_available_date
                    ? new Date(r.expected_available_date).toLocaleDateString()
                    : '—',
                  r.queue_position != null ? `#${r.queue_position}` : '—',
                  <Badge key={`s-${r.id}`}>{STATUS_BADGE[r.status] || r.status}</Badge>,
                  <ActionButton
                    key={`c-${r.id}`}
                    icon={Trash2}
                    variant="subtle"
                    disabled={cancelling === r.id}
                    onClick={() => handleCancel(r.id)}
                  >
                    {cancelling === r.id ? 'Cancelling…' : 'Cancel'}
                  </ActionButton>,
                ])}
              />
            )}
          </Card>

          {past.length > 0 && (
            <Card>
              <CardHeader title="Past Reservations" subtitle="Fulfilled or cancelled." />
              <DataTable
                columns={['Book', 'Queue Position', 'Status']}
                rows={past.map(r => [
                  r.book?.title || '—',
                  r.queue_position != null ? `#${r.queue_position}` : '—',
                  <Badge key={`p-${r.id}`}>{STATUS_BADGE[r.status] || r.status}</Badge>,
                ])}
              />
            </Card>
          )}
        </div>

        {/* Status panel */}
        <Card className="p-6">
          {readyItem ? (
            <>
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={28} />
              </div>
              <h2 className="mt-5 text-xl font-extrabold text-corporate-ink">Book ready for pickup!</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                <span className="font-bold">{readyItem.book?.title}</span> is now available. Visit the library to collect it.
              </p>
              {readyItem.expected_available_date && (
                <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm">
                  <p className="font-bold text-slate-700">Expected pickup date</p>
                  <p className="mt-1 text-slate-500">
                    {new Date(readyItem.expected_available_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-navy-50 text-navy-600">
                <BookmarkPlus size={28} />
              </div>
              <h2 className="mt-5 text-xl font-extrabold text-corporate-ink">Reserve unavailable books</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                When you try to borrow a book that is currently issued, you can join the reservation queue. You will be notified when it is your turn.
              </p>
              <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                <p className="font-bold text-slate-700">Tip</p>
                <p className="mt-1">Scan a book's QR code and tap "Reserve Book" to join the queue.</p>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
