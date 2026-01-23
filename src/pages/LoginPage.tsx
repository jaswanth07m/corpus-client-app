import LoginForm from '@/components/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import React from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const { login, token } = useAuth();
  const navigate = useNavigate();

  if (token) {
    navigate('/', { replace: true });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLoginSuccess = (token: string, user: any) => {
    login(token, user);
    navigate('/', { replace: true });
  };

  return <LoginForm onLoginSuccess={handleLoginSuccess} />;
}

export default LoginPage;
