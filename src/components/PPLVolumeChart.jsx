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

// Crimson-anchored palette: primary on Push, monochrome tonal stack
// for the supporting categories so the chart stays disciplined.
const BAR_COLORS = {
  push:    '#ff525d',
  pull:    '#c8c6c8',
  legs:    '#8a8a8c',
  circuit: '#5f3e3e',
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
    <div className="tonal p-6">
      <div className="eyebrow">
        <h2>PPL volume</h2>
        <span className="meta">Sets · 8&nbsp;wk</span>
      </div>
      <div className="hairline mb-4" />
      {!hasData ? (
        <p className="font-serif italic text-ink-dim text-center py-10">
          No PPL sets logged yet.
        </p>
      ) : (
        <div style={{ width: '100%', height: 200 }}>
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
                formatter={(v, name) => [`${v} sets`, LABELS[name] || name]}
                labelStyle={{ color: '#8a8a8c', textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: 10 }}
              />
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: 10, color: '#8a8a8c', fontFamily: 'Inter', letterSpacing: '0.16em', textTransform: 'uppercase' }}
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
