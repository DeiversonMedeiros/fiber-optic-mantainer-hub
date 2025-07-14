
import React from 'react';
import LoginForm from '@/components/auth/LoginForm';

interface LoginProps {
  onLogin: (email: string, password: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  return (
    <div className="min-h-screen bg-fiber-gradient flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Logo Section */}
      <div className="absolute top-8 left-8 z-10">
        <img
          src="/sgm-logo.png"
          alt="Logomarca SGM"
          className="h-16 w-auto drop-shadow-lg"
        />
      </div>

      {/* Login Form */}
      <div className="relative z-10 w-full flex justify-center">
        <div className="w-full max-w-md">
          <LoginForm onLogin={onLogin} />
        </div>
      </div>

      {/* Fiber Optic Animation */}
      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-20">
        <div className="flex justify-center items-end h-full space-x-1">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="bg-secondary rounded-t-full animate-pulse"
              style={{
                width: '3px',
                height: `${Math.random() * 80 + 20}px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
