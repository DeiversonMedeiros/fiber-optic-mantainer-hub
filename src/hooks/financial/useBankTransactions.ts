// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserCompany } from '@/hooks/useUserCompany';

export interface BankTransaction {
  id: string;
  company_id: string;
  bank_account_id: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  data_movimento?: string;
  data_conciliacao?: string;
  conciliado: boolean;
  created_at: string;
  updated_at?: string;
}

export interface BankTransactionFilters {
  bank_account_id?: string;
  tipo?: string;
  data_inicio?: string;
  data_fim?: string;
  conciliado?: boolean;
  descricao?: string;
}

export interface BankTransactionFormData {
  bank_account_id: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  data_movimento?: string;
  data_conciliacao?: string;
  conciliado?: boolean;
}

export const useBankTransactions = () => {
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { companyId } = useUserCompany();

  const fetchBankTransactions = async (filters?: BankTransactionFilters) => {
    if (!companyId) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('bank_transactions')
        .select(`
          *,
          bank_accounts:bank_account_id(id, banco, conta)
        `)
        .eq('company_id', companyId)
        .order('data_movimento', { ascending: false });

      if (filters) {
        if (filters.bank_account_id) {
          query = query.eq('bank_account_id', filters.bank_account_id);
        }
        if (filters.tipo) {
          query = query.eq('tipo', filters.tipo);
        }
        if (filters.data_inicio) {
          query = query.gte('data_movimento', filters.data_inicio);
        }
        if (filters.data_fim) {
          query = query.lte('data_movimento', filters.data_fim);
        }
        if (filters.conciliado !== undefined) {
          query = query.eq('conciliado', filters.conciliado);
        }
        if (filters.descricao) {
          query = query.ilike('descricao', `%${filters.descricao}%`);
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setBankTransactions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar transações bancárias');
    } finally {
      setLoading(false);
    }
  };

  const createBankTransaction = async (data: BankTransactionFormData) => {
    if (!companyId) throw new Error('ID da empresa não encontrado');

    setLoading(true);
    setError(null);

    try {
      const { data: newRecord, error: insertError } = await supabase
        .from('bank_transactions')
        .insert([{ ...data, company_id: companyId }])
        .select()
        .single();

      if (insertError) throw insertError;

      setBankTransactions(prev => [newRecord, ...prev]);
      return newRecord;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar transação bancária');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateBankTransaction = async (id: string, data: Partial<BankTransactionFormData>) => {
    setLoading(true);
    setError(null);

    try {
      const { data: updatedRecord, error: updateError } = await supabase
        .from('bank_transactions')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setBankTransactions(prev =>
        prev.map(item => (item.id === id ? updatedRecord : item))
      );

      return updatedRecord;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar transação bancária');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteBankTransaction = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('bank_transactions')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setBankTransactions(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir transação bancária');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getBankTransactionById = async (id: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('bank_transactions')
        .select(`
          *,
          bank_accounts:bank_account_id(id, banco, conta)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar transação bancária');
      throw err;
    }
  };

  const reconcileTransaction = async (id: string, dataConciliacao: string) => {
    return updateBankTransaction(id, {
      data_conciliacao: dataConciliacao,
      conciliado: true,
    });
  };

  const unreconcileTransaction = async (id: string) => {
    return updateBankTransaction(id, {
      data_conciliacao: undefined,
      conciliado: false,
    });
  };

  const getCashFlowProjection = async (days: number = 90) => {
    if (!companyId) return [];

    try {
      const { data, error: fetchError } = await supabase
        .rpc('get_cash_flow_projection', { 
          company_id: companyId,
          days_ahead: days 
        });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar projeção de fluxo de caixa');
      return [];
    }
  };

  const getBankReconciliation = async (bankAccountId: string, dataInicio: string, dataFim: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .rpc('get_bank_reconciliation', { 
          bank_account_id: bankAccountId,
          data_inicio: dataInicio,
          data_fim: dataFim
        });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar conciliação bancária');
      return [];
    }
  };

  const getUnreconciledTransactions = async (bankAccountId?: string) => {
    if (!companyId) return [];

    try {
      let query = supabase
        .from('bank_transactions')
        .select(`
          *,
          bank_accounts:bank_account_id(id, banco, conta)
        `)
        .eq('company_id', companyId)
        .eq('conciliado', false)
        .order('data_movimento', { ascending: false });

      if (bankAccountId) {
        query = query.eq('bank_account_id', bankAccountId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar transações não conciliadas');
      return [];
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchBankTransactions();
    }
  }, [companyId]);

  return {
    bankTransactions,
    loading,
    error,
    fetchBankTransactions,
    createBankTransaction,
    updateBankTransaction,
    deleteBankTransaction,
    getBankTransactionById,
    reconcileTransaction,
    unreconcileTransaction,
    getCashFlowProjection,
    getBankReconciliation,
    getUnreconciledTransactions,
  };
};



