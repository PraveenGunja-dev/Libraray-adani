export default function Logo({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-11 w-11 place-items-center rounded-2xl accent-gradient shadow-soft">
        <span className="text-lg font-extrabold text-white">A</span>
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-white/80" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold leading-tight text-white">Adani</p>
          <p className="truncate text-xs font-medium text-sky-100">Library Management System</p>
        </div>
      )}
    </div>
  );
}
