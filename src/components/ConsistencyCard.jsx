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
    <div className="tonal p-6">
      <div className="eyebrow">
        <h2>Consistency</h2>
        <span className="meta">Sessions · 12&nbsp;wk</span>
      </div>
      <div className="hairline mb-5" />

      <div className="flex items-end gap-3">
        <div className="font-serif text-7xl font-light text-crimson tabular leading-none">
          {streak}
        </div>
        <div className="label-md text-ink-faint pb-2">
          week{streak === 1 ? '' : 's'}<br />in a row
        </div>
      </div>

      {!hasData ? (
        <p className="mt-6 font-serif italic text-ink-dim text-center py-2">
          No sessions yet.
        </p>
      ) : (
        <div className="mt-6" style={{ width: '100%', height: 80 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <XAxis dataKey="label" hide />
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
                formatter={(value) => [value, 'Sessions']}
                labelStyle={{ color: '#8a8a8c', textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: 10 }}
              />
              <Line
                type="monotone"
                dataKey="sessions"
                stroke="#ff525d"
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
