import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      signOut(); // Limpa qualquer resíduo de sessão
      navigate('/login'); // Redireciona para login
    }
  }, [user, loading, signOut, navigate]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return <>{children}</>;
}; 