import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { EmployeeBankAccount, EmployeeBankAccountInsert, EmployeeBankAccountUpdate } from '@/integrations/supabase/rh-types';

const EMPLOYEE_BANK_ACCOUNTS_KEYS = {
  all: ['employee_bank_accounts'] as const,
  lists: () => [...EMPLOYEE_BANK_ACCOUNTS_KEYS.all, 'list'] as const,
  list: (employeeId: string) => [...EMPLOYEE_BANK_ACCOUNTS_KEYS.lists(), employeeId] as const,
  details: () => [...EMPLOYEE_BANK_ACCOUNTS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...EMPLOYEE_BANK_ACCOUNTS_KEYS.details(), id] as const,
  byEmployee: (employeeId: string) => [...EMPLOYEE_BANK_ACCOUNTS_KEYS.all, 'employee', employeeId] as const,
  primary: (employeeId: string) => [...EMPLOYEE_BANK_ACCOUNTS_KEYS.byEmployee(employeeId), 'primary'] as const,
};

export const useEmployeeBankAccounts = (employeeId?: string) => {
  const queryClient = useQueryClient();
  
  const { data: bankAccounts, isLoading, error } = useQuery({
    queryKey: EMPLOYEE_BANK_ACCOUNTS_KEYS.list(employeeId || ''),
    queryFn: async (): Promise<EmployeeBankAccount[]> => {
      if (!employeeId) return [];
      
      const { data, error } = await rhSupabase
        .from('employee_bank_accounts')
        .select('*')
        .eq('employee_id', employeeId)
        .order('conta_principal', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!employeeId,
  });

  // Conta principal
  const primaryAccount = bankAccounts?.find(account => account.conta_principal) || null;

  const createBankAccount = useMutation({
    mutationFn: async (newAccount: EmployeeBankAccountInsert) => {
      // Se esta conta for marcada como principal, desmarcar outras
      if (newAccount.conta_principal) {
        await rhSupabase
          .from('employee_bank_accounts')
          .update({ conta_principal: false })
          .eq('employee_id', newAccount.employee_id);
      }

      const { data, error } = await rhSupabase
        .from('employee_bank_accounts')
        .insert(newAccount)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_BANK_ACCOUNTS_KEYS.byEmployee(variables.employee_id) });
    },
  });

  const updateBankAccount = useMutation({
    mutationFn: async ({ id, ...updates }: EmployeeBankAccountUpdate & { id: string }) => {
      // Se esta conta for marcada como principal, desmarcar outras
      if (updates.conta_principal) {
        const { data: currentAccount } = await rhSupabase
          .from('employee_bank_accounts')
          .select('employee_id')
          .eq('id', id)
          .single();

        if (currentAccount) {
          await rhSupabase
            .from('employee_bank_accounts')
            .update({ conta_principal: false })
            .eq('employee_id', currentAccount.employee_id)
            .neq('id', id);
        }
      }

      const { data, error } = await rhSupabase
        .from('employee_bank_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_BANK_ACCOUNTS_KEYS.byEmployee(data.employee_id) });
    },
  });

  const deleteBankAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('employee_bank_accounts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (employeeId) {
        queryClient.invalidateQueries({ queryKey: EMPLOYEE_BANK_ACCOUNTS_KEYS.byEmployee(employeeId) });
      }
    },
  });

  const setPrimaryAccount = useMutation({
    mutationFn: async (accountId: string) => {
      // Primeiro, obter o employee_id da conta
      const { data: account, error: fetchError } = await rhSupabase
        .from('employee_bank_accounts')
        .select('employee_id')
        .eq('id', accountId)
        .single();

      if (fetchError) throw fetchError;

      // Desmarcar todas as contas como principais
      await rhSupabase
        .from('employee_bank_accounts')
        .update({ conta_principal: false })
        .eq('employee_id', account.employee_id);

      // Marcar a conta selecionada como principal
      const { data, error } = await rhSupabase
        .from('employee_bank_accounts')
        .update({ conta_principal: true })
        .eq('id', accountId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_BANK_ACCOUNTS_KEYS.byEmployee(data.employee_id) });
    },
  });

  return {
    bankAccounts,
    primaryAccount,
    isLoading,
    error,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    setPrimaryAccount,
  };
};




