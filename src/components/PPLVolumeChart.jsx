import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { pplVolumeByWeek } from '../lib/analyticsPPL.js';

const BAR_COLORS = {
  push: '#22c55e',
  pull: '#60a5fa',
  legs: '#f59e0b',
  circuit: '#a78bfa',
};

const LABELS = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  circuit: 'Circuit',
};

export default function PPLVolumeChart({ sessions }) {
  const data = useMemo(() => pplVolumeByWeek(sessions, 8), [sessions]);
  const hasData = data.some((d) => d.push || d.pull || d.legs || d.circuit);

  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm uppercase tracking-wider text-neutral-500">
          PPL volume
        </h2>
        <span className="text-xs text-neutral-500">sets / week · last 8</span>
      </div>
      {!hasData ? (
        <p className="text-sm text-neutral-500 py-10 text-center">
          No PPL sets logged yet.
        </p>
      ) : (
        <div style={{ width: '100%', height: 200 }}>
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
                formatter={(v, name) => [`${v} sets`, LABELS[name] || name]}
                labelStyle={{ color: '#a3a3a3' }}
              />
              <Legend
                iconSize={10}
                wrapperStyle={{ fontSize: 11, color: '#a3a3a3' }}
                formatter={(v) => LABELS[v] || v}
              />
              <Bar dataKey="push"    stackId="a" fill={BAR_COLORS.push}    />
              <Bar dataKey="pull"    stackId="a" fill={BAR_COLORS.pull}    />
              <Bar dataKey="legs"    stackId="a" fill={BAR_COLORS.legs}    />
              <Bar dataKey="circuit" stackId="a" fill={BAR_COLORS.circuit} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
