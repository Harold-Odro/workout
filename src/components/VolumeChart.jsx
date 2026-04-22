import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { computeVolumeByWeek } from '../lib/analytics.js';

export default function VolumeChart({ sessions }) {
  const data = computeVolumeByWeek(sessions, 8);
  const hasData = data.some((d) => d.skipMinutes > 0);

  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm uppercase tracking-wider text-neutral-500">
          Volume
        </h2>
        <span className="text-xs text-neutral-500">skip min / week · last 8 weeks</span>
      </div>
      {!hasData ? (
        <p className="text-sm text-neutral-500 py-10 text-center">
          No skip minutes logged yet.
        </p>
      ) : (
        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: '#737373', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                tick={{ fill: '#737373', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                cursor={{ fill: '#262626' }}
                contentStyle={{
                  background: '#0a0a0a',
                  border: '1px solid #262626',
                  borderRadius: 8,
                  color: '#e5e5e5',
                  fontSize: 12,
                }}
                formatter={(value) => [`${value} min`, 'Skip']}
                labelStyle={{ color: '#a3a3a3' }}
              />
              <Bar
                dataKey="skipMinutes"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
