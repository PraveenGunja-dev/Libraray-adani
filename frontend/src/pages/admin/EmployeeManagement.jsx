import { Eye, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import ActionButton from '../../components/ActionButton.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import DataTable from '../../components/DataTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import api from '../../lib/api.js';

function AddEmployeeModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', email: '', department: '', dob: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/employees', form);
      onSaved();
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to add employee');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-corporate-line px-6 py-4">
          <h2 className="text-lg font-extrabold text-corporate-ink">Add New Employee</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5">
          <div className="grid gap-4">
            {[
              ['Name', 'name', 'text'],
              ['Email', 'email', 'email'],
              ['Department', 'department', 'text'],
              ['Date of Birth', 'dob', 'date'],
            ].map(([label, key, type]) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  {label} *
                </label>
                <input
                  type={type}
                  required
                  value={form[key]}
                  onChange={e => set(key, e.target.value)}
                  className="w-full rounded-xl border border-corporate-line px-3 py-2 text-sm outline-none focus:border-navy-700"
                />
              </div>
            ))}
          </div>
          {error && (
            <p className="mt-3 rounded-xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600">{error}</p>
          )}
          <div className="mt-5 flex justify-end gap-3">
            <ActionButton type="button" variant="subtle" onClick={onClose}>Cancel</ActionButton>
            <ActionButton type="submit" variant="gradient" icon={Plus} disabled={saving}>
              {saving ? 'Adding…' : 'Add Employee'}
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditEmployeeModal({ employee, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: employee.name || '',
    email: employee.email || '',
    department: employee.department || '',
    dob: employee.dob ? employee.dob.split('T')[0] : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.patch(`/employees/${employee.id}`, form);
      onSaved();
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to update employee');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-corporate-line px-6 py-4">
          <h2 className="text-lg font-extrabold text-corporate-ink">Edit Employee</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5">
          <div className="grid gap-4">
            {[
              ['Name', 'name', 'text'],
              ['Email', 'email', 'email'],
              ['Department', 'department', 'text'],
              ['Date of Birth', 'dob', 'date'],
            ].map(([label, key, type]) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  {label} *
                </label>
                <input
                  type={type}
                  required
                  value={form[key]}
                  onChange={e => set(key, e.target.value)}
                  className="w-full rounded-xl border border-corporate-line px-3 py-2 text-sm outline-none focus:border-navy-700"
                />
              </div>
            ))}
          </div>
          {error && (
            <p className="mt-3 rounded-xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600">{error}</p>
          )}
          <div className="mt-5 flex justify-end gap-3">
            <ActionButton type="button" variant="subtle" onClick={onClose}>Cancel</ActionButton>
            <ActionButton type="submit" variant="gradient" icon={Pencil} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [flash, setFlash] = useState({ msg: '', ok: true });

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const qs = params.toString();
      const res = await api.get(`/employees/${qs ? '?' + qs : ''}`);
      setEmployees(res.employees || res);
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [search]);

  function showFlash(msg, ok = true) {
    setFlash({ msg, ok });
    setTimeout(() => setFlash({ msg: '', ok: true }), 4000);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this employee? This action cannot be undone.')) return;
    try {
      await api.delete(`/employees/${id}`);
      showFlash('Employee deleted successfully');
      load();
    } catch (err) {
      showFlash(err.data?.error || 'Delete failed', false);
    }
  }

  return (
    <>
      <PageHeader 
        eyebrow="Employees" 
        title="Admin Employee Management" 
        description="View employee borrowing activity and departments." 
        action={
          <div className="flex gap-2">
            <ActionButton icon={Plus} variant="gradient" onClick={() => setShowAdd(true)}>
              Add Employee
            </ActionButton>
          </div>
        }
      />
      
      {flash.msg && (
        <div className={`mb-4 rounded-2xl px-5 py-3 text-sm font-semibold ${flash.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {flash.msg}
        </div>
      )}

      <Card>
        <CardHeader 
          title="Employee Directory" 
          subtitle="Manage employee data and view activity." 
          action={
            <div className="flex items-center gap-2 rounded-xl border border-corporate-line bg-slate-50 px-3 py-2">
              <Search size={15} className="shrink-0 text-slate-400" />
              <input
                className="bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Search employees…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          } 
        />
        {loading ? (
          <p className="px-6 py-8 text-sm text-slate-400">Loading employees…</p>
        ) : employees.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-400">No employees found.</p>
        ) : (
          <DataTable
            columns={['Employee ID', 'Name', 'Email', 'Department', 'Active Borrowed', 'Actions']}
            rows={employees.map((employee) => [
              `EMP-${employee.id}`,
              <span key={`name-${employee.id}`} className="font-bold text-corporate-ink">{employee.name}</span>,
              employee.email,
              employee.department || '—',
              employee.active_borrowed || 0,
              <div key={`actions-${employee.id}`} className="flex gap-1">
                <ActionButton icon={Pencil} variant="subtle" className="px-2" onClick={() => setEditEmployee(employee)}>Edit</ActionButton>
                <ActionButton icon={Trash2} variant="danger" className="px-2" onClick={() => handleDelete(employee.id)}>Del</ActionButton>
              </div>,
            ])}
          />
        )}
      </Card>
      
      {showAdd && (
        <AddEmployeeModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); showFlash('Employee added successfully'); load(); }}
        />
      )}
      {editEmployee && (
        <EditEmployeeModal
          employee={editEmployee}
          onClose={() => setEditEmployee(null)}
          onSaved={() => { setEditEmployee(null); showFlash('Employee updated successfully'); load(); }}
        />
      )}
    </>
  );
}
