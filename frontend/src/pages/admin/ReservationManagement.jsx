import { CheckCircle, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import ActionButton from '../../components/ActionButton.jsx';
import Badge from '../../components/Badge.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import DataTable from '../../components/DataTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import api from '../../lib/api.js';

function fmt(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ReservationManagement() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [flash, setFlash] = useState({ msg: '', ok: true });

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/reservations');
      setReservations(res.reservations || res);
    } catch {
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function showFlash(msg, ok = true) {
    setFlash({ msg, ok });
    setTimeout(() => setFlash({ msg: '', ok: true }), 3000);
  }

  async function handleApprove(id) {
    setActing(`${id}-approve`);
    try {
      await api.post(`/reservations/${id}/approve`);
      showFlash('Reservation approved — book issued to employee', true);
      load();
    } catch (err) {
      showFlash(err.data?.error || err.data?.message || 'Failed to approve reservation', false);
    } finally {
      setActing(null);
    }
  }

  async function handleCancel(id) {
    if (!window.confirm('Cancel this reservation?')) return;
    setActing(`${id}-cancel`);
    try {
      await api.delete(`/reservations/${id}`);
      showFlash('Reservation cancelled');
      load();
    } catch (err) {
      showFlash(err.data?.message || 'Failed to cancel reservation', false);
    } finally {
      setActing(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Queue control"
        title="Admin Reservation Management"
        description="Monitor reserved books, queue position, employee requests, and expected availability."
        action={<ActionButton icon={RefreshCw} variant="subtle" onClick={load}>Refresh</ActionButton>}
      />

      {flash.msg && (
        <div className={`mb-4 rounded-2xl px-5 py-3 text-sm font-semibold ${flash.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {flash.msg}
        </div>
      )}

      <Card>
        <CardHeader title="Reservations Queue" subtitle="Cancel reservations or monitor status as books become available." />
        {loading ? (
          <p className="px-6 py-8 text-sm text-slate-400">Loading reservations…</p>
        ) : reservations.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-400">No reservations found.</p>
        ) : (
          <DataTable
            columns={['Employee', 'Book', 'Reserved On', 'Queue', 'Expected Availability', 'Status', 'Action']}
            rows={reservations.map((item) => [
              item.user?.name || `User #${item.user_id}`,
              item.book?.title || `Book #${item.book_id}`,
              fmt(item.created_at),
              `#${item.queue_position}`,
              fmt(item.expected_available_date),
              <Badge key={item.id}>{item.status}</Badge>,
              item.status === 'waiting' || item.status === 'ready' ? (
                <div key={item.id} className="flex gap-2">
                  <ActionButton 
                    icon={CheckCircle} 
                    variant="gradient" 
                    className="px-3" 
                    disabled={acting === `${item.id}-approve`}
                    onClick={() => handleApprove(item.id)}
                  >
                    {acting === `${item.id}-approve` ? '…' : 'Approve'}
                  </ActionButton>
                  <ActionButton 
                    icon={Trash2} 
                    variant="danger" 
                    className="px-3" 
                    disabled={acting === `${item.id}-cancel`}
                    onClick={() => handleCancel(item.id)}
                  >
                    Cancel
                  </ActionButton>
                </div>
              ) : (
                <span key={item.id} className="text-xs text-slate-400">—</span>
              ),
            ])}
          />
        )}
      </Card>
    </>
  );
}
