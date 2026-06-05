export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.18em] text-navy-500">{eyebrow}</p>}
        <h1 className="mt-2 text-2xl font-extrabold text-corporate-ink sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
