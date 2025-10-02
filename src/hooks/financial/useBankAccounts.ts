// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserCompany } from '@/hooks/useUserCompany';

export interface BankAccount {
  id: string;
  company_id: string;
  banco: string;
  agencia?: string;
  conta: string;
  tipo_conta?: string;
  saldo_atual?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface BankAccountFormData {
  banco: string;
  agencia?: string;
  conta: string;
  tipo_conta?: string;
  saldo_atual?: number;
  is_active?: boolean;
}

export const useBankAccounts = () => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { companyId } = useUserCompany();

  const fetchBankAccounts = async () => {
    if (!companyId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('company_id', companyId)
        .order('banco', { ascending: true });

      if (fetchError) throw fetchError;

      setBankAccounts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contas bancárias');
    } finally {
      setLoading(false);
    }
  };

  const createBankAccount = async (data: BankAccountFormData) => {
    if (!companyId) throw new Error('ID da empresa não encontrado');

    setLoading(true);
    setError(null);

    try {
      const { data: newRecord, error: insertError } = await supabase
        .from('bank_accounts')
        .insert([{ ...data, company_id: companyId }])
        .select()
        .single();

      if (insertError) throw insertError;

      setBankAccounts(prev => [newRecord, ...prev]);
      return newRecord;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta bancária');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateBankAccount = async (id: string, data: Partial<BankAccountFormData>) => {
    setLoading(true);
    setError(null);

    try {
      const { data: updatedRecord, error: updateError } = await supabase
        .from('bank_accounts')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setBankAccounts(prev =>
        prev.map(item => (item.id === id ? updatedRecord : item))
      );

      return updatedRecord;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar conta bancária');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteBankAccount = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setBankAccounts(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir conta bancária');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getBankAccountById = async (id: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar conta bancária');
      throw err;
    }
  };

  const getTotalBalance = () => {
    return bankAccounts
      .filter(account => account.is_active)
      .reduce((total, account) => total + (account.saldo_atual || 0), 0);
  };

  const getActiveAccounts = () => {
    return bankAccounts.filter(account => account.is_active);
  };

  useEffect(() => {
    if (companyId) {
      fetchBankAccounts();
    }
  }, [companyId]);

  return {
    bankAccounts,
    loading,
    error,
    fetchBankAccounts,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    getBankAccountById,
    getTotalBalance,
    getActiveAccounts,
  };
};



