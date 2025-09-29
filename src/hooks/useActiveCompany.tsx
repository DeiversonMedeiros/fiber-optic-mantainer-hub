import React, { createContext, useContext, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CompaniesService, Company } from '@/services/core/companiesService';
import { UserCompaniesService } from '@/services/core/userCompaniesService';
import { useAuth } from './useAuth';

type ActiveCompanyContextValue = {
  companies: Company[];
  activeCompanyId: string | null;
  setActiveCompanyId: (id: string | null) => void;
  loading: boolean;
};

const ActiveCompanyContext = createContext<ActiveCompanyContextValue | undefined>(undefined);

export const ActiveCompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(() => {
    // Recuperar empresa selecionada do localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('activeCompanyId');
    }
    return null;
  });

  const { data, isLoading } = useQuery({
    queryKey: ['core', 'companies', user?.id],
    queryFn: () => CompaniesService.list(),
    enabled: !!user, // Só busca se o usuário estiver logado
  });

  const value = useMemo<ActiveCompanyContextValue>(() => ({
    companies: data || [],
    activeCompanyId,
    setActiveCompanyId: (id: string | null) => {
      setActiveCompanyId(id);
      // Persistir seleção no localStorage
      if (typeof window !== 'undefined') {
        if (id) {
          localStorage.setItem('activeCompanyId', id);
        } else {
          localStorage.removeItem('activeCompanyId');
        }
      }
    },
    loading: isLoading,
  }), [data, activeCompanyId, isLoading]);

  return (
    <ActiveCompanyContext.Provider value={value}>
      {children}
    </ActiveCompanyContext.Provider>
  );
};

export const useActiveCompany = () => {
  const ctx = useContext(ActiveCompanyContext);
  if (!ctx) throw new Error('useActiveCompany must be used within ActiveCompanyProvider');
  return ctx;
};


