export function Card({ children, className = '' }) {
  return <section className={`rounded-2xl border border-corporate-line bg-white shadow-card ${className}`}>{children}</section>;
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-3 border-b border-corporate-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-bold text-corporate-ink">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
