import { useMemo, useState } from 'react';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { exerciseSeries, loggedExerciseIds } from '../lib/analyticsPPL.js';
import { getExerciseDef } from '../lib/workoutsPPL.js';

export default function ExerciseProgressChart({ sessions }) {
  const ids = useMemo(() => loggedExerciseIds(sessions), [sessions]);
  const [selectedId, setSelectedId] = useState(ids[0] || null);

  const data = useMemo(
    () => (selectedId ? exerciseSeries(sessions, selectedId) : []),
    [sessions, selectedId]
  );

  const options = ids.map((id) => {
    try {
      return { id, name: getExerciseDef(id).name };
    } catch {
      return { id, name: id };
    }
  });

  return (
    <div className="tonal p-6">
      <div className="eyebrow">
        <h2>Exercise progression</h2>
        <span className="meta">Top set · kg×reps</span>
      </div>
      <div className="hairline mb-4" />

      {ids.length === 0 ? (
        <p className="font-serif italic text-ink-dim text-center py-10">
          Log a PPL session to start tracking exercise progression.
        </p>
      ) : (
        <>
          <div className="relative">
            <select
              value={selectedId || ''}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full appearance-none bg-transparent border-0 border-b border-hairline-strong pb-2 pt-1 pr-8 font-serif text-lg text-ink focus:outline-none focus:border-crimson transition-colors"
            >
              {options.map((o) => (
                <option key={o.id} value={o.id} className="bg-surface text-ink">{o.name}</option>
              ))}
            </select>
            <span aria-hidden className="pointer-events-none absolute right-1 top-2 text-ink-faint">▾</span>
          </div>

          <div className="mt-6" style={{ width: '100%', height: 180 }}>
            {data.length < 2 ? (
              <p className="font-serif italic text-ink-dim text-center py-8">
                Need at least 2 sessions with this exercise to chart.
              </p>
            ) : (
              <ResponsiveContainer>
                <LineChart
                  data={data}
                  margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
                >
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fill: '#8a8a8c', fontSize: 10, fontFamily: 'Inter', letterSpacing: '0.12em' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#8a8a8c', fontSize: 10, fontFamily: 'Inter' }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    cursor={{ stroke: 'rgba(255,82,93,0.4)', strokeDasharray: '2 2' }}
                    contentStyle={{
                      background: '#0c0e0f',
                      border: '1px solid rgba(255,255,255,0.16)',
                      borderRadius: 4,
                      color: '#e2e2e3',
                      fontSize: 12,
                      fontFamily: 'Inter',
                    }}
                    formatter={(v) => [`${v} kg·reps`, 'Top set']}
                    labelStyle={{ color: '#8a8a8c', textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: 10 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="topVolume"
                    stroke="#ff525d"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: '#ff525d', stroke: '#ff525d' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
}
