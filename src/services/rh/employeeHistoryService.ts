import { rhSupabase } from '@/integrations/supabase/client';
import { EmployeeHistory, EmployeeHistoryInsert, EmployeeHistoryUpdate, EmployeeMovementType, EmployeeHistoryWithDetails } from '@/integrations/supabase/rh-history-types';

export const EmployeeHistoryService = {
  // Obter tipos de movimentação
  async getMovementTypes(): Promise<EmployeeMovementType[]> {
    const { data, error } = await rhSupabase
      .from('rh.employee_movement_types')
      .select('*')
      .eq('is_active', true)
      .order('nome', { ascending: true });
    
    if (error) throw error;
    return data as EmployeeMovementType[];
  },

  // Obter histórico de um funcionário
  async getEmployeeHistory(employeeId: string): Promise<EmployeeHistoryWithDetails[]> {
    const { data, error } = await rhSupabase
      .from('rh.employee_history')
      .select(`
        id,
        effective_date,
        reason,
        description,
        attachment_url,
        created_at,
        employee_movement_types!inner(
          codigo,
          nome
        ),
        previous_position_id,
        previous_cost_center_id,
        previous_project_id,
        previous_work_shift_id,
        previous_manager_id,
        previous_salario_base,
        previous_status,
        new_position_id,
        new_cost_center_id,
        new_project_id,
        new_work_shift_id,
        new_manager_id,
        new_salario_base,
        new_status
      `)
      .eq('employee_id', employeeId)
      .order('effective_date', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Transformar os dados para o formato esperado
    return (data || []).map((item: any) => ({
      id: item.id,
      movement_type_codigo: item.employee_movement_types.codigo,
      movement_type_nome: item.employee_movement_types.nome,
      previous_data: {
        position_id: item.previous_position_id,
        cost_center_id: item.previous_cost_center_id,
        project_id: item.previous_project_id,
        work_shift_id: item.previous_work_shift_id,
        manager_id: item.previous_manager_id,
        salario_base: item.previous_salario_base,
        status: item.previous_status,
      },
      new_data: {
        position_id: item.new_position_id,
        cost_center_id: item.new_cost_center_id,
        project_id: item.new_project_id,
        work_shift_id: item.new_work_shift_id,
        manager_id: item.new_manager_id,
        salario_base: item.new_salario_base,
        status: item.new_status,
      },
      effective_date: item.effective_date,
      reason: item.reason,
      description: item.description,
      attachment_url: item.attachment_url,
      created_at: item.created_at,
      created_by_name: 'Sistema',
    }));
  },

  // Obter histórico com filtros
  async getHistory(params: {
    employeeId?: string;
    companyId?: string;
    movementTypeId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: EmployeeHistory[]; count: number }> {
    let query = rhSupabase
      .from('rh.employee_history')
      .select('*', { count: 'exact' })
      .order('effective_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (params.employeeId) {
      query = query.eq('employee_id', params.employeeId);
    }
    if (params.companyId) {
      query = query.eq('company_id', params.companyId);
    }
    if (params.movementTypeId) {
      query = query.eq('movement_type_id', params.movementTypeId);
    }
    if (params.dateFrom) {
      query = query.gte('effective_date', params.dateFrom);
    }
    if (params.dateTo) {
      query = query.lte('effective_date', params.dateTo);
    }

    const limit = params.limit || 50;
    const offset = params.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    
    return { data: (data as EmployeeHistory[]) || [], count: count || 0 };
  },

  // Registrar movimentação manual
  async createHistoryEntry(entry: EmployeeHistoryInsert): Promise<EmployeeHistory> {
    const { data, error } = await rhSupabase
      .from('rh.employee_history')
      .insert(entry)
      .select('*')
      .single();
    
    if (error) throw error;
    return data as EmployeeHistory;
  },

  // Atualizar entrada do histórico
  async updateHistoryEntry(id: string, updates: EmployeeHistoryUpdate): Promise<EmployeeHistory> {
    const { data, error } = await rhSupabase
      .from('rh.employee_history')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: (await rhSupabase.auth.getUser()).data.user?.id
      })
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) throw error;
    return data as EmployeeHistory;
  },

  // Deletar entrada do histórico (apenas para correções)
  async deleteHistoryEntry(id: string): Promise<void> {
    const { error } = await rhSupabase
      .from('rh.employee_history')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Obter estatísticas do histórico
  async getHistoryStats(employeeId: string): Promise<{
    totalMovements: number;
    movementsByType: { type: string; count: number }[];
    lastMovementDate: string | null;
    averageDaysBetweenMovements: number | null;
  }> {
    // Total de movimentações
    const { count: totalMovements } = await rhSupabase
      .from('rh.employee_history')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', employeeId);

    // Data da última movimentação
    const { data: lastMovement } = await rhSupabase
      .from('rh.employee_history')
      .select('effective_date')
      .eq('employee_id', employeeId)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    // Para movimentações por tipo, vamos usar uma consulta simples
    const { data: allMovements } = await rhSupabase
      .from('rh.employee_history')
      .select(`
        effective_date,
        employee_movement_types!inner(nome)
      `)
      .eq('employee_id', employeeId)
      .order('effective_date', { ascending: true });

    // Calcular média de dias entre movimentações
    let averageDaysBetweenMovements: number | null = null;
    if (allMovements && allMovements.length > 1) {
      const firstDate = new Date(allMovements[0].effective_date);
      const lastDate = new Date(allMovements[allMovements.length - 1].effective_date);
      const totalDays = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
      averageDaysBetweenMovements = Math.round(totalDays / (allMovements.length - 1));
    }

    // Agrupar movimentações por tipo
    const groupedMovements = (allMovements || []).reduce((acc: { [key: string]: number }, movement: any) => {
      const typeName = movement.employee_movement_types.nome;
      acc[typeName] = (acc[typeName] || 0) + 1;
      return acc;
    }, {});

    const movementsByTypeArray = Object.entries(groupedMovements).map(([type, count]) => ({
      type,
      count: count as number
    }));

    return {
      totalMovements: totalMovements || 0,
      movementsByType: movementsByTypeArray,
      lastMovementDate: lastMovement?.effective_date || null,
      averageDaysBetweenMovements
    };
  }
};
