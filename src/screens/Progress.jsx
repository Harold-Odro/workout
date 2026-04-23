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

  return (
    <div className="min-h-full pt-safe pb-24">
      <header className="px-5 pt-8 pb-3">
        <h1 className="text-2xl font-semibold text-neutral-100">Progress</h1>
      </header>

      <div className="px-5 pb-4 flex gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={[
                'px-3 min-h-10 rounded-full text-sm font-medium transition-colors',
                active
                  ? 'bg-green-500 text-neutral-950'
                  : 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-neutral-600',
              ].join(' ')}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="px-5 space-y-4">
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
    </div>
  );
}
