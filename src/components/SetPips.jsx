export default function SetPips({ total, completed, current }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Set ${current + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => {
        const isDone = i < completed;
        const isCurrent = i === current;
        return (
          <span
            key={i}
            aria-hidden
            className={[
              'block transition-colors',
              isCurrent ? 'w-6 h-0.5 bg-crimson-bright' : 'w-2 h-0.5',
              !isCurrent && isDone ? 'bg-crimson/70' : '',
              !isCurrent && !isDone ? 'bg-surface-bright' : '',
            ].join(' ')}
          />
        );
      })}
    </div>
  );
}
