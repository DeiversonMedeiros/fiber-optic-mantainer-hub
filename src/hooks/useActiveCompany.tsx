import React, { createContext, useContext, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CompaniesService, Company } from '@/services/core/companiesService';

type ActiveCompanyContextValue = {
  companies: Company[];
  activeCompanyId: string | null;
  setActiveCompanyId: (id: string | null) => void;
  loading: boolean;
};

const ActiveCompanyContext = createContext<ActiveCompanyContextValue | undefined>(undefined);

export const ActiveCompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['core', 'companies'],
    queryFn: () => CompaniesService.list(),
  });

  const value = useMemo<ActiveCompanyContextValue>(() => ({
    companies: data || [],
    activeCompanyId,
    setActiveCompanyId,
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


