import { lazy, Suspense, useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav.jsx';
import Today from './screens/Today.jsx';
import Workout from './screens/Workout.jsx';
import Log from './screens/Log.jsx';
import History from './screens/History.jsx';
import SessionDetail from './screens/SessionDetail.jsx';
import Plan from './screens/Plan.jsx';
import Settings from './screens/Settings.jsx';

// Progress pulls in Recharts — lazy-load so it doesn't bloat the main bundle.
const Progress = lazy(() => import('./screens/Progress.jsx'));

const FULLSCREEN_ROUTES = ['/workout', '/log'];

export default function App() {
  const location = useLocation();
  const showNav = !FULLSCREEN_ROUTES.includes(location.pathname);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="min-h-full bg-neutral-950 text-neutral-100">
      <Routes>
        <Route path="/" element={<Today toast={toast} />} />
        <Route path="/workout" element={<Workout />} />
        <Route path="/log" element={<Log setToast={setToast} />} />
        <Route path="/history" element={<History />} />
        <Route path="/session/:id" element={<SessionDetail />} />
        <Route
          path="/progress"
          element={
            <Suspense fallback={<ProgressLoading />}>
              <Progress />
            </Suspense>
          }
        />
        <Route path="/plan" element={<Plan />} />
        <Route path="/settings" element={<Settings setToast={setToast} />} />
        <Route path="*" element={<Today toast={toast} />} />
      </Routes>
      {showNav ? <BottomNav /> : null}
      {toast && location.pathname !== '/' ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 rounded-xl bg-green-500/10 border border-green-500/40 text-green-400 px-4 py-2 text-sm backdrop-blur shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function ProgressLoading() {
  return (
    <div className="min-h-full pt-safe pb-24 px-5 pt-10">
      <h1 className="text-2xl font-semibold text-neutral-100">Progress</h1>
      <p className="mt-2 text-sm text-neutral-500">Loading…</p>
    </div>
  );
}
