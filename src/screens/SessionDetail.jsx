import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Pencil } from 'lucide-react';
import Button from '../components/Button.jsx';
import { WORKOUT_META } from '../lib/workouts.js';
import { formatDuration, formatDateShort } from '../lib/time.js';
import { deleteSession, getSessionById } from '../lib/storage.js';

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSession(getSessionById(id));
    setLoaded(true);
  }, [id]);

  if (!loaded) return null;

  if (!session) {
    return (
      <div className="min-h-full pt-safe pb-24 px-5 pt-10 text-center">
        <p className="text-neutral-500">Session not found.</p>
        <Link to="/history" className="mt-4 inline-block text-green-500">
          Back to history
        </Link>
      </div>
    );
  }

  const meta = WORKOUT_META[session.type];

  function handleDelete() {
    deleteSession(session.id);
    navigate('/history', { replace: true });
  }

  function handleEdit() {
    navigate('/log', {
      state: {
        draft: session,
        editingId: session.id,
      },
    });
  }

  return (
    <div className="min-h-full pt-safe pb-24">
      <header className="px-5 pt-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="text-xs uppercase tracking-widest text-green-500">
            Session
          </div>
          <h1 className="text-xl font-semibold text-neutral-100">
            {meta?.name || session.type}
          </h1>
        </div>
      </header>

      <div className="px-5 mt-6 space-y-3">
        <Stat label="Date" value={formatDateShort(session.date)} />
        <Stat
          label="Duration"
          value={formatDuration(session.durationSeconds)}
        />
        <Stat
          label="Rounds"
          value={`${session.completedRounds} / ${session.plannedRounds}`}
        />
        <Stat label="RPE" value={session.rpe} mono />
        {session.skipped ? <Stat label="Status" value="Skipped" /> : null}
        {session.notes ? (
          <div className="rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3">
            <div className="text-xs uppercase tracking-widest text-neutral-500 mb-1">
              Notes
            </div>
            <pre className="whitespace-pre-wrap text-sm text-neutral-200 font-sans">
              {session.notes}
            </pre>
          </div>
        ) : null}
      </div>

      <div className="px-5 mt-8 flex gap-3">
        <Button
          variant="secondary"
          size="md"
          className="flex-1"
          onClick={handleEdit}
        >
          <Pencil size={16} className="mr-2" /> Edit
        </Button>
        <Button
          variant="danger"
          size="md"
          className="flex-1"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 size={16} className="mr-2" /> Delete
        </Button>
      </div>

      {confirmDelete ? (
        <div className="fixed inset-0 z-30 bg-black/70 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
            <h3 className="text-lg font-semibold text-neutral-100">Delete session?</h3>
            <p className="mt-1 text-sm text-neutral-400">This can't be undone.</p>
            <div className="mt-4 flex gap-3">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                className="flex-1"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3">
      <span className="text-sm text-neutral-400">{label}</span>
      <span
        className={[
          'text-neutral-100',
          mono ? 'font-mono text-lg' : 'text-base',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  );
}
