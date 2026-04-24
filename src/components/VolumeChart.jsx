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
    <div className="tonal p-6">
      <div className="eyebrow">
        <h2>Volume</h2>
        <span className="meta">Skip min · 8&nbsp;wk</span>
      </div>
      <div className="hairline mb-4" />
      {!hasData ? (
        <p className="font-serif italic text-ink-dim text-center py-10">
          No skip minutes logged yet.
        </p>
      ) : (
        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: '#8a8a8c', fontSize: 10, fontFamily: 'Inter', letterSpacing: '0.12em' }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                tick={{ fill: '#8a8a8c', fontSize: 10, fontFamily: 'Inter' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,82,93,0.06)' }}
                contentStyle={{
                  background: '#0c0e0f',
                  border: '1px solid rgba(255,255,255,0.16)',
                  borderRadius: 4,
                  color: '#e2e2e3',
                  fontSize: 12,
                  fontFamily: 'Inter',
                }}
                formatter={(value) => [`${value} min`, 'Skip']}
                labelStyle={{ color: '#8a8a8c', textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: 10 }}
              />
              <Bar
                dataKey="skipMinutes"
                fill="#ff525d"
                radius={[1, 1, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
