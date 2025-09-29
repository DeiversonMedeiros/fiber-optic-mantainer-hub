import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/rh-client';
import { 
  EmploymentContract, 
  EmploymentContractInsert, 
  EmploymentContractUpdate,
  Position,
  WorkSchedule
} from '@/integrations/supabase/rh-types';

export function useEmployeeContracts(employeeId: string) {
  const queryClient = useQueryClient();

  // Buscar contratos do funcionário
  const {
    data: contracts = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['employee-contracts', employeeId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('employment_contracts')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EmploymentContract[];
    },
    enabled: !!employeeId,
  });

  // Buscar cargos
  const { data: positions = [] } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('positions')
        .select('*')
        .eq('is_active', true)
        .order('nome');

      if (error) throw error;
      return data as Position[];
    },
  });

  // Buscar escalas de trabalho
  const { data: workSchedules = [] } = useQuery({
    queryKey: ['work-schedules'],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('work_schedules')
        .select('*')
        .eq('is_active', true)
        .order('nome');

      if (error) throw error;
      return data as WorkSchedule[];
    },
  });

  // Criar contrato
  const createContract = useMutation({
    mutationFn: async (data: EmploymentContractInsert) => {
      const { data: result, error } = await rhSupabase
        .from('employment_contracts')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result as EmploymentContract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-contracts', employeeId] });
    },
  });

  // Atualizar contrato
  const updateContract = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & EmploymentContractUpdate) => {
      const { data: result, error } = await rhSupabase
        .from('employment_contracts')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as EmploymentContract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-contracts', employeeId] });
    },
  });

  // Deletar contrato
  const deleteContract = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('employment_contracts')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-contracts', employeeId] });
    },
  });

  return {
    contracts,
    positions,
    workSchedules,
    isLoading,
    error,
    createContract,
    updateContract,
    deleteContract,
  };
}
