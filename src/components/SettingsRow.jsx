export default function SettingsRow({ title, description, children, onClick, as = 'div' }) {
  const Cmp = as;
  const interactive = as === 'button';
  return (
    <Cmp
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      className={[
        'w-full text-left bg-surface-1 px-5 py-4',
        'flex items-center justify-between gap-4',
        interactive ? 'hover:bg-surface-high transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-crimson' : '',
      ].join(' ')}
    >
      <div className="min-w-0">
        <div className="font-serif text-base text-ink leading-tight">{title}</div>
        {description ? (
          <div className="mt-1 text-[13px] text-ink-faint font-sans">
            {description}
          </div>
        ) : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </Cmp>
  );
}
