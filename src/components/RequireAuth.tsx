import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { t } = useTranslation();
  const { token, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return <div>{t('messages.loading')}</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default RequireAuth;
