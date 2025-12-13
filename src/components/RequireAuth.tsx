import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { token, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return <div>Loading...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default RequireAuth;
