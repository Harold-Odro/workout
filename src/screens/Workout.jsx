import { Navigate, useLocation } from 'react-router-dom';
import SkipWorkoutFlow from './SkipWorkoutFlow.jsx';
import PPLWorkoutFlow from './PPLWorkoutFlow.jsx';

export default function Workout() {
  const location = useLocation();
  const type = location.state?.type;
  const program = location.state?.program || 'skip';

  if (!type) return <Navigate to="/" replace />;

  if (program === 'ppl') return <PPLWorkoutFlow type={type} />;
  return <SkipWorkoutFlow type={type} />;
}
