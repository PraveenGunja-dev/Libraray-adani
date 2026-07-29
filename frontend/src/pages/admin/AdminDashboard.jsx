import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BookCheck, BookOpen, CalendarClock, LibraryBig, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardHeader } from '../../components/Card.jsx';
import DataTable from '../../components/DataTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import api from '../../lib/api.js';

const colors = ['#1e78d7', '#31bde7', '#48caa8', '#f59e0b', '#64748b'];

const ACTION_LABEL = {
  borrow: 'Book issued',
  return: 'Book returned',
  lost_approve: 'Lost request approved',
  lost_reject: 'Lost request rejected',
  reservation_approve: 'Reservation approved',
  reservation_cancel: 'Reservation cancelled',
};

function fmtDateTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [categories, setCategories] = useState([]);
  const [popular, setPopular] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/admin/stats'),
      api.get('/admin/monthly?months=6'),
      api.get('/admin/categories'),
      api.get('/admin/popular?limit=5'),
      api.get('/admin/activity?limit=8'),
    ]).then(([s, m, c, p, a]) => {
      if (s.status === 'fulfilled') setStats(s.value);
      if (m.status === 'fulfilled') setMonthly(m.value || []);
      if (c.status === 'fulfilled') setCategories(c.value || []);
      if (p.status === 'fulfilled') setPopular(p.value || []);
      if (a.status === 'fulfilled') setActivity(a.value || []);
    }).finally(() => setLoading(false));
  }, []);

  const totalCopies = stats?.total_copies ?? 0;
  const availablePct = totalCopies > 0 ? Math.round((stats.available / totalCopies) * 100) : 0;

  const categoryChart = categories.map(c => ({ name: c.category, value: c.count }));
  const popularChart = popular.map(b => ({ name: (b.title || '').substring(0, 18), borrows: b.borrow_count }));

  return (
    <>
      <PageHeader eyebrow="Admin control center" title="Library Analytics Dashboard" description="A complete operational view across inventory, issued books, reservations, overdue risk, and employee activity." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={LibraryBig} label="Total Books" value={loading ? '…' : (stats?.total_books ?? 0)} tone="navy" />
        <StatCard icon={BookCheck} label="Available Books" value={loading ? '…' : (stats?.available ?? 0)} delta={!loading && totalCopies > 0 ? `${availablePct}% of inventory` : undefined} tone="green" />
        <StatCard icon={BookOpen} label="Issued Books" value={loading ? '…' : (stats?.issued ?? 0)} tone="blue" />
        <StatCard icon={CalendarClock} label="Overdue Books" value={loading ? '…' : (stats?.overdue ?? 0)} tone="rose" />
        <StatCard icon={BookOpen} label="Reserved Books" value={loading ? '…' : (stats?.reserved ?? 0)} tone="amber" />
        <StatCard icon={Users} label="Total Employees" value={loading ? '…' : (stats?.total_users ?? 0)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader title="Monthly Issued vs Returned" subtitle="Volume trend for book movement." />
          <div className="h-80 p-5">
            {monthly.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">{loading ? 'Loading…' : 'No data yet'}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient id="issued" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#1e78d7" stopOpacity={0.35} /><stop offset="95%" stopColor="#1e78d7" stopOpacity={0} /></linearGradient>
                    <linearGradient id="returned" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#48caa8" stopOpacity={0.28} /><stop offset="95%" stopColor="#48caa8" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7edf5" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Area dataKey="issued" stroke="#1e78d7" fill="url(#issued)" strokeWidth={3} />
                  <Area dataKey="returned" stroke="#48caa8" fill="url(#returned)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Most Used Categories" subtitle="Book count by category." />
          <div className="h-80 p-5">
            {categoryChart.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">{loading ? 'Loading…' : 'No data yet'}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryChart} innerRadius={72} outerRadius={112} paddingAngle={3} dataKey="value">
                    {categoryChart.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Overdue Trend" subtitle="Month-wise overdue count." />
          <div className="h-72 p-5">
            {monthly.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">{loading ? 'Loading…' : 'No data yet'}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7edf5" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="overdue" fill="#f43f5e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Popular Books" subtitle="Top titles by borrow count." />
          <div className="h-72 p-5">
            {popularChart.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">{loading ? 'Loading…' : 'No data yet'}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularChart} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7edf5" />
                  <XAxis type="number" stroke="#64748b" />
                  <YAxis dataKey="name" type="category" stroke="#64748b" width={110} />
                  <Tooltip />
                  <Bar dataKey="borrows" fill="#1e78d7" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Recent Activity" subtitle="Latest circulation and administrative actions." />
        {activity.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-400">{loading ? 'Loading…' : 'No activity recorded yet.'}</p>
        ) : (
          <DataTable
            columns={['Time', 'Action', 'Entity', 'Actor']}
            rows={activity.map((item) => [
              fmtDateTime(item.created_at),
              ACTION_LABEL[item.action] || item.action,
              item.entity_id ? `${item.entity} #${item.entity_id}` : item.entity,
              item.actor_user_id ? `User #${item.actor_user_id}` : 'System',
            ])}
          />
        )}
      </Card>
    </>
  );
}
