export default function SettingsRow({ title, description, children, onClick, as = 'div' }) {
  const Cmp = as;
  const interactive = as === 'button';
  return (
    <Cmp
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      className={[
        'w-full text-left rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3',
        'flex items-center justify-between gap-3',
        interactive ? 'hover:border-neutral-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500' : '',
      ].join(' ')}
    >
      <div className="min-w-0">
        <div className="text-sm text-neutral-100">{title}</div>
        {description ? (
          <div className="mt-0.5 text-xs text-neutral-500">{description}</div>
        ) : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </Cmp>
  );
}
