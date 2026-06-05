import { Pencil, Plus, Printer, QrCode, Search, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ActionButton from '../../components/ActionButton.jsx';
import Badge from '../../components/Badge.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import DataTable from '../../components/DataTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import api from '../../lib/api.js';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const FORMATS = ['Hardcover', 'Paperback', 'E-Book', 'Journal', 'Magazine', 'Other'];

function AddBookModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    title: '', author: '', year: new Date().getFullYear(), publisher: '',
    isbn: '', format: 'Hardcover', price: '', currency: 'INR', category: '', quantity: 1,
  });
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append('image', image);
      await api.upload('/books', fd);
      onSaved();
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to add book');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-corporate-line px-6 py-4">
          <h2 className="text-lg font-extrabold text-corporate-ink">Add New Book</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['Title', 'title', 'text', true],
              ['Author', 'author', 'text', true],
              ['Year', 'year', 'number', false],
              ['Publisher', 'publisher', 'text', false],
              ['ISBN', 'isbn', 'text', false],
              ['Category', 'category', 'text', false],
              ['Price', 'price', 'number', false],
              ['Quantity (copies)', 'quantity', 'number', false],
            ].map(([label, key, type, req]) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  {label}{req ? ' *' : ''}
                </label>
                <input
                  type={type}
                  required={req}
                  min={type === 'number' ? 1 : undefined}
                  value={form[key]}
                  onChange={e => set(key, e.target.value)}
                  className="w-full rounded-xl border border-corporate-line px-3 py-2 text-sm outline-none focus:border-navy-700"
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Format</label>
              <select
                value={form.format}
                onChange={e => set('format', e.target.value)}
                className="w-full rounded-xl border border-corporate-line px-3 py-2 text-sm"
              >
                {FORMATS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Cover Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setImage(e.target.files[0])}
                className="w-full rounded-xl border border-corporate-line px-3 py-2 text-sm"
              />
            </div>
          </div>
          {error && (
            <p className="mt-3 rounded-xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600">{error}</p>
          )}
          <div className="mt-5 flex justify-end gap-3">
            <ActionButton type="button" variant="subtle" onClick={onClose}>Cancel</ActionButton>
            <ActionButton type="submit" variant="gradient" icon={Plus} disabled={saving}>
              {saving ? 'Adding…' : 'Add Book'}
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditBookModal({ book, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: book.title || '', author: book.author || '', year: book.year || new Date().getFullYear(), publisher: book.publisher || '',
    isbn: book.isbn || '', format: book.format || 'Hardcover', price: book.price || '', currency: book.currency || 'INR', category: book.category || '',
  });
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append('image', image);
      await api.upload(`/books/${book.id}`, fd, 'PATCH');
      onSaved();
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to update book');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-corporate-line px-6 py-4">
          <h2 className="text-lg font-extrabold text-corporate-ink">Edit Book</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['Title', 'title', 'text', true],
              ['Author', 'author', 'text', true],
              ['Year', 'year', 'number', false],
              ['Publisher', 'publisher', 'text', false],
              ['ISBN', 'isbn', 'text', false],
              ['Category', 'category', 'text', false],
              ['Price', 'price', 'number', false],
            ].map(([label, key, type, req]) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  {label}{req ? ' *' : ''}
                </label>
                <input
                  type={type}
                  required={req}
                  min={type === 'number' ? 1 : undefined}
                  value={form[key]}
                  onChange={e => set(key, e.target.value)}
                  className="w-full rounded-xl border border-corporate-line px-3 py-2 text-sm outline-none focus:border-navy-700"
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Format</label>
              <select
                value={form.format}
                onChange={e => set('format', e.target.value)}
                className="w-full rounded-xl border border-corporate-line px-3 py-2 text-sm"
              >
                {FORMATS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Cover Image (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setImage(e.target.files[0])}
                className="w-full rounded-xl border border-corporate-line px-3 py-2 text-sm"
              />
            </div>
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


function QRModal({ book, onClose }) {
  // Use the public uploads path (no auth needed) instead of the API endpoint
  const BASE_URL = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace('/api', '');
  const qrSrc = book.qr_code_path
    ? `${BASE_URL}/${book.qr_code_path}`
    : `${BASE_URL}/uploads/qr/${book.qr_token}.png`;

  function handlePrint() {
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>QR – ${book.title}</title></head>
      <body style="text-align:center;font-family:sans-serif;padding:40px">
        <h2 style="margin-bottom:6px">${book.title}</h2>
        <p style="color:#64748b;margin-bottom:16px">${book.author || ''}${book.isbn ? ' · ' + book.isbn : ''}</p>
        <img src="${qrSrc}" style="width:220px;height:220px;border:1px solid #e2e8f0;border-radius:8px" />
        <p style="margin-top:12px;font-size:11px;color:#94a3b8">${book.qr_token || ''}</p>
      </body></html>`);
    win.document.close();
    win.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-corporate-line px-6 py-4">
          <h2 className="text-lg font-extrabold text-corporate-ink">Book QR Code</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <div className="flex flex-col items-center px-6 py-6">
          <p className="mb-4 text-center font-bold text-corporate-ink">{book.title}</p>
          <img
            src={qrSrc}
            alt="QR Code"
            className="h-52 w-52 rounded-2xl border border-corporate-line object-contain p-2"
            onError={e => { e.target.alt = 'QR not available'; }}
          />
          {book.qr_token && (
            <p className="mt-2 text-center font-mono text-xs text-slate-400">{book.qr_token}</p>
          )}
          <ActionButton icon={Printer} variant="gradient" className="mt-5 w-full justify-center" onClick={handlePrint}>
            Print QR
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

export default function BookManagement() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [qrBook, setQrBook] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [flash, setFlash] = useState({ msg: '', ok: true });
  const excelRef = useRef();

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const qs = params.toString();
      const res = await api.get(`/books/${qs ? '?' + qs : ''}`);
      setBooks(res.books || res);
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [search, statusFilter]);

  function showFlash(msg, ok = true) {
    setFlash({ msg, ok });
    setTimeout(() => setFlash({ msg: '', ok: true }), 4000);
  }

  async function handleExcel(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.upload('/books/import-excel', fd);
      showFlash(`Imported ${res.imported ?? 0} books${res.skipped ? ` (${res.skipped} duplicates skipped)` : ''}`);
      load();
    } catch (err) {
      showFlash(err.data?.message || err.message || 'Excel import failed', false);
    } finally {
      setUploading(false);
      if (excelRef.current) excelRef.current.value = '';
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this book? This action cannot be undone.')) return;
    try {
      await api.delete(`/books/${id}`);
      showFlash('Book deleted successfully');
      load();
    } catch (err) {
      showFlash(err.data?.message || 'Delete failed', false);
    }
  }

  function handleBulkQR() {
    const ids = books.map(b => b.id).join(',');
    window.open(`${API_BASE}/books/qr-sheet?ids=${ids}`, '_blank');
  }

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="Admin Book Management"
        description="Add, edit, delete, filter, and generate QR codes for every book in the library."
        action={
          <div className="flex flex-wrap gap-2">
            <ActionButton icon={Plus} variant="gradient" onClick={() => setShowAdd(true)}>Add Book</ActionButton>
            <ActionButton icon={Printer} variant="subtle" onClick={handleBulkQR} disabled={books.length === 0}>
              Bulk QR Sheet
            </ActionButton>
            <label
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-corporate-line bg-white px-4 py-2.5 text-sm font-bold text-corporate-ink transition hover:bg-slate-50 ${uploading ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <Upload size={18} />
              {uploading ? 'Uploading…' : 'Import Excel'}
              <input
                ref={excelRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleExcel}
                disabled={uploading}
              />
            </label>
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
          title="Book Catalogue"
          subtitle="Search and filter by category or status."
          action={
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-corporate-line bg-slate-50 px-3 py-2">
                <Search size={15} className="shrink-0 text-slate-400" />
                <input
                  className="bg-transparent text-sm outline-none placeholder:text-slate-400"
                  placeholder="Title, author, ISBN…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select
                className="rounded-xl border border-corporate-line bg-white px-3 py-2 text-sm font-semibold"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="issued">Issued</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>
          }
        />
        {loading ? (
          <p className="px-6 py-8 text-sm text-slate-400">Loading books…</p>
        ) : books.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-400">No books found.</p>
        ) : (
          <DataTable
            columns={['ID', 'Title', 'Author', 'Year', 'Publisher', 'ISBN', 'Format', 'Price', 'Copies', 'Actions']}
            rows={books.map((book) => [
              <span key={`id-${book.id}`} className="font-mono text-xs text-slate-400">{book.id}</span>,
              <span key={`title-${book.id}`} className="max-w-[200px] truncate font-bold text-corporate-ink" title={book.title}>{book.title}</span>,
              book.author || '—',
              book.year || '—',
              book.publisher || '—',
              <span key={`isbn-${book.id}`} className="font-mono text-xs">{book.isbn || '—'}</span>,
              book.format || '—',
              book.price != null ? `₹${book.price.toLocaleString()}` : '—',
              book.total_copies ?? '—',
              <div key={`actions-${book.id}`} className="flex gap-1">
                <ActionButton icon={Pencil} variant="subtle" className="px-2" onClick={() => setEditBook(book)}>Edit</ActionButton>
                <ActionButton icon={QrCode} variant="subtle" className="px-2" onClick={() => setQrBook(book)}>QR</ActionButton>
                <ActionButton icon={Trash2} variant="danger" className="px-2" onClick={() => handleDelete(book.id)}>Del</ActionButton>
              </div>,
            ])}
          />
        )}
      </Card>

      {showAdd && (
        <AddBookModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); showFlash('Book added successfully'); load(); }}
        />
      )}
      {editBook && (
        <EditBookModal
          book={editBook}
          onClose={() => setEditBook(null)}
          onSaved={() => { setEditBook(null); showFlash('Book updated successfully'); load(); }}
        />
      )}
      {qrBook && <QRModal book={qrBook} onClose={() => setQrBook(null)} />}
    </>
  );
}
