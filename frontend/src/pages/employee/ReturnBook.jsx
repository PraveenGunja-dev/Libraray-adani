import { CheckCircle2, QrCode, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import ActionButton from '../../components/ActionButton.jsx';
import Badge from '../../components/Badge.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import DataTable from '../../components/DataTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import api from '../../lib/api.js';

export default function ReturnBook() {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState(null);
  const [flash, setFlash] = useState({ type: '', msg: '' });
  const [lastReturned, setLastReturned] = useState(null);

  useEffect(() => { fetchBorrows(); }, []);

  async function fetchBorrows() {
    setLoading(true);
    try {
      const data = await api.get('/borrow/mine');
      const all = data.borrow_records || [];
      setBorrows(all.filter(r => r.status === 'active' || r.status === 'overdue'));
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

  async function handleReturn(borrowId, bookTitle) {
    setReturning(borrowId);
    try {
      await api.post(`/borrow/${borrowId}/return`);
      setLastReturned(bookTitle);
      showFlash('success', `"${bookTitle}" returned successfully.`);
      await fetchBorrows();
    } catch (err) {
      showFlash('error', err.message || 'Return failed. Please try again.');
    } finally {
      setReturning(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Return workflow"
        title="Return a Book"
        description="Select a borrowed book and confirm the return."
      />

      {flash.msg && (
        <div className={`mb-4 rounded-2xl p-4 font-bold ${flash.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {flash.msg}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader title="Active Borrows" subtitle="Select a book to return it." />
          {loading ? (
            <p className="p-6 text-slate-500">Loading…</p>
          ) : borrows.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 p-6 text-slate-400">
              <QrCode size={48} />
              <p className="text-sm font-semibold">No active borrows to return.</p>
            </div>
          ) : (
            <DataTable
              columns={['Book', 'Copy Code', 'Borrowed On', 'Due Date', 'Status', 'Action']}
              rows={borrows.map(r => {
                const title = r.book?.title || '—';
                return [
                  title,
                  r.copy_code || '—',
                  r.borrowed_at ? new Date(r.borrowed_at).toLocaleDateString() : '—',
                  r.due_date ? new Date(r.due_date).toLocaleDateString() : '—',
                  <Badge key={`s-${r.id}`}>{r.status === 'overdue' ? 'Overdue' : 'Issued'}</Badge>,
                  <ActionButton
                    key={`ret-${r.id}`}
                    icon={RefreshCcw}
                    variant="gradient"
                    disabled={returning === r.id}
                    onClick={() => handleReturn(r.id, title)}
                  >
                    {returning === r.id ? 'Returning…' : 'Return'}
                  </ActionButton>,
                ];
              })}
            />
          )}
        </Card>

        <Card className="p-6">
          {lastReturned ? (
            <>
              <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-700">
                <CheckCircle2 />
                <span className="font-bold">Return confirmed</span>
              </div>
              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-500">Returned book</p>
                <p className="mt-1 text-lg font-extrabold text-corporate-ink">{lastReturned}</p>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                The book is now available for other employees.
              </p>
            </>
          ) : (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCcw size={48} />
              <p className="text-center text-sm font-semibold">
                Select a book from the list to return it.
              </p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
