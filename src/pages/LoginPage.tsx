import LoginForm from '@/components/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import { isProfileComplete } from '@/lib/profileUtils';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NetworkStrengthIndicator } from '@/components/NetworkStrengthIndicator';

function LoginPage() {
  const { login, token } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (token) {
      navigate('/', { replace: true });
    }
  }, [token, navigate]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLoginSuccess = async (token: string, user: any) => {
    try {
      const fullUser = await login(token, user);
      if (fullUser && !isProfileComplete(fullUser)) {
        navigate('/complete-profile/step-2', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="relative">
      <div className="absolute top-3 right-3 z-50">
        <NetworkStrengthIndicator />
      </div>
      <LoginForm onLoginSuccess={handleLoginSuccess} />
    </div>
  );
}

export default LoginPage;
