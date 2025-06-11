
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard route which will handle auth
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-fiber-gradient flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
          <div className="w-8 h-8 bg-primary rounded-full"></div>
        </div>
        <p className="text-white">Redirecionando...</p>
      </div>
    </div>
  );
};

export default Index;
