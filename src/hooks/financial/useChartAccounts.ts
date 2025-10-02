// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserCompany } from '@/hooks/useUserCompany';

export interface ChartAccount {
  id: string;
  company_id: string;
  codigo: string;
  nome: string;
  tipo: 'ativo' | 'passivo' | 'patrimonio_liquido' | 'receita' | 'despesa' | 'custos';
  nivel: number;
  parent_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  children?: ChartAccount[];
}

export interface ChartAccountFormData {
  codigo: string;
  nome: string;
  tipo: 'ativo' | 'passivo' | 'patrimonio_liquido' | 'receita' | 'despesa' | 'custos';
  nivel: number;
  parent_id?: string;
  is_active?: boolean;
}

export const useChartAccounts = () => {
  const [chartAccounts, setChartAccounts] = useState<ChartAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { companyId } = useUserCompany();

  const fetchChartAccounts = async () => {
    if (!companyId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('chart_accounts')
        .select('*')
        .eq('company_id', companyId)
        .order('codigo', { ascending: true });

      if (fetchError) throw fetchError;

      // Organizar em estrutura hierárquica
      const hierarchicalData = buildHierarchy(data || []);
      setChartAccounts(hierarchicalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar plano de contas');
    } finally {
      setLoading(false);
    }
  };

  const buildHierarchy = (accounts: ChartAccount[]): ChartAccount[] => {
    const accountMap = new Map<string, ChartAccount>();
    const rootAccounts: ChartAccount[] = [];

    // Primeiro, criar um mapa de todas as contas
    accounts.forEach(account => {
      accountMap.set(account.id, { ...account, children: [] });
    });

    // Depois, organizar hierarquicamente
    accounts.forEach(account => {
      const accountWithChildren = accountMap.get(account.id)!;
      
      if (account.parent_id) {
        const parent = accountMap.get(account.parent_id);
        if (parent) {
          parent.children!.push(accountWithChildren);
        }
      } else {
        rootAccounts.push(accountWithChildren);
      }
    });

    return rootAccounts;
  };

  const createChartAccount = async (data: ChartAccountFormData) => {
    if (!companyId) throw new Error('ID da empresa não encontrado');

    setLoading(true);
    setError(null);

    try {
      const { data: newRecord, error: insertError } = await supabase
        .from('chart_accounts')
        .insert([{ ...data, company_id: companyId }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Recarregar dados para manter hierarquia
      await fetchChartAccounts();
      return newRecord;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta contábil');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateChartAccount = async (id: string, data: Partial<ChartAccountFormData>) => {
    setLoading(true);
    setError(null);

    try {
      const { data: updatedRecord, error: updateError } = await supabase
        .from('chart_accounts')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Recarregar dados para manter hierarquia
      await fetchChartAccounts();
      return updatedRecord;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar conta contábil');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteChartAccount = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      // Verificar se a conta tem filhos
      const hasChildren = chartAccounts.some(account => 
        findAccountById(account, id)?.children && findAccountById(account, id)!.children!.length > 0
      );

      if (hasChildren) {
        throw new Error('Não é possível excluir uma conta que possui subcontas');
      }

      const { error: deleteError } = await supabase
        .from('chart_accounts')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Recarregar dados para manter hierarquia
      await fetchChartAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir conta contábil');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const findAccountById = (account: ChartAccount, id: string): ChartAccount | null => {
    if (account.id === id) return account;
    
    if (account.children) {
      for (const child of account.children) {
        const found = findAccountById(child, id);
        if (found) return found;
      }
    }
    
    return null;
  };

  const getChartAccountById = async (id: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('chart_accounts')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar conta contábil');
      throw err;
    }
  };

  const getAccountsByType = (tipo: string) => {
    const filterByType = (accounts: ChartAccount[]): ChartAccount[] => {
      return accounts.filter(account => account.tipo === tipo);
    };

    return filterByType(chartAccounts);
  };

  const getActiveAccounts = () => {
    const filterActive = (accounts: ChartAccount[]): ChartAccount[] => {
      return accounts
        .filter(account => account.is_active)
        .map(account => ({
          ...account,
          children: account.children ? filterActive(account.children) : []
        }));
    };

    return filterActive(chartAccounts);
  };

  const validateAccountCode = (codigo: string, parentId?: string) => {
    // Verificar se o código já existe
    const existingAccount = chartAccounts.find(account => 
      findAccountByCode(account, codigo)
    );

    if (existingAccount) {
      return { isValid: false, message: 'Código já existe' };
    }

    // Verificar se o código é válido para o nível
    if (parentId) {
      const parent = chartAccounts.find(account => 
        findAccountById(account, parentId)
      );
      
      if (parent) {
        const parentCode = findAccountById(parent, parentId)?.codigo || '';
        if (!codigo.startsWith(parentCode)) {
          return { isValid: false, message: 'Código deve começar com o código da conta pai' };
        }
      }
    }

    return { isValid: true };
  };

  const findAccountByCode = (account: ChartAccount, codigo: string): ChartAccount | null => {
    if (account.codigo === codigo) return account;
    
    if (account.children) {
      for (const child of account.children) {
        const found = findAccountByCode(child, codigo);
        if (found) return found;
      }
    }
    
    return null;
  };

  const getAccountPath = (accountId: string): string[] => {
    const findPath = (accounts: ChartAccount[], targetId: string, path: string[] = []): string[] | null => {
      for (const account of accounts) {
        const currentPath = [...path, account.nome];
        
        if (account.id === targetId) {
          return currentPath;
        }
        
        if (account.children) {
          const found = findPath(account.children, targetId, currentPath);
          if (found) return found;
        }
      }
      return null;
    };

    return findPath(chartAccounts, accountId) || [];
  };

  useEffect(() => {
    if (companyId) {
      fetchChartAccounts();
    }
  }, [companyId]);

  return {
    chartAccounts,
    loading,
    error,
    fetchChartAccounts,
    createChartAccount,
    updateChartAccount,
    deleteChartAccount,
    getChartAccountById,
    getAccountsByType,
    getActiveAccounts,
    validateAccountCode,
    getAccountPath,
  };
};



