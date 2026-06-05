import { BookOpen, Download, FileSpreadsheet, FileText, RefreshCw, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ActionButton from '../../components/ActionButton.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import DataTable from '../../components/DataTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import api from '../../lib/api.js';

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

export default function Reports() {
  const [startDate, setStartDate] = useState(() => isoDate(new Date(Date.now() - 180 * 24 * 3600 * 1000)));
  const [endDate, setEndDate] = useState(() => isoDate(new Date()));
  const [stats, setStats] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [categories, setCategories] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const params = `start_date=${startDate}&end_date=${endDate}`;
      const [s, m, c, p] = await Promise.all([
        api.get('/admin/stats'),
        api.get(`/admin/monthly?${params}`),
        api.get('/admin/categories'),
        api.get(`/admin/popular?${params}`),
      ]);
      setStats(s);
      setMonthly(m.data || m);
      setCategories(c.data || c);
      setPopular(p.data || p);
    } catch {
      // keep last values on error
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const popularChart = popular.slice(0, 10).map(b => ({
    name: (b.title || b.name || '').substring(0, 18),
    borrows: b.borrow_count || b.borrows || 0,
  }));

  const lastMonth = monthly[monthly.length - 1];

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Admin Reports"
        description="Presentation-ready report cards, export actions, charts, and structured circulation summaries."
        action={
          <div className="flex flex-wrap gap-3">
            <ActionButton icon={FileText} variant="subtle">Export PDF</ActionButton>
            <ActionButton icon={FileSpreadsheet} variant="gradient">Export Excel</ActionButton>
          </div>
        }
      />

      {/* Date range picker */}
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">From</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="rounded-xl border border-corporate-line px-3 py-2 text-sm outline-none focus:border-navy-700"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">To</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="rounded-xl border border-corporate-line px-3 py-2 text-sm outline-none focus:border-navy-700"
          />
        </div>
        <ActionButton icon={RefreshCw} variant="gradient" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Apply'}
        </ActionButton>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpen} label="Total Books" value={loading ? '…' : (stats?.total_books ?? 0)} tone="blue" />
        <StatCard icon={Download} label="Monthly Issues" value={loading ? '…' : (lastMonth?.issued ?? 0)} tone="green" />
        <StatCard icon={TrendingDown} label="Currently Overdue" value={loading ? '…' : (stats?.overdue ?? 0)} tone="rose" />
        <StatCard icon={Users} label="Total Users" value={loading ? '…' : (stats?.total_users ?? 0)} tone="navy" />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Most Borrowed Books" subtitle="Top-performing titles for the reporting period." />
          <div className="h-72 p-5">
            {popularChart.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">No data for period</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7edf5" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="borrows" fill="#1e78d7" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Most Used Categories" subtitle="Category circulation count." />
          {categories.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-400">No category data available.</p>
          ) : (
            <DataTable
              columns={['Category', 'Borrow Count']}
              rows={categories.slice(0, 8).map(item => [
                item.category || item.name || '—',
                item.count || item.value || 0,
              ])}
            />
          )}
        </Card>
      </div>

      {/* Monthly table */}
      <Card className="mt-6">
        <CardHeader title="Monthly Report" subtitle="Issued, returned, and overdue counts." />
        {monthly.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-400">No monthly data available.</p>
        ) : (
          <DataTable
            columns={['Month', 'Issued', 'Returned', 'Overdue']}
            rows={monthly.map(item => [
              item.month,
              item.issued ?? 0,
              item.returned ?? 0,
              item.overdue ?? 0,
            ])}
          />
        )}
      </Card>
    </>
  );
}
