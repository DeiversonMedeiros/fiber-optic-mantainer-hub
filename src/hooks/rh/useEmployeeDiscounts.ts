import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { EmployeeDiscount, EmployeeDiscountInsert, EmployeeDiscountUpdate } from '@/integrations/supabase/rh-types';

const DISCOUNT_KEYS = {
  all: ['employeeDiscounts'] as const,
  lists: () => [...DISCOUNT_KEYS.all, 'list'] as const,
  list: (filters: string) => [...DISCOUNT_KEYS.lists(), { filters }] as const,
  details: () => [...DISCOUNT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...DISCOUNT_KEYS.details(), id] as const,
  byEmployee: (employeeId: string) => [...DISCOUNT_KEYS.all, 'employee', employeeId] as const,
  byCompany: (companyId: string) => [...DISCOUNT_KEYS.all, 'company', companyId] as const,
};

export const useEmployeeDiscounts = (employeeId?: string, companyId?: string) => {
  const queryClient = useQueryClient();
  
  const { data: discounts, isLoading, error } = useQuery({
    queryKey: employeeId ? DISCOUNT_KEYS.byEmployee(employeeId) : DISCOUNT_KEYS.byCompany(companyId || ''),
    queryFn: async (): Promise<EmployeeDiscount[]> => {
      try {
        let query = rhSupabase.from('rh.employee_discounts')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (employeeId) { 
          query = query.eq('employee_id', employeeId); 
        }
        if (companyId) { 
          query = query.eq('company_id', companyId); 
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        console.log('✅ useEmployeeDiscounts: Sucesso! Descontos encontrados:', data?.length || 0);
        return data || [];
      } catch (error) {
        console.error('❌ useEmployeeDiscounts: Erro ao buscar descontos:', error);
        throw error;
      }
    },
    enabled: !!(employeeId || companyId),
  });

  const createDiscount = useMutation({
    mutationFn: async (newDiscount: EmployeeDiscountInsert) => {
      const { data, error } = await rhSupabase.from('rh.employee_discounts')
        .insert([newDiscount])
        .select(`
          *,
          employees(nome, matricula, salario_base)
        `)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISCOUNT_KEYS.lists() });
    },
  });

  const updateDiscount = useMutation({
    mutationFn: async ({ id, ...updates }: EmployeeDiscountUpdate & { id: string }) => {
      const { data, error } = await rhSupabase.from('rh.employee_discounts')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          employees(nome, matricula, salario_base)
        `)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISCOUNT_KEYS.lists() });
    },
  });

  const deleteDiscount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase.from('rh.employee_discounts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISCOUNT_KEYS.lists() });
    },
  });

  const getDiscountById = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await rhSupabase.from('rh.employee_discounts')
        .select(`
          *,
          employees(nome, matricula, salario_base)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Função para calcular valor máximo da parcela (30% do salário base)
  const calculateMaxInstallment = (salaryBase: number): number => {
    return salaryBase * 0.30;
  };

  // Função para validar se o valor da parcela excede o limite
  const validateInstallmentValue = (installmentValue: number, salaryBase: number): { isValid: boolean; maxValue: number; warning?: string } => {
    const maxValue = calculateMaxInstallment(salaryBase);
    const isValid = installmentValue <= maxValue;
    
    if (!isValid) {
      return {
        isValid: false,
        maxValue,
        warning: `Valor da parcela (R$ ${installmentValue.toFixed(2)}) excede 30% do salário base (R$ ${maxValue.toFixed(2)}). Valor máximo recomendado: R$ ${maxValue.toFixed(2)}`
      };
    }
    
    return { isValid: true, maxValue };
  };

  // Função para calcular parcelas automaticamente
  const calculateInstallments = (totalValue: number, salaryBase: number, maxInstallments: number = 12) => {
    const maxInstallmentValue = calculateMaxInstallment(salaryBase);
    const minInstallments = Math.ceil(totalValue / maxInstallmentValue);
    
    if (minInstallments > maxInstallments) {
      return {
        canInstall: false,
        minInstallments,
        maxInstallments,
        maxInstallmentValue,
        warning: `Valor total (R$ ${totalValue.toFixed(2)}) requer no mínimo ${minInstallments} parcelas, mas o máximo permitido é ${maxInstallments}.`
      };
    }
    
    const installmentValue = totalValue / minInstallments;
    
    return {
      canInstall: true,
      minInstallments,
      maxInstallments,
      maxInstallmentValue,
      recommendedInstallments: minInstallments,
      recommendedInstallmentValue: installmentValue
    };
  };

  return {
    discounts: discounts || [],
    isLoading,
    error,
    createDiscount,
    updateDiscount,
    deleteDiscount,
    getDiscountById,
    calculateMaxInstallment,
    validateInstallmentValue,
    calculateInstallments,
  };
};
