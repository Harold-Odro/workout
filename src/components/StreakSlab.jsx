import { PPL_META } from '../lib/workoutsPPL.js';

// Heavy editorial streak block. Sits high on Today — meant to be the first
// thing the eye hits after the headline. Stakes-forward: late in the day,
// when today's scheduled session is unheld, the copy escalates.

export default function StreakSlab({ streak }) {
  const { days, scheduledToday, completedToday, atRisk, hoursRemaining, brokenAt } = streak;

  const todayName = scheduledToday ? PPL_META[scheduledToday]?.name : null;

  // Choose the stakes line.
  let stakes;
  let urgent = false;
  if (brokenAt && days === 0) {
    stakes = `The streak broke at ${brokenAt}. Begin again.`;
    urgent = true;
  } else if (!scheduledToday) {
    stakes = `${days === 0 ? 'No streak yet.' : 'The streak rests with you.'}`;
  } else if (completedToday) {
    stakes = `Today is held. Day ${days + 1} starts tomorrow.`;
  } else if (atRisk && hoursRemaining !== null && hoursRemaining <= 4) {
    stakes = `${hoursRemaining} hour${hoursRemaining === 1 ? '' : 's'} left. Don't break it.`;
    urgent = true;
  } else if (atRisk) {
    stakes = `Today is ${todayName}. The streak ends if it goes unfinished.`;
  } else {
    stakes = `Today is ${todayName}.`;
  }

  // Display number: when today is at-risk, show today as the day on the line
  // (so the user sees what they're playing for), with the stakes copy under it.
  // Otherwise show the held count.
  const displayNumber = atRisk ? days + 1 : days;
  const displayLabel = atRisk ? 'AT STAKE' : days === 0 ? 'BEGIN' : 'UNBROKEN';

  return (
    <section
      aria-label="Scheduled streak"
      className={`relative px-8 py-7 ${urgent ? 'streak-urgent' : ''}`}
    >
      <span aria-hidden className="absolute left-0 top-0 right-0 hairline-strong" />
      <span aria-hidden className="absolute left-0 bottom-0 right-0 hairline-strong" />
      {urgent ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            background:
              'radial-gradient(120% 80% at 50% 0%, rgba(255,82,93,0.55), transparent 65%)',
          }}
        />
      ) : null}

      <div className="relative flex items-end justify-between gap-6">
        <div className="min-w-0">
          <div className="label-md text-ink-faint tracking-[0.32em]">DAY</div>
          <div className="mt-1 flex items-baseline gap-3">
            <span
              className={`font-serif font-light tabular leading-none ${
                urgent ? 'text-crimson-bright' : 'text-ink'
              }`}
              style={{ fontSize: 'clamp(64px, 18vw, 112px)' }}
            >
              {displayNumber}
            </span>
            {atRisk ? (
              <span className="font-serif italic text-ink-faint text-base leading-none mb-2">
                in waiting
              </span>
            ) : null}
          </div>
        </div>

        <div className="text-right shrink-0 mb-2">
          <div className="label-md text-ink-faint tracking-[0.32em]">STREAK</div>
          <div
            className={`mt-1 label-md tabular tracking-[0.22em] ${
              urgent ? 'text-crimson-bright' : days > 0 ? 'text-crimson' : 'text-ink-faint'
            }`}
          >
            ◆&nbsp;&nbsp;{displayLabel}
          </div>
          {atRisk && hoursRemaining !== null ? (
            <div className="mt-2 font-mono text-[11px] tabular tracking-[0.18em] text-crimson-bright">
              {hoursRemaining}H&nbsp;LEFT
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative mt-4 hairline" />

      <p
        className={`relative mt-4 font-serif italic leading-snug ${
          urgent ? 'text-ink' : 'text-ink-dim'
        }`}
        style={{ fontSize: 'clamp(15px, 3.6vw, 17px)' }}
      >
        {stakes}
      </p>
    </section>
  );
}
