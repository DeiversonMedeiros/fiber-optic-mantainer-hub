export type EmployeeMovementType = {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type EmployeeHistory = {
  id: string;
  employee_id: string;
  company_id: string;
  movement_type_id: string;
  
  // Dados anteriores
  previous_position_id?: string | null;
  previous_cost_center_id?: string | null;
  previous_project_id?: string | null;
  previous_department_id?: string | null;
  previous_work_shift_id?: string | null;
  previous_manager_id?: string | null;
  previous_salario_base?: number | null;
  previous_status?: string | null;
  
  // Dados novos
  new_position_id?: string | null;
  new_cost_center_id?: string | null;
  new_project_id?: string | null;
  new_department_id?: string | null;
  new_work_shift_id?: string | null;
  new_manager_id?: string | null;
  new_salario_base?: number | null;
  new_status?: string | null;
  
  // Metadados
  effective_date: string;
  reason?: string | null;
  description?: string | null;
  attachment_url?: string | null;
  
  // Auditoria
  created_at: string;
  created_by: string;
  updated_at?: string | null;
  updated_by?: string | null;
};

export type EmployeeHistoryInsert = Omit<EmployeeHistory, 'id' | 'created_at' | 'updated_at'>;

export type EmployeeHistoryUpdate = Partial<Omit<EmployeeHistory, 'id' | 'employee_id' | 'company_id' | 'created_at' | 'created_by'>>;

export type EmployeeHistoryWithDetails = {
  id: string;
  movement_type_codigo: string;
  movement_type_nome: string;
  previous_data: {
    position_id?: string | null;
    cost_center_id?: string | null;
    project_id?: string | null;
    department_id?: string | null;
    work_shift_id?: string | null;
    manager_id?: string | null;
    salario_base?: number | null;
    status?: string | null;
  };
  new_data: {
    position_id?: string | null;
    cost_center_id?: string | null;
    project_id?: string | null;
    department_id?: string | null;
    work_shift_id?: string | null;
    manager_id?: string | null;
    salario_base?: number | null;
    status?: string | null;
  };
  effective_date: string;
  reason?: string | null;
  description?: string | null;
  attachment_url?: string | null;
  created_at: string;
  created_by_name?: string | null;
};
