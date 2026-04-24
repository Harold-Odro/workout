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
    <div className="crimson-atmos min-h-full bg-surface text-ink">
      <div className="relative z-10">
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
      </div>
      {showNav ? <BottomNav /> : null}
      {toast && location.pathname !== '/' ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 label-md bg-surface-1 text-crimson px-4 py-3 rounded border border-hairline-strong"
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-crimson-bright mr-2 align-middle heartbeat" />
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function ProgressLoading() {
  return (
    <div className="min-h-full pt-safe pb-28 px-8 pt-16">
      <div className="label-md text-ink-faint">Section · 03</div>
      <h1 className="headline-lg mt-3">Progress</h1>
      <div className="hairline mt-6" />
      <p className="mt-6 label-md text-ink-faint heartbeat">
        Loading the archive
      </p>
    </div>
  );
}
