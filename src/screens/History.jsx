import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import CalendarHeatmap from '../components/CalendarHeatmap.jsx';
import SessionDetailCard from '../components/SessionDetailCard.jsx';
import { WORKOUT_TYPES, WORKOUT_META } from '../lib/workouts.js';
import { PPL_META, PPL_TYPES } from '../lib/workoutsPPL.js';
import { groupSessionsByWeek } from '../lib/analytics.js';
import { getSessions } from '../lib/storage.js';

const PROGRAM_FILTERS = [
  { id: 'all',  label: 'All'  },
  { id: 'skip', label: 'Skip' },
  { id: 'ppl',  label: 'PPL'  },
];

function typeFiltersFor(program) {
  if (program === 'skip') {
    return [
      { id: 'all', label: 'All' },
      ...WORKOUT_TYPES.map((t) => ({ id: t, label: WORKOUT_META[t].name })),
    ];
  }
  if (program === 'ppl') {
    return [
      { id: 'all', label: 'All' },
      ...PPL_TYPES.map((t) => ({ id: t, label: PPL_META[t].name })),
    ];
  }
  return null;
}

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [programFilter, setProgramFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    setSessions(getSessions());
  }, []);

  // Reset type filter when program filter changes.
  useEffect(() => {
    setTypeFilter('all');
  }, [programFilter]);

  const typeFilters = typeFiltersFor(programFilter);

  const filtered = useMemo(() => {
    let out = sessions;
    if (programFilter !== 'all') {
      out = out.filter((s) => (s.program || 'skip') === programFilter);
    }
    if (typeFilter !== 'all') {
      out = out.filter((s) => s.type === typeFilter);
    }
    if (selectedDate) {
      out = out.filter((s) => s.date === selectedDate);
    }
    return out;
  }, [sessions, programFilter, typeFilter, selectedDate]);

  const groups = useMemo(() => groupSessionsByWeek(filtered), [filtered]);

  return (
    <div className="min-h-full pt-safe pb-24">
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-semibold text-neutral-100">History</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Last 12 weeks · darker = higher effort
        </p>
      </header>

      <section className="px-5">
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
          <CalendarHeatmap
            sessions={sessions}
            weeks={12}
            selectedDate={selectedDate}
            onSelect={(d) => setSelectedDate(d === selectedDate ? null : d)}
          />
        </div>
      </section>

      <section className="px-5 mt-6 flex flex-wrap gap-2">
        {PROGRAM_FILTERS.map((f) => {
          const active = programFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setProgramFilter(f.id)}
              className={[
                'px-3 min-h-9 rounded-full text-sm font-medium transition-colors',
                active
                  ? 'bg-green-500 text-neutral-950'
                  : 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-neutral-600',
              ].join(' ')}
            >
              {f.label}
            </button>
          );
        })}
      </section>

      {typeFilters ? (
        <section className="px-5 mt-2 flex flex-wrap gap-2">
          {typeFilters.map((f) => {
            const active = typeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id)}
                className={[
                  'px-2.5 min-h-8 rounded-full text-xs font-medium transition-colors',
                  active
                    ? 'bg-neutral-200 text-neutral-950'
                    : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-600',
                ].join(' ')}
              >
                {f.label}
              </button>
            );
          })}
        </section>
      ) : null}

      {selectedDate ? (
        <div className="px-5 mt-4 flex items-center justify-between text-sm">
          <span className="text-neutral-400">
            Showing {format(parseISO(selectedDate), 'MMM d')}
          </span>
          <button
            onClick={() => setSelectedDate(null)}
            className="text-green-500 hover:text-green-400"
          >
            Clear
          </button>
        </div>
      ) : null}

      <section className="px-5 mt-6 space-y-6">
        {groups.length === 0 ? (
          <p className="text-sm text-neutral-500 py-8 text-center">
            {sessions.length === 0
              ? 'No sessions yet.'
              : 'No sessions match this filter.'}
          </p>
        ) : (
          groups.map((g) => (
            <div key={g.label}>
              <h2 className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
                {g.label}
              </h2>
              <div className="space-y-2">
                {g.sessions.map((s) => (
                  <SessionDetailCard key={s.id} session={s} />
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
