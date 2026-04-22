import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav.jsx';
import Today from './screens/Today.jsx';
import Workout from './screens/Workout.jsx';
import Log from './screens/Log.jsx';
import History from './screens/History.jsx';
import Plan from './screens/Plan.jsx';

const FULLSCREEN_ROUTES = ['/workout', '/log'];

export default function App() {
  const location = useLocation();
  const showNav = !FULLSCREEN_ROUTES.includes(location.pathname);
  const [toast, setToast] = useState(null);

  // Auto-dismiss toast after a moment, and clear on navigation away.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (location.pathname !== '/') setToast(null);
  }, [location.pathname]);

  return (
    <div className="min-h-full bg-neutral-950 text-neutral-100">
      <Routes>
        <Route path="/" element={<Today toast={toast} />} />
        <Route path="/workout" element={<Workout />} />
        <Route path="/log" element={<Log setToast={setToast} />} />
        <Route path="/history" element={<History />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="*" element={<Today toast={toast} />} />
      </Routes>
      {showNav ? <BottomNav /> : null}
    </div>
  );
}
