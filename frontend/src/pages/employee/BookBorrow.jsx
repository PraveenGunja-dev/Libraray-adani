import { AlertTriangle, BookmarkPlus, CalendarDays, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ActionButton from '../../components/ActionButton.jsx';
import Badge from '../../components/Badge.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import DataTable from '../../components/DataTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import api from '../../lib/api.js';

const BASE_URL = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace('/api', '');

function lostModal({ copyId, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post('/lost', { book_copy_id: copyId, reason: reason.trim() });
      onSuccess('lost report submitted successfully.');
    } catch (err) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-corporate-ink">Report Book as lost</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        {error && <p className="mb-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label className="mb-2 block text-sm font-bold text-slate-700">Reason</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            required
            rows={4}
            className="w-full rounded-xl border border-corporate-line px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-500"
            placeholder="Describe the circumstances..."
          />
          <div className="mt-4 flex justify-end gap-3">
            <ActionButton type="button" variant="subtle" onClick={onClose}>Cancel</ActionButton>
            <ActionButton type="submit" icon={AlertTriangle} variant="danger" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Report'}
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BookBorrow() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Pre-filled when coming from QR scan
  const book = state?.book || null;
  const copy = state?.copy || null;

  const [days, setDays] = useState(7);
  const [borrowing, setBorrowing] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [flash, setFlash] = useState({ type: '', msg: '' });

  const [lostModal, setlostModal] = useState(false);
  const [lostCopyId, setlostCopyId] = useState(null);

  // "My Books" list mode (no pre-selected book)
  const [myBorrows, setMyBorrows] = useState([]);
  const [loadingBorrows, setLoadingBorrows] = useState(false);

  useEffect(() => {
    // Try to get default borrow days from settings; gracefully falls back to 7
    api.get('/settings')
      .then(data => {
        const d = data?.settings?.default_borrow_days || data?.default_borrow_days;
        if (d) setDays(Number(d));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!book) {
      setLoadingBorrows(true);
      api.get('/borrow/mine')
        .then(data => setMyBorrows(data.borrow_records || []))
        .catch(() => {})
        .finally(() => setLoadingBorrows(false));
    }
  }, [book]);

  function showFlash(type, msg) {
    setFlash({ type, msg });
    setTimeout(() => setFlash({ type: '', msg: '' }), 4000);
  }

  async function handleBorrow() {
    if (!copy?.id) return;
    setBorrowing(true);
    try {
      await api.post('/borrow', { book_copy_id: copy.id, days_requested: days });
      showFlash('success', 'Book borrowed successfully!');
      setTimeout(() => navigate('/employee'), 1500);
    } catch (err) {
      showFlash('error', err.message || 'Borrow failed');
    } finally {
      setBorrowing(false);
    }
  }

  async function handleReserve() {
    if (!book?.id) return;
    setReserving(true);
    try {
      await api.post('/reservations', { book_id: book.id });
      showFlash('success', 'Book reserved! You will be notified when it becomes available.');
    } catch (err) {
      showFlash('error', err.message || 'Reserve failed');
    } finally {
      setReserving(false);
    }
  }

  function openlostModal(copyId) {
    setlostCopyId(copyId);
    setlostModal(true);
  }

  function onlostSuccess(msg) {
    setlostModal(false);
    setlostCopyId(null);
    showFlash('success', msg);
  }

  const flashBar = flash.msg && (
    <div className={`mb-4 rounded-2xl p-4 font-bold ${flash.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
      {flash.msg}
    </div>
  );

  // ── Borrow-form mode (navigated here from QR scan) ───────────────────────────
  if (book) {
    const isCopyAvailable = copy?.status === 'available';
    return (
      <>
        <PageHeader
          eyebrow="Book details"
          title="Borrow or Reserve Book"
          description="Review availability and choose a borrowing duration before confirming."
        />
        {flashBar}
        <Card className="overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[360px_1fr]">
            <div className="bg-navy-950 p-6">
              {book.image_path
                ? <img src={`${BASE_URL}/uploads/${book.image_path}`} alt="" className="h-[460px] w-full rounded-3xl object-cover shadow-2xl" />
                : <div className="flex h-[460px] w-full items-center justify-center rounded-3xl bg-white/10 text-8xl">📚</div>
              }
            </div>
            <div className="p-6 lg:p-8">
              <Badge>{isCopyAvailable ? 'Available' : copy?.status || 'Unknown'}</Badge>
              <h1 className="mt-4 text-3xl font-extrabold text-corporate-ink">{book.title}</h1>
              <p className="mt-2 text-lg text-slate-500">by {book.author}</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  ['Category', book.category || '—'],
                  ['ISBN', book.isbn || '—'],
                  ['Copy Code', copy?.copy_code || '—'],
                  ['Format', book.format || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
                    <p className="mt-2 font-bold text-corporate-ink">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <p className="mb-3 font-bold text-corporate-ink">Borrow duration (days)</p>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={days}
                    onChange={e => setDays(Math.max(1, Math.min(90, Number(e.target.value))))}
                    className="w-20 rounded-xl border border-corporate-line px-3 py-2 text-center font-bold text-corporate-ink focus:outline-none focus:ring-2 focus:ring-navy-500"
                  />
                  {[7, 14, 21].map(d => (
                    <button
                      key={d}
                      onClick={() => setDays(d)}
                      className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${days === d ? 'border-navy-500 bg-navy-50 text-navy-700' : 'border-corporate-line bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <ActionButton
                  icon={CalendarDays}
                  variant="gradient"
                  onClick={handleBorrow}
                  disabled={borrowing || !isCopyAvailable}
                >
                  {borrowing ? 'Borrowing…' : 'Borrow Book'}
                </ActionButton>
                <ActionButton
                  icon={BookmarkPlus}
                  variant="subtle"
                  onClick={handleReserve}
                  disabled={reserving}
                >
                  {reserving ? 'Reserving…' : 'Reserve Book'}
                </ActionButton>
                {copy?.id && (
                  <ActionButton
                    icon={AlertTriangle}
                    variant="danger"
                    onClick={() => openlostModal(copy.id)}
                  >
                    Report lost
                  </ActionButton>
                )}
              </div>
            </div>
          </div>
        </Card>

        {lostModal && (
          <lostModal copyId={lostCopyId} onClose={() => setlostModal(false)} onSuccess={onlostSuccess} />
        )}
      </>
    );
  }

  // ── "My Books" list mode (default nav destination) ────────────────────────────
  const activeBorrows = myBorrows.filter(r => r.status === 'active' || r.status === 'overdue');
  const history = myBorrows.filter(r => r.status === 'returned');

  return (
    <>
      <PageHeader
        eyebrow="My Books"
        title="Borrowed Books"
        description="Track your active borrows and due dates. Use Scan QR to borrow a new book."
      />
      {flashBar}

      <div className="space-y-6">
        <Card>
          <CardHeader title="Active Borrows" subtitle="Books currently issued to you." />
          {loadingBorrows ? (
            <p className="p-6 text-slate-500">Loading…</p>
          ) : activeBorrows.length === 0 ? (
            <p className="p-6 text-slate-500">No active borrows. Scan a book QR to borrow one.</p>
          ) : (
            <DataTable
              columns={['Book', 'Copy', 'Borrowed On', 'Due Date', 'Status', 'Actions']}
              rows={activeBorrows.map(r => [
                r.book?.title || '—',
                r.copy_code || '—',
                r.borrowed_at ? new Date(r.borrowed_at).toLocaleDateString() : '—',
                r.due_date ? new Date(r.due_date).toLocaleDateString() : '—',
                <Badge key={`s-${r.id}`}>{r.status === 'overdue' ? 'Overdue' : 'Issued'}</Badge>,
                <ActionButton
                  key={`st-${r.id}`}
                  icon={AlertTriangle}
                  variant="danger"
                  onClick={() => openlostModal(r.book_copy_id)}
                >
                  Report lost
                </ActionButton>,
              ])}
            />
          )}
        </Card>

        {history.length > 0 && (
          <Card>
            <CardHeader title="Return History" subtitle="Previously returned books." />
            <DataTable
              columns={['Book', 'Copy', 'Borrowed On', 'Returned On']}
              rows={history.map(r => [
                r.book?.title || '—',
                r.copy_code || '—',
                r.borrowed_at ? new Date(r.borrowed_at).toLocaleDateString() : '—',
                r.returned_at ? new Date(r.returned_at).toLocaleDateString() : '—',
              ])}
            />
          </Card>
        )}
      </div>

      {lostModal && (
        <lostModal copyId={lostCopyId} onClose={() => setlostModal(false)} onSuccess={onlostSuccess} />
      )}
    </>
  );
}
