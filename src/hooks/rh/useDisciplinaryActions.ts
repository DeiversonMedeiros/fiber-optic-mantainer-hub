import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { rhSupabase } from '@/integrations/supabase/client';
import {
  EmployeeDisciplinaryAction,
  DisciplinaryActionInsert,
  DisciplinaryActionUpdate,
  DisciplinaryActionType,
  DisciplinaryStatus
} from '@/integrations/supabase/rh-benefits-unified-types';
import { useToast } from '@/hooks/use-toast';

interface UseDisciplinaryActionsProps {
  companyId: string;
  employeeId?: string;
  actionType?: DisciplinaryActionType;
  status?: DisciplinaryStatus;
}

export function useDisciplinaryActions({ 
  companyId, 
  employeeId, 
  actionType, 
  status 
}: UseDisciplinaryActionsProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = useMemo(() => [
    'disciplinaryActions', 
    companyId, 
    employeeId, 
    actionType, 
    status
  ], [companyId, employeeId, actionType, status]);

  const queryFn = useCallback(async () => {
    console.log('🔍 Querying disciplinary actions for company:', companyId);
    
    let query = rhSupabase
      .from('rh.employee_disciplinary_actions')
      .select(`
        *,
        employees!inner(nome, matricula)
      `)
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (employeeId && employeeId !== 'all') {
      query = query.eq('employee_id', employeeId);
    }
    if (actionType) {
      query = query.eq('action_type', actionType);
    }
    if (status) {
      query = query.eq('status', status);
    }

    console.log('🔍 Query built, executing...');
    const { data, error } = await query.order('action_date', { ascending: false });
    
    if (error) {
      console.error('❌ Disciplinary actions query error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('✅ Query successful, data:', data);

    const transformedData = data?.map(item => ({
      ...item,
      employee: {
        id: item.employees?.id,
        nome: item.employees?.nome,
        matricula: item.employees?.matricula
      },
      applied_by_user: null, // TODO: Implement when user table is available
      approved_by_user: null // TODO: Implement when user table is available
    })) || [];

    console.log('✅ Transformed data:', transformedData);
    return transformedData;
  }, [companyId, employeeId, actionType, status]);

  const { data: disciplinaryActions, isLoading, error } = useQuery<EmployeeDisciplinaryAction[]>({
    queryKey,
    queryFn,
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });

  const createDisciplinaryAction = useMutation({
    mutationFn: useCallback(async (data: DisciplinaryActionInsert) => {
      const { data: result, error } = await rhSupabase
        .from('rh.employee_disciplinary_actions')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    }, []),
    onSuccess: useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['disciplinaryActions'] });
      toast({ title: 'Sucesso', description: 'Ação disciplinar registrada com sucesso.' });
    }, [queryClient, toast]),
    onError: useCallback((err) => {
      toast({ 
        title: 'Erro', 
        description: `Falha ao registrar ação disciplinar: ${err.message}`, 
        variant: 'destructive' 
      });
    }, [toast]),
  });

  const updateDisciplinaryAction = useMutation({
    mutationFn: useCallback(async ({ id, ...updates }: { id: string } & DisciplinaryActionUpdate) => {
      const { data, error } = await rhSupabase
        .from('rh.employee_disciplinary_actions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }, []),
    onSuccess: useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['disciplinaryActions'] });
      toast({ title: 'Sucesso', description: 'Ação disciplinar atualizada com sucesso.' });
    }, [queryClient, toast]),
    onError: useCallback((err) => {
      toast({ 
        title: 'Erro', 
        description: `Falha ao atualizar ação disciplinar: ${err.message}`, 
        variant: 'destructive' 
      });
    }, [toast]),
  });

  const deleteDisciplinaryAction = useMutation({
    mutationFn: useCallback(async (id: string) => {
      const { error } = await rhSupabase
        .from('rh.employee_disciplinary_actions')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
      return id;
    }, []),
    onSuccess: useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['disciplinaryActions'] });
      toast({ title: 'Sucesso', description: 'Ação disciplinar removida com sucesso.' });
    }, [queryClient, toast]),
    onError: useCallback((err) => {
      toast({ 
        title: 'Erro', 
        description: `Falha ao remover ação disciplinar: ${err.message}`, 
        variant: 'destructive' 
      });
    }, [toast]),
  });

  const approveDisciplinaryAction = useMutation({
    mutationFn: useCallback(async ({ id, approved_by }: { id: string; approved_by: string }) => {
      const { data, error } = await rhSupabase
        .from('rh.employee_disciplinary_actions')
        .update({ 
          status: 'active', 
          approved_by, 
          approved_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }, []),
    onSuccess: useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['disciplinaryActions'] });
      toast({ title: 'Sucesso', description: 'Ação disciplinar aprovada com sucesso.' });
    }, [queryClient, toast]),
    onError: useCallback((err) => {
      toast({ 
        title: 'Erro', 
        description: `Falha ao aprovar ação disciplinar: ${err.message}`, 
        variant: 'destructive' 
      });
    }, [toast]),
  });

  return {
    disciplinaryActions,
    isLoading,
    error,
    createDisciplinaryAction,
    updateDisciplinaryAction,
    deleteDisciplinaryAction,
    approveDisciplinaryAction,
  };
}

// Hook para estatísticas de ações disciplinares
export function useDisciplinaryStatistics(companyId: string) {
  const queryKey = useMemo(() => ['disciplinaryStatistics', companyId], [companyId]);

  const queryFn = useCallback(async () => {
    const { data, error } = await rhSupabase
      .from('rh.employee_disciplinary_actions')
      .select('action_type, status, action_date')
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      byType: {
        advertencia_verbal: data?.filter(item => item.action_type === 'advertencia_verbal').length || 0,
        advertencia_escrita: data?.filter(item => item.action_type === 'advertencia_escrita').length || 0,
        suspensao: data?.filter(item => item.action_type === 'suspensao').length || 0,
        demissao_justa_causa: data?.filter(item => item.action_type === 'demissao_justa_causa').length || 0,
      },
      byStatus: {
        active: data?.filter(item => item.status === 'active').length || 0,
        suspended: data?.filter(item => item.status === 'suspended').length || 0,
        expired: data?.filter(item => item.status === 'expired').length || 0,
        cancelled: data?.filter(item => item.status === 'cancelled').length || 0,
      },
      thisMonth: data?.filter(item => {
        const actionDate = new Date(item.action_date);
        const now = new Date();
        return actionDate.getMonth() === now.getMonth() && 
               actionDate.getFullYear() === now.getFullYear();
      }).length || 0,
    };

    return stats;
  }, [companyId]);

  const { data: statistics, isLoading, error } = useQuery({
    queryKey,
    queryFn,
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    statistics,
    isLoading,
    error,
  };
}
