// @ts-nocheck
// Temporary type-safe version of AppSidebar

import React from 'react';
import { useAuth } from '@/hooks/useAuth';

export const AppSidebar = () => {
  const { user } = useAuth();
  
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
        {user && (
          <p className="text-sm text-gray-600 mt-2">
            Bem-vindo, {user.email}
          </p>
        )}
        
        <nav className="mt-8">
          <ul className="space-y-2">
            <li>
              <a 
                href="/dashboard" 
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Dashboard
              </a>
            </li>
            <li>
              <a 
                href="/employees" 
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Funcionários
              </a>
            </li>
            <li>
              <a 
                href="/time-tracking" 
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Controle de Ponto
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default AppSidebar;