import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 grid place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace />;
  }

  return <Outlet />;
}
