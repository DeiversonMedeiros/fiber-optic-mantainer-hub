import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserCompany } from '@/hooks/useUserCompany';

export interface AccountsReceivable {
  id: string;
  company_id: string;
  cliente_id?: string;
  numero_documento?: string;
  descricao: string;
  valor: number;
  data_vencimento?: string;
  data_recebimento?: string;
  valor_recebido?: number;
  status: 'pendente' | 'recebido' | 'vencido' | 'cancelado';
  cost_center_id?: string;
  project_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface AccountsReceivableFilters {
  cliente_id?: string;
  data_inicio?: string;
  data_fim?: string;
  valor_min?: number;
  valor_max?: number;
  status?: string;
  cost_center_id?: string;
  project_id?: string;
}

export interface AccountsReceivableFormData {
  cliente_id?: string;
  numero_documento?: string;
  descricao: string;
  valor: number;
  data_vencimento?: string;
  data_recebimento?: string;
  valor_recebido?: number;
  status: 'pendente' | 'recebido' | 'vencido' | 'cancelado';
  cost_center_id?: string;
  project_id?: string;
}

export const useAccountsReceivable = () => {
  const [accountsReceivable, setAccountsReceivable] = useState<AccountsReceivable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { companyId } = useUserCompany();

  const fetchAccountsReceivable = async (filters?: AccountsReceivableFilters) => {
    if (!companyId) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('accounts_receivable')
        .select(`
          *,
          cost_centers:cost_center_id(id, nome),
          projects:project_id(id, nome)
        `)
        .eq('company_id', companyId)
        .order('data_vencimento', { ascending: true });

      if (filters) {
        if (filters.cliente_id) {
          query = query.eq('cliente_id', filters.cliente_id);
        }
        if (filters.data_inicio) {
          query = query.gte('data_vencimento', filters.data_inicio);
        }
        if (filters.data_fim) {
          query = query.lte('data_vencimento', filters.data_fim);
        }
        if (filters.valor_min) {
          query = query.gte('valor', filters.valor_min);
        }
        if (filters.valor_max) {
          query = query.lte('valor', filters.valor_max);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.cost_center_id) {
          query = query.eq('cost_center_id', filters.cost_center_id);
        }
        if (filters.project_id) {
          query = query.eq('project_id', filters.project_id);
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setAccountsReceivable(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contas a receber');
    } finally {
      setLoading(false);
    }
  };

  const createAccountsReceivable = async (data: AccountsReceivableFormData) => {
    if (!companyId) throw new Error('ID da empresa não encontrado');

    setLoading(true);
    setError(null);

    try {
      const { data: newRecord, error: insertError } = await supabase
        .from('accounts_receivable')
        .insert([{ ...data, company_id: companyId }])
        .select()
        .single();

      if (insertError) throw insertError;

      setAccountsReceivable(prev => [newRecord, ...prev]);
      return newRecord;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta a receber');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAccountsReceivable = async (id: string, data: Partial<AccountsReceivableFormData>) => {
    setLoading(true);
    setError(null);

    try {
      const { data: updatedRecord, error: updateError } = await supabase
        .from('accounts_receivable')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setAccountsReceivable(prev =>
        prev.map(item => (item.id === id ? updatedRecord : item))
      );

      return updatedRecord;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar conta a receber');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccountsReceivable = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('accounts_receivable')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setAccountsReceivable(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir conta a receber');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAccountsReceivableById = async (id: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('accounts_receivable')
        .select(`
          *,
          cost_centers:cost_center_id(id, nome),
          projects:project_id(id, nome)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar conta a receber');
      throw err;
    }
  };

  const getAgingReport = async () => {
    if (!companyId) return [];

    try {
      const { data, error: fetchError } = await supabase
        .rpc('get_accounts_receivable_aging', { company_id: companyId });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar relatório de aging');
      return [];
    }
  };

  const getTotalByStatus = async () => {
    if (!companyId) return {};

    try {
      const { data, error: fetchError } = await supabase
        .rpc('get_accounts_receivable_totals', { company_id: companyId });

      if (fetchError) throw fetchError;
      return data || {};
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar totais');
      return {};
    }
  };

  const getDSO = async () => {
    if (!companyId) return 0;

    try {
      const { data, error: fetchError } = await supabase
        .rpc('calculate_dso', { company_id: companyId });

      if (fetchError) throw fetchError;
      return data || 0;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao calcular DSO');
      return 0;
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchAccountsReceivable();
    }
  }, [companyId]);

  return {
    accountsReceivable,
    loading,
    error,
    fetchAccountsReceivable,
    createAccountsReceivable,
    updateAccountsReceivable,
    deleteAccountsReceivable,
    getAccountsReceivableById,
    getAgingReport,
    getTotalByStatus,
    getDSO,
  };
};



