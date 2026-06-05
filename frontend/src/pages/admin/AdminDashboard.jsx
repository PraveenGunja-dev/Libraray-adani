import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BookCheck, BookOpen, CalendarClock, LibraryBig, Users } from 'lucide-react';
import Badge from '../../components/Badge.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import DataTable from '../../components/DataTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import { categoryData, monthlyData, popularBooks, recentActivity } from '../../data/mockData.js';

const colors = ['#1e78d7', '#31bde7', '#48caa8', '#f59e0b', '#64748b'];

export default function AdminDashboard() {
  return (
    <>
      <PageHeader eyebrow="Admin control center" title="Library Analytics Dashboard" description="A complete operational view across inventory, issued books, reservations, overdue risk, and employee activity." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={LibraryBig} label="Total Books" value="12,840" delta="+248 this quarter" tone="navy" />
        <StatCard icon={BookCheck} label="Available Books" value="8,916" delta="69.4% inventory" tone="green" />
        <StatCard icon={BookOpen} label="Issued Books" value="2,318" tone="blue" />
        <StatCard icon={CalendarClock} label="Overdue Books" value="126" tone="rose" />
        <StatCard icon={BookOpen} label="Reserved Books" value="482" tone="amber" />
        <StatCard icon={Users} label="Total Employees" value="3,904" delta="+41 active this month" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader title="Monthly Issued vs Returned" subtitle="Volume trend for book movement." />
          <div className="h-80 p-5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
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
          </div>
        </Card>
        <Card>
          <CardHeader title="Most Used Categories" subtitle="Borrowing share by category." />
          <div className="h-80 p-5">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} innerRadius={72} outerRadius={112} paddingAngle={3} dataKey="value">
                  {categoryData.map((entry, index) => <Cell key={entry.name} fill={colors[index]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Overdue Trend" subtitle="Month-wise overdue count." />
          <div className="h-72 p-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7edf5" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="overdue" fill="#f43f5e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Popular Books" subtitle="Top titles by borrow count." />
          <div className="h-72 p-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularBooks} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7edf5" />
                <XAxis type="number" stroke="#64748b" />
                <YAxis dataKey="name" type="category" stroke="#64748b" width={110} />
                <Tooltip />
                <Bar dataKey="borrows" fill="#1e78d7" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Recent Activity" subtitle="Latest circulation and administrative actions." />
        <DataTable columns={['Time', 'Event', 'User', 'Item', 'Status']} rows={recentActivity.map((item) => [item.time, item.event, item.user, item.item, <Badge>Available</Badge>])} />
      </Card>
    </>
  );
}
