const styles = {
  Available: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Issued: 'bg-sky-50 text-sky-700 ring-sky-200',
  Reserved: 'bg-amber-50 text-amber-700 ring-amber-200',
  'Lost/Damaged': 'bg-rose-50 text-rose-700 ring-rose-200',
  Overdue: 'bg-rose-50 text-rose-700 ring-rose-200',
  Waiting: 'bg-amber-50 text-amber-700 ring-amber-200',
  Queued: 'bg-sky-50 text-sky-700 ring-sky-200',
  'Ready Soon': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  None: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

export default function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles[children] || 'bg-slate-100 text-slate-700 ring-slate-200'} ${className}`}>
      {children}
    </span>
  );
}
