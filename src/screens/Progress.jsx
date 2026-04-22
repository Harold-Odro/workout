import { useEffect, useState } from 'react';
import VolumeChart from '../components/VolumeChart.jsx';
import ConsistencyCard from '../components/ConsistencyCard.jsx';
import PRList from '../components/PRList.jsx';
import { getPRs, getSessions } from '../lib/storage.js';

export default function Progress() {
  const [sessions, setSessions] = useState([]);
  const [prs, setPrs] = useState(getPRs());

  useEffect(() => {
    setSessions(getSessions());
    setPrs(getPRs());
  }, []);

  return (
    <div className="min-h-full pt-safe pb-24">
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-semibold text-neutral-100">Progress</h1>
      </header>
      <div className="px-5 space-y-4">
        <VolumeChart sessions={sessions} />
        <ConsistencyCard sessions={sessions} />
        <PRList prs={prs} />
      </div>
    </div>
  );
}
