import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/',         label: 'Today',    num: '01' },
  { to: '/history',  label: 'History',  num: '02' },
  { to: '/progress', label: 'Progress', num: '03' },
  { to: '/plan',     label: 'Plan',     num: '04' },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 bg-[var(--color-surface-dim)]/95 backdrop-blur-md pb-safe"
      aria-label="Primary"
    >
      <div className="hairline-strong" />
      <ul className="flex">
        {TABS.map(({ to, label, num }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                [
                  'group relative flex flex-col items-center justify-center gap-1.5',
                  'min-h-[72px] py-3 transition-colors duration-300',
                  'focus:outline-none',
                  isActive
                    ? 'text-[var(--color-crimson)]'
                    : 'text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      'font-mono text-[10px] tracking-[0.18em]',
                      isActive ? 'text-[var(--color-crimson-bright)]' : 'text-[var(--color-ink-faint)]/70',
                    ].join(' ')}
                  >
                    {num}
                  </span>
                  <span className="font-serif text-[15px] tracking-tight">{label}</span>
                  <span
                    aria-hidden
                    className={[
                      'absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 origin-center',
                      'transition-all duration-500',
                      isActive
                        ? 'bg-[var(--color-crimson-bright)] scale-x-100 opacity-100'
                        : 'bg-transparent scale-x-0 opacity-0',
                    ].join(' ')}
                  />
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
