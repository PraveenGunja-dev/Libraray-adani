export default function ActionButton({ children, icon: Icon, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-navy-900 text-white hover:bg-navy-700 shadow-soft',
    subtle: 'bg-white text-corporate-ink ring-1 ring-corporate-line hover:bg-navy-50',
    gradient: 'accent-gradient text-white shadow-soft',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-soft',
  };

  return (
    <button className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${variants[variant]} ${className}`} {...props}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
}
