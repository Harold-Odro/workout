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
              'block rounded-full transition-colors',
              isCurrent ? 'w-6 h-2 bg-green-500' : 'w-2 h-2',
              !isCurrent && isDone ? 'bg-green-500/70' : '',
              !isCurrent && !isDone ? 'bg-neutral-700' : '',
            ].join(' ')}
          />
        );
      })}
    </div>
  );
}
