// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserCompany } from '@/hooks/useUserCompany';

export interface AccountsPayable {
  id: string;
  company_id: string;
  fornecedor_id?: string;
  numero_documento?: string;
  descricao: string;
  valor: number;
  data_vencimento?: string;
  data_pagamento?: string;
  valor_pago?: number;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  cost_center_id?: string;
  project_id?: string;
  classe_financeira?: string;
  created_at: string;
  updated_at?: string;
}

export interface AccountsPayableFilters {
  fornecedor_id?: string;
  data_inicio?: string;
  data_fim?: string;
  valor_min?: number;
  valor_max?: number;
  status?: string;
  cost_center_id?: string;
  project_id?: string;
  classe_financeira?: string;
}

export interface AccountsPayableFormData {
  fornecedor_id?: string;
  numero_documento?: string;
  descricao: string;
  valor: number;
  data_vencimento?: string;
  data_pagamento?: string;
  valor_pago?: number;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  cost_center_id?: string;
  project_id?: string;
  classe_financeira?: string;
}

export const useAccountsPayable = () => {
  const [accountsPayable, setAccountsPayable] = useState<AccountsPayable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { companyId } = useUserCompany();

  const fetchAccountsPayable = async (filters?: AccountsPayableFilters) => {
    if (!companyId) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('accounts_payable')
        .select(`
          *,
          cost_centers:cost_center_id(id, nome),
          projects:project_id(id, nome)
        `)
        .eq('company_id', companyId)
        .order('data_vencimento', { ascending: true });

      if (filters) {
        if (filters.fornecedor_id) {
          query = query.eq('fornecedor_id', filters.fornecedor_id);
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
        if (filters.classe_financeira) {
          query = query.eq('classe_financeira', filters.classe_financeira);
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setAccountsPayable(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contas a pagar');
    } finally {
      setLoading(false);
    }
  };

  const createAccountsPayable = async (data: AccountsPayableFormData) => {
    if (!companyId) throw new Error('ID da empresa não encontrado');

    setLoading(true);
    setError(null);

    try {
      const { data: newRecord, error: insertError } = await supabase
        .from('accounts_payable')
        .insert([{ ...data, company_id: companyId }])
        .select()
        .single();

      if (insertError) throw insertError;

      setAccountsPayable(prev => [newRecord, ...prev]);
      return newRecord;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta a pagar');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAccountsPayable = async (id: string, data: Partial<AccountsPayableFormData>) => {
    setLoading(true);
    setError(null);

    try {
      const { data: updatedRecord, error: updateError } = await supabase
        .from('accounts_payable')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setAccountsPayable(prev =>
        prev.map(item => (item.id === id ? updatedRecord : item))
      );

      return updatedRecord;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar conta a pagar');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccountsPayable = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('accounts_payable')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setAccountsPayable(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir conta a pagar');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAccountsPayableById = async (id: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('accounts_payable')
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
      setError(err instanceof Error ? err.message : 'Erro ao carregar conta a pagar');
      throw err;
    }
  };

  const getAgingReport = async () => {
    if (!companyId) return [];

    try {
      const { data, error: fetchError } = await supabase
        .rpc('get_accounts_payable_aging', { company_id: companyId });

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
        .rpc('get_accounts_payable_totals', { company_id: companyId });

      if (fetchError) throw fetchError;
      return data || {};
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar totais');
      return {};
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchAccountsPayable();
    }
  }, [companyId]);

  return {
    accountsPayable,
    loading,
    error,
    fetchAccountsPayable,
    createAccountsPayable,
    updateAccountsPayable,
    deleteAccountsPayable,
    getAccountsPayableById,
    getAgingReport,
    getTotalByStatus,
  };
};



