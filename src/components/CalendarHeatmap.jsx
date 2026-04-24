import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { computeHeatmap } from '../lib/analytics.js';

const ROW_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

const INTENSITY_CLASS = {
  0: 'bg-surface-high',
  1: 'bg-crimson-blood/40',
  2: 'bg-crimson-deep/70',
  3: 'bg-crimson-bright/80',
  4: 'bg-crimson-bright',
};

export default function CalendarHeatmap({ sessions, weeks = 12, selectedDate, onSelect }) {
  const grid = useMemo(() => computeHeatmap(sessions, weeks), [sessions, weeks]);

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-flex gap-2 min-w-full">
        <div className="flex flex-col gap-1 pt-1 font-mono text-[9px] tracking-[0.18em] uppercase text-ink-faint">
          {ROW_LABELS.map((l, i) => (
            <div key={i} className="h-4 leading-4">{l}</div>
          ))}
        </div>
        <div className="flex gap-1">
          {grid.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-1">
              {col.map((cell, ri) => {
                const isSelected = selectedDate === cell.date;
                const clickable = !!cell.entry && !cell.inFuture;
                return (
                  <button
                    key={ri}
                    type="button"
                    disabled={!clickable}
                    onClick={() => clickable && onSelect?.(cell.date)}
                    aria-label={
                      cell.entry
                        ? `${format(parseISO(cell.date), 'MMM d')} — ${cell.entry.sessions.length} session${cell.entry.sessions.length === 1 ? '' : 's'}`
                        : format(parseISO(cell.date), 'MMM d')
                    }
                    className={[
                      'w-4 h-4 transition-all',
                      cell.inFuture ? 'opacity-30' : '',
                      INTENSITY_CLASS[cell.intensity],
                      isSelected ? 'outline-1 outline-crimson outline-offset-1' : '',
                      clickable ? 'hover:outline-1 hover:outline-crimson/60' : '',
                    ].join(' ')}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2 label-md text-ink-faint">
        <span className="opacity-70">Less</span>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={`w-3 h-3 ${INTENSITY_CLASS[i]}`} />
        ))}
        <span className="opacity-70">More</span>
      </div>
    </div>
  );
}
