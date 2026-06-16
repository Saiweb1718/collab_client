import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../xcontext/AuthContext.jsx';
import Spinner from './ui/Spinner.jsx';

const FullScreenLoader = () => (
  <div className="flex h-screen items-center justify-center text-haze">
    <Spinner size={28} />
  </div>
);

export function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function RedirectIfAuth() {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  return user ? <Navigate to="/" replace /> : <Outlet />;
}
