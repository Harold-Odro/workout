import { NavLink } from 'react-router-dom';
import { Home, History, LineChart, CalendarRange } from 'lucide-react';

const TABS = [
  { to: '/',         label: 'Today',    Icon: Home },
  { to: '/history',  label: 'History',  Icon: History },
  { to: '/progress', label: 'Progress', Icon: LineChart },
  { to: '/plan',     label: 'Plan',     Icon: CalendarRange },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-20 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur pb-safe"
      aria-label="Primary"
    >
      <ul className="flex">
        {TABS.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center justify-center gap-1',
                  'min-h-16 py-2 text-xs',
                  isActive ? 'text-green-500' : 'text-neutral-500',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-inset',
                ].join(' ')
              }
            >
              <Icon size={22} aria-hidden />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
