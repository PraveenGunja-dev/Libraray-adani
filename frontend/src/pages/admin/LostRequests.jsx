import { AlertTriangle, CheckCircle, RefreshCw, XCircle } from 'lucide-react';
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

export default function LostRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [flash, setFlash] = useState({ msg: '', ok: true });

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/lost?status=');
      setRequests(res.lost_requests || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function showFlash(msg, ok = true) {
    setFlash({ msg, ok });
    setTimeout(() => setFlash({ msg: '', ok: true }), 5000);
  }

  async function handleAction(id, action) {
    setActing(`${id}-${action}`);
    try {
      await api.post(`/lost/${id}/${action}`);
      if (action === 'approve') {
        showFlash('Request approved — book copy removed from inventory.', true);
      } else {
        showFlash('Request rejected — book copy kept in inventory.', true);
      }
      load();
    } catch (err) {
      showFlash(err.data?.message || `Failed to ${action} request`, false);
    } finally {
      setActing(null);
    }
  }

  const pending = requests.filter(r => r.status === 'pending');
  const resolved = requests.filter(r => r.status !== 'pending');

  function renderRow(req) {
    const isActing = acting === `${req.id}-approve` || acting === `${req.id}-reject`;
    return [
      req.user?.name || `User #${req.user_id}`,
      req.book_copy?.book?.title || req.book_title || '—',
      req.book_copy?.copy_code || req.copy_code || '—',
      <span key={req.id} className="line-clamp-2 max-w-xs text-sm text-slate-600" title={req.reason}>
        {req.reason}
      </span>,
      fmt(req.created_at),
      <Badge key={req.id}>{req.status}</Badge>,
      req.status === 'pending' ? (
        <div key={req.id} className="flex gap-2">
          <ActionButton
            icon={CheckCircle}
            variant="gradient"
            className="px-3"
            disabled={isActing}
            onClick={() => handleAction(req.id, 'approve')}
          >
            {acting === `${req.id}-approve` ? '…' : 'Approve'}
          </ActionButton>
          <ActionButton
            icon={XCircle}
            variant="danger"
            className="px-3"
            disabled={isActing}
            onClick={() => handleAction(req.id, 'reject')}
          >
            {acting === `${req.id}-reject` ? '…' : 'Reject'}
          </ActionButton>
        </div>
      ) : (
        <span key={req.id} className="text-xs text-slate-400">
          {req.resolved_at ? fmt(req.resolved_at) : '—'}
        </span>
      ),
    ];
  }

  return (
    <>
      <PageHeader
        eyebrow="Security"
        title="Lost Book Requests"
        description="Review employee-reported lost book copies. Approving removes the copy from inventory permanently."
        action={<ActionButton icon={RefreshCw} variant="subtle" onClick={load}>Refresh</ActionButton>}
      />

      {flash.msg && (
        <div className={`mb-4 rounded-2xl px-5 py-3 text-sm font-semibold ${flash.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {flash.msg}
        </div>
      )}

      {loading ? (
        <Card>
          <p className="px-6 py-8 text-sm text-slate-400">Loading requests…</p>
        </Card>
      ) : requests.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-slate-400">
            <AlertTriangle size={36} />
            <p className="text-sm font-semibold">No lost requests found</p>
          </div>
        </Card>
      ) : (
        <>
          {pending.length > 0 && (
            <Card className="mb-6">
              <CardHeader
                title={`Pending Requests (${pending.length})`}
                subtitle="These require your action. Approving marks the copy as removed."
              />
              <DataTable
                columns={['Reporter', 'Book Title', 'Copy Code', 'Reason', 'Reported On', 'Status', 'Actions']}
                rows={pending.map(renderRow)}
              />
            </Card>
          )}

          {resolved.length > 0 && (
            <Card>
              <CardHeader
                title={`Resolved Requests (${resolved.length})`}
                subtitle="Previously approved or rejected lost reports."
              />
              <DataTable
                columns={['Reporter', 'Book Title', 'Copy Code', 'Reason', 'Reported On', 'Status', 'Resolved']}
                rows={resolved.map(renderRow)}
              />
            </Card>
          )}
        </>
      )}
    </>
  );
}
