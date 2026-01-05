// src/pages/categories/CategoriesRoute.tsx
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Categories from '@/components/Categories';

const MEDIA_TYPES = ['text', 'audio', 'video', 'image', 'document'] as const;
type MediaType = (typeof MEDIA_TYPES)[number];

const CategoriesRoute = () => {
  const navigate = useNavigate();
  const { mediaType } = useParams<{ mediaType?: string }>();
  const { token, logout } = useAuth();

  if (!mediaType || !MEDIA_TYPES.includes(mediaType as MediaType)) {
    return <Navigate to="/media" replace />;
  }

  const safeMediaType = mediaType as MediaType;

  return (
    <Categories
      token={token!}
      preSelectedMediaType={safeMediaType}
      onBack={() => navigate('/media')}
      onLogout={logout}
      onSessionExpired={() => {
        logout();
        navigate('/login', { replace: true });
      }}
    />
  );
};

export default CategoriesRoute;
