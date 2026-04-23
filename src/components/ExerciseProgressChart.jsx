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
    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm uppercase tracking-wider text-neutral-500">
          Exercise progression
        </h2>
        <span className="text-xs text-neutral-500">top-set volume (reps × kg)</span>
      </div>
      {ids.length === 0 ? (
        <p className="text-sm text-neutral-500 py-10 text-center">
          Log a PPL session to start tracking exercise progression.
        </p>
      ) : (
        <>
          <select
            value={selectedId || ''}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            {options.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
          <div className="mt-4" style={{ width: '100%', height: 180 }}>
            {data.length < 2 ? (
              <p className="text-sm text-neutral-500 py-8 text-center">
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
                    tick={{ fill: '#737373', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#737373', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    cursor={{ stroke: '#262626' }}
                    contentStyle={{
                      background: '#0a0a0a',
                      border: '1px solid #262626',
                      borderRadius: 8,
                      color: '#e5e5e5',
                      fontSize: 12,
                    }}
                    formatter={(v) => [`${v} kg·reps`, 'Top set']}
                    labelStyle={{ color: '#a3a3a3' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="topVolume"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#22c55e' }}
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
