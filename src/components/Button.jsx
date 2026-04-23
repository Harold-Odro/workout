const VARIANTS = {
  primary:
    'bg-crimson-bright text-white hover:bg-crimson hover:text-crimson-blood active:bg-crimson-deep border border-transparent',
  secondary:
    'bg-transparent text-ink hover:text-crimson border border-hairline-strong hover:border-crimson',
  ghost:
    'bg-transparent text-ink-faint hover:text-crimson border border-transparent',
  danger:
    'bg-transparent text-error hover:bg-error-container hover:text-white border border-error/40 hover:border-error',
};

const SIZES = {
  sm: 'text-[11px] px-4 min-h-10 tracking-[0.16em]',
  md: 'text-[12px] px-6 min-h-12 tracking-[0.18em]',
  lg: 'text-[13px] px-8 min-h-14 tracking-[0.2em]',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center rounded font-semibold uppercase',
        'transition-all duration-200 select-none',
        'focus:outline-none focus-visible:ring-1 focus-visible:ring-crimson focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        'disabled:opacity-40 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(' ')}
      {...rest}
    />
  );
}
