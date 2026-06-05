export default function StatCard({ icon: Icon, label, value, delta, tone = 'blue' }) {
  const tones = {
    blue: 'from-blue-500 to-cyan-400',
    green: 'from-emerald-500 to-teal-400',
    amber: 'from-amber-500 to-orange-400',
    rose: 'from-rose-500 to-pink-400',
    navy: 'from-navy-700 to-blue-600',
  };

  return (
    <div className="rounded-2xl border border-corporate-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-extrabold text-corporate-ink">{value}</p>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${tones[tone]} text-white shadow-soft`}>
          <Icon size={21} />
        </div>
      </div>
      {delta && <p className="mt-4 text-xs font-semibold text-emerald-600">{delta}</p>}
    </div>
  );
}
