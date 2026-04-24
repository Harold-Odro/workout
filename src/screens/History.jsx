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
    <div className="min-h-full pt-safe pb-32">
      <header className="px-8 pt-12 pb-2">
        <div className="flex items-center justify-between label-md text-ink-faint">
          <span className="tracking-[0.32em] text-crimson">SECTION&nbsp;·&nbsp;02</span>
          <span className="font-mono tabular tracking-[0.18em]">
            {String(sessions.length).padStart(3, '0')}&nbsp;ENTRIES
          </span>
        </div>
        <div className="hairline-strong mt-4" />

        <h1 className="headline-xl mt-8 crimson-rise">
          The <em className="italic font-light text-crimson">archive</em>
          <br />of effort.
        </h1>
        <p className="mt-5 body-md text-ink-dim max-w-md">
          Twelve weeks at a glance — darker squares, harder days.
        </p>
      </header>

      <section className="px-8 mt-10">
        <div className="tonal p-6">
          <CalendarHeatmap
            sessions={sessions}
            weeks={12}
            selectedDate={selectedDate}
            onSelect={(d) => setSelectedDate(d === selectedDate ? null : d)}
          />
        </div>
      </section>

      {/* Filters */}
      <section className="px-8 mt-8">
        <div className="flex items-center gap-6 mb-4">
          <span className="label-md text-ink-faint">Program</span>
          <span className="hairline flex-1" />
        </div>
        <div className="flex flex-wrap gap-2">
          {PROGRAM_FILTERS.map((f) => {
            const active = programFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setProgramFilter(f.id)}
                className={[
                  'rounded-sm px-3 min-h-9 label-md transition-colors',
                  active
                    ? 'bg-crimson-bright text-white'
                    : 'bg-surface-1 text-ink-dim hover:text-crimson border border-hairline-strong',
                ].join(' ')}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </section>

      {typeFilters ? (
        <section className="px-8 mt-5">
          <div className="flex flex-wrap gap-2">
            {typeFilters.map((f) => {
              const active = typeFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setTypeFilter(f.id)}
                  className={[
                    'rounded-sm px-2.5 min-h-8 label-md transition-colors',
                    active
                      ? 'bg-ink text-surface'
                      : 'bg-transparent text-ink-faint hover:text-crimson border border-hairline',
                  ].join(' ')}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {selectedDate ? (
        <div className="px-8 mt-6 flex items-center justify-between">
          <span className="font-serif italic text-ink-dim">
            Showing {format(parseISO(selectedDate), 'MMMM d')}
          </span>
          <button
            onClick={() => setSelectedDate(null)}
            className="label-md text-crimson hover:text-crimson-bright"
          >
            Clear
          </button>
        </div>
      ) : null}

      <section className="px-8 mt-10 space-y-10">
        {groups.length === 0 ? (
          <div className="border border-hairline px-6 py-10 text-center">
            <p className="font-serif italic text-ink-dim text-lg">
              {sessions.length === 0
                ? 'The page is blank.'
                : 'Nothing matches that filter.'}
            </p>
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.label}>
              <div className="flex items-center gap-4 mb-4">
                <h2 className="label-md text-crimson tracking-[0.2em]">{g.label}</h2>
                <span className="hairline flex-1" />
                <span className="font-mono text-[10px] tabular tracking-[0.18em] text-ink-faint">
                  {String(g.sessions.length).padStart(2, '0')}
                </span>
              </div>
              <div className="space-y-px bg-hairline">
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
