const VARIANTS = {
  primary:
    'bg-green-500 text-neutral-950 hover:bg-green-400 active:bg-green-600',
  secondary:
    'bg-neutral-800 text-neutral-100 hover:bg-neutral-700 active:bg-neutral-900 border border-neutral-700',
  ghost:
    'bg-transparent text-neutral-300 hover:bg-neutral-900 active:bg-neutral-800',
  danger:
    'bg-red-600 text-white hover:bg-red-500 active:bg-red-700',
};

const SIZES = {
  sm: 'text-sm px-3 min-h-[40px]',
  md: 'text-base px-5 min-h-[56px]',
  lg: 'text-lg px-6 min-h-[64px]',
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
        'inline-flex items-center justify-center rounded-xl font-semibold',
        'transition-colors select-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950',
        'disabled:opacity-50 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(' ')}
      {...rest}
    />
  );
}
