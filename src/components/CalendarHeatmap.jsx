import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { computeHeatmap } from '../lib/analytics.js';

const ROW_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

const INTENSITY_CLASS = {
  0: 'bg-neutral-900',
  1: 'bg-green-500/25',
  2: 'bg-green-500/50',
  3: 'bg-green-500/75',
  4: 'bg-green-500',
};

export default function CalendarHeatmap({ sessions, weeks = 12, selectedDate, onSelect }) {
  const grid = useMemo(() => computeHeatmap(sessions, weeks), [sessions, weeks]);

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-flex gap-2 min-w-full">
        <div className="flex flex-col gap-1 pt-1 text-[10px] text-neutral-600">
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
                      'w-4 h-4 rounded-sm',
                      cell.inFuture ? 'opacity-30' : '',
                      INTENSITY_CLASS[cell.intensity],
                      isSelected ? 'ring-2 ring-green-400 ring-offset-1 ring-offset-neutral-950' : '',
                      clickable ? 'hover:ring-1 hover:ring-green-400' : '',
                    ].join(' ')}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-neutral-500">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={`w-3 h-3 rounded-sm ${INTENSITY_CLASS[i]}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
