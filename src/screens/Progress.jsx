import { useEffect, useState } from 'react';
import VolumeChart from '../components/VolumeChart.jsx';
import ConsistencyCard from '../components/ConsistencyCard.jsx';
import PRList from '../components/PRList.jsx';
import ExerciseProgressChart from '../components/ExerciseProgressChart.jsx';
import PPLVolumeChart from '../components/PPLVolumeChart.jsx';
import StrengthPRList from '../components/StrengthPRList.jsx';
import { getActiveProgram, getPRs, getSessions } from '../lib/storage.js';

const FILTERS = [
  { id: 'all',  label: 'All'  },
  { id: 'skip', label: 'Skip' },
  { id: 'ppl',  label: 'PPL'  },
];

export default function Progress() {
  const [sessions, setSessions] = useState([]);
  const [prs, setPrs] = useState(getPRs());
  const [filter, setFilter] = useState(() => getActiveProgram());

  useEffect(() => {
    setSessions(getSessions());
    setPrs(getPRs());
  }, []);

  const scoped =
    filter === 'all'
      ? sessions
      : sessions.filter((s) => (s.program || 'skip') === filter);

  const showSkip = filter !== 'ppl';
  const showPPL = filter !== 'skip';
  const total = scoped.length;

  return (
    <div className="min-h-full pt-safe pb-32">
      <header className="px-8 pt-12 pb-2">
        <div className="flex items-center justify-between label-md text-ink-faint">
          <span className="tracking-[0.32em] text-crimson">SECTION&nbsp;·&nbsp;03</span>
          <span className="font-mono tabular tracking-[0.18em]">
            {String(total).padStart(3, '0')}&nbsp;ENTRIES
          </span>
        </div>
        <div className="hairline-strong mt-4" />

        <h1 className="headline-xl mt-8 crimson-rise">
          The <em className="italic font-light text-crimson">measure</em>
          <br />of effort.
        </h1>
        <p className="mt-5 body-md text-ink-dim max-w-md">
          A long view of consistency and strength — read it slowly.
        </p>
      </header>

      <div className="px-8 mt-10">
        <div className="flex items-center gap-6">
          <span className="label-md text-ink-faint">View</span>
          <span className="hairline flex-1" />
          <div className="flex items-center gap-4">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={[
                    'relative font-serif text-[15px] tracking-tight px-1 py-1.5 transition-colors',
                    'focus:outline-none focus-visible:text-crimson',
                    active ? 'text-crimson' : 'text-ink-faint hover:text-ink',
                  ].join(' ')}
                >
                  {f.label}
                  <span
                    aria-hidden
                    className={[
                      'absolute left-0 right-0 -bottom-0.5 h-px origin-left transition-transform duration-500',
                      active ? 'bg-crimson-bright scale-x-100' : 'bg-transparent scale-x-0',
                    ].join(' ')}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-8 mt-10 space-y-6">
        {showSkip ? (
          <>
            <VolumeChart sessions={scoped} />
            <ConsistencyCard sessions={scoped} />
            <PRList prs={prs} />
          </>
        ) : null}
        {showPPL ? (
          <>
            <ExerciseProgressChart sessions={scoped} />
            <PPLVolumeChart sessions={scoped} />
            <StrengthPRList sessions={scoped} />
          </>
        ) : null}
      </div>

      <footer className="px-8 mt-20 mb-8 flex items-center justify-between label-md text-ink-faint">
        <span>Vol.&nbsp;I</span>
        <span className="hairline flex-1 mx-6" />
        <span className="font-mono tabular">{new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
