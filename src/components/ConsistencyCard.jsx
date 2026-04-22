import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import {
  computeSessionsPerWeek,
  computeWeeklyStreak,
} from '../lib/analytics.js';

export default function ConsistencyCard({ sessions }) {
  const streak = computeWeeklyStreak(sessions);
  const data = computeSessionsPerWeek(sessions, 12);
  const hasData = data.some((d) => d.sessions > 0);

  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm uppercase tracking-wider text-neutral-500">
          Consistency
        </h2>
        <span className="text-xs text-neutral-500">
          sessions/week · last 12 weeks
        </span>
      </div>
      <div className="flex items-end gap-2">
        <div className="font-mono text-5xl font-bold text-green-500 leading-none">
          {streak}
        </div>
        <div className="text-xs text-neutral-400 pb-1">
          week{streak === 1 ? '' : 's'} streak
        </div>
      </div>
      {!hasData ? (
        <p className="mt-4 text-sm text-neutral-500 py-4 text-center">
          No sessions yet.
        </p>
      ) : (
        <div className="mt-4" style={{ width: '100%', height: 80 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <XAxis dataKey="label" hide />
              <Tooltip
                cursor={{ stroke: '#262626' }}
                contentStyle={{
                  background: '#0a0a0a',
                  border: '1px solid #262626',
                  borderRadius: 8,
                  color: '#e5e5e5',
                  fontSize: 12,
                }}
                formatter={(value) => [value, 'Sessions']}
                labelStyle={{ color: '#a3a3a3' }}
              />
              <Line
                type="monotone"
                dataKey="sessions"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
