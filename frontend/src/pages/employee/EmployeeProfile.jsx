import { Mail, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import Badge from '../../components/Badge.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import DataTable from '../../components/DataTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../lib/api.js';

const STATUS_BADGE = { active: 'Issued', overdue: 'Overdue', returned: 'Available' };

export default function EmployeeProfile() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/borrow/mine')
      .then(data => setHistory(data.borrow_records || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader eyebrow="Profile" title="My Profile" description="Personal account details and borrowing history." />
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <Card className="p-6">
          <div className="grid h-20 w-20 place-items-center rounded-3xl accent-gradient text-white shadow-soft">
            <UserRound size={38} />
          </div>
          <h2 className="mt-5 text-2xl font-extrabold text-corporate-ink">{user?.name || '—'}</h2>
          {user?.employee_id && <p className="mt-1 text-slate-500">{user.employee_id}</p>}
          <div className="mt-6 space-y-3 text-sm">
            <p className="flex items-center gap-2">
              <Mail size={17} className="text-navy-500" />
              {user?.email || '—'}
            </p>
            {user?.department && (
              <p><span className="font-bold">Department:</span> {user.department}</p>
            )}
            {user?.role && (
              <p><span className="font-bold">Role:</span> <span className="capitalize">{user.role}</span></p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Borrowing History" subtitle="All library activity on your account." />
          {loading ? (
            <p className="p-6 text-slate-500">Loading…</p>
          ) : history.length === 0 ? (
            <p className="p-6 text-slate-500">No borrowing history yet.</p>
          ) : (
            <DataTable
              columns={['Book', 'Copy', 'Borrowed On', 'Due Date', 'Returned On', 'Status']}
              rows={history.map(r => [
                r.book?.title || '—',
                r.copy_code || '—',
                r.borrowed_at ? new Date(r.borrowed_at).toLocaleDateString() : '—',
                r.due_date ? new Date(r.due_date).toLocaleDateString() : '—',
                r.returned_at ? new Date(r.returned_at).toLocaleDateString() : '—',
                <Badge key={r.id}>{STATUS_BADGE[r.status] || r.status}</Badge>,
              ])}
            />
          )}
        </Card>
      </div>
    </>
  );
}
