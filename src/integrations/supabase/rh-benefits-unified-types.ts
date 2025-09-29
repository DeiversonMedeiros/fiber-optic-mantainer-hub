// =====================================================
// TIPOS UNIFICADOS PARA SISTEMA DE BENEFÍCIOS
// =====================================================
// Esta arquivo define os tipos TypeScript para o sistema unificado de benefícios

// 1. ENUMS E TIPOS BASE
// =====================================================

export type BenefitType = 'vr_va' | 'transporte' | 'equipment_rental' | 'premiacao';
export type CalculationType = 'fixed_value' | 'daily_value' | 'percentage' | 'production_based' | 'goal_based';
export type ProcessingStatus = 'pending' | 'calculated' | 'validated' | 'paid' | 'cancelled';
export type PaymentMethod = 'flash' | 'transfer' | 'pix';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Ações Disciplinares
export type DisciplinaryActionType = 'advertencia_verbal' | 'advertencia_escrita' | 'suspensao' | 'demissao_justa_causa';
export type DisciplinaryStatus = 'active' | 'suspended' | 'expired' | 'cancelled';

// 2. CONFIGURAÇÕES DE BENEFÍCIOS
// =====================================================

export interface BenefitConfiguration {
  id: string;
  company_id: string;
  benefit_type: BenefitType;
  name: string;
  description?: string;
  calculation_type: CalculationType;
  
  // Configurações de valor
  base_value?: number;
  percentage_value?: number;
  min_value?: number;
  max_value?: number;
  
  // Configurações específicas por tipo
  daily_calculation_base: number;
  production_percentage?: number;
  goal_id?: string;
  
  // Regras de desconto
  discount_rules: Record<string, any>;
  apply_absence_discount: boolean;
  absence_discount_percentage: number;
  apply_holiday_discount: boolean;
  apply_vacation_discount: boolean;
  apply_sick_leave_discount: boolean;
  apply_suspension_discount: boolean;
  
  // Configurações de pagamento
  payment_methods: PaymentMethod[];
  flash_category?: string;
  
  // Status e controle
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface BenefitConfigurationInsert {
  company_id: string;
  benefit_type: BenefitType;
  name: string;
  description?: string;
  calculation_type: CalculationType;
  base_value?: number;
  percentage_value?: number;
  min_value?: number;
  max_value?: number;
  daily_calculation_base?: number;
  production_percentage?: number;
  goal_id?: string;
  discount_rules?: Record<string, any>;
  apply_absence_discount?: boolean;
  absence_discount_percentage?: number;
  payment_methods?: PaymentMethod[];
  flash_category?: string;
  is_active?: boolean;
  created_by?: string;
}

export interface BenefitConfigurationUpdate {
  id: string;
  name?: string;
  description?: string;
  calculation_type?: CalculationType;
  base_value?: number;
  percentage_value?: number;
  min_value?: number;
  max_value?: number;
  daily_calculation_base?: number;
  production_percentage?: number;
  goal_id?: string;
  discount_rules?: Record<string, any>;
  apply_absence_discount?: boolean;
  absence_discount_percentage?: number;
  payment_methods?: PaymentMethod[];
  flash_category?: string;
  is_active?: boolean;
  updated_by?: string;
}

// 3. VÍNCULOS FUNCIONÁRIO-BENEFÍCIO
// =====================================================

export interface EmployeeBenefitAssignment {
  id: string;
  employee_id: string;
  benefit_config_id?: string;
  company_id: string;
  benefit_type: string; // Para compatibilidade com estrutura existente
  vr_va_config_id?: string;
  transporte_config_id?: string;
  criteria_type: string;
  criteria_value?: string;
  
  // Período de vigência
  start_date: string;
  end_date?: string;
  
  // Valores customizados
  custom_value?: number;
  custom_percentage?: number;
  
  // Status e controle
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  
  // Relacionamentos
  employee?: {
    id: string;
    nome: string;
    matricula: string;
  };
  benefit_configuration?: BenefitConfiguration;
}

export interface EmployeeBenefitAssignmentInsert {
  employee_id: string;
  benefit_config_id?: string;
  company_id: string;
  benefit_type: string;
  vr_va_config_id?: string;
  transporte_config_id?: string;
  criteria_type: string;
  criteria_value?: string;
  start_date: string;
  end_date?: string;
  custom_value?: number;
  custom_percentage?: number;
  is_active?: boolean;
  created_by?: string;
}

export interface EmployeeBenefitAssignmentUpdate {
  id: string;
  benefit_config_id?: string;
  benefit_type?: string;
  vr_va_config_id?: string;
  transporte_config_id?: string;
  criteria_type?: string;
  criteria_value?: string;
  start_date?: string;
  end_date?: string;
  custom_value?: number;
  custom_percentage?: number;
  is_active?: boolean;
  updated_by?: string;
}

// 4. PROCESSAMENTO MENSAL
// =====================================================

export interface MonthlyBenefitProcessing {
  id: string;
  employee_id: string;
  benefit_config_id: string;
  company_id: string;
  
  // Período de referência
  month_reference: number;
  year_reference: number;
  
  // Valores calculados
  base_value: number;
  work_days: number;
  absence_days: number;
  discount_value: number;
  final_value: number;
  
  // Dados de produção (para premiação)
  production_value?: number;
  production_percentage?: number;
  
  // Status e controle
  status: ProcessingStatus;
  processed_at?: string;
  validated_at?: string;
  validated_by?: string;
  
  // Metadados
  calculation_details: Record<string, any>;
  notes?: string;
  
  created_at: string;
  updated_at: string;
  
  // Campos calculados para exibição
  employee_name?: string;
  employee_matricula?: string;
  benefit_name?: string;
  benefit_type?: BenefitTypeEnum;
  
  // Relacionamentos
  employee?: {
    id: string;
    nome: string;
    matricula: string;
  };
  benefit_configuration?: BenefitConfiguration;
}

export interface MonthlyBenefitProcessingInsert {
  employee_id: string;
  benefit_config_id: string;
  company_id: string;
  month_reference: number;
  year_reference: number;
  base_value: number;
  work_days: number;
  absence_days: number;
  discount_value: number;
  final_value: number;
  production_value?: number;
  production_percentage?: number;
  status?: ProcessingStatus;
  calculation_details?: Record<string, any>;
  notes?: string;
}

export interface MonthlyBenefitProcessingUpdate {
  id: string;
  base_value?: number;
  work_days?: number;
  absence_days?: number;
  discount_value?: number;
  final_value?: number;
  production_value?: number;
  production_percentage?: number;
  status?: ProcessingStatus;
  validated_by?: string;
  calculation_details?: Record<string, any>;
  notes?: string;
}

// 5. PAGAMENTOS
// =====================================================

export interface BenefitPayment {
  id: string;
  processing_id: string;
  company_id: string;
  
  // Dados do pagamento
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_value: number;
  
  // Dados da transação
  transaction_id?: string;
  payment_date?: string;
  
  // Dados do beneficiário
  employee_name: string;
  employee_document?: string;
  bank_account_data?: Record<string, any>;
  
  // Status e controle
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  
  // Relacionamentos
  processing?: MonthlyBenefitProcessing;
}

// 4. AÇÕES DISCIPLINARES
// =====================================================

export interface EmployeeDisciplinaryAction {
  id: string;
  company_id: string;
  employee_id: string;
  action_type: DisciplinaryActionType;
  action_date: string;
  description: string;
  duration_days?: number;
  start_date?: string;
  end_date?: string;
  status: DisciplinaryStatus;
  applied_by?: string;
  approved_by?: string;
  approved_at?: string;
  documents?: Record<string, any>;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  
  // Relacionamentos
  employee?: {
    id: string;
    nome: string;
    matricula: string;
  };
  applied_by_user?: {
    id: string;
    name: string;
  };
  approved_by_user?: {
    id: string;
    name: string;
  };
}

export interface DisciplinaryActionInsert {
  company_id: string;
  employee_id: string;
  action_type: DisciplinaryActionType;
  action_date: string;
  description: string;
  duration_days?: number;
  start_date?: string;
  end_date?: string;
  status?: DisciplinaryStatus;
  applied_by?: string;
  approved_by?: string;
  documents?: Record<string, any>;
  notes?: string;
  is_active?: boolean;
  created_by?: string;
}

export interface DisciplinaryActionUpdate {
  action_type?: DisciplinaryActionType;
  action_date?: string;
  description?: string;
  duration_days?: number;
  start_date?: string;
  end_date?: string;
  status?: DisciplinaryStatus;
  applied_by?: string;
  approved_by?: string;
  approved_at?: string;
  documents?: Record<string, any>;
  notes?: string;
  is_active?: boolean;
  updated_by?: string;
}

export interface BenefitPaymentInsert {
  processing_id: string;
  company_id: string;
  payment_method: PaymentMethod;
  payment_status?: PaymentStatus;
  payment_value: number;
  transaction_id?: string;
  payment_date?: string;
  employee_name: string;
  employee_document?: string;
  bank_account_data?: Record<string, any>;
  created_by?: string;
}

export interface BenefitPaymentUpdate {
  id: string;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
  payment_value?: number;
  transaction_id?: string;
  payment_date?: string;
  employee_name?: string;
  employee_document?: string;
  bank_account_data?: Record<string, any>;
  updated_by?: string;
}

// 6. ESTATÍSTICAS
// =====================================================

export interface BenefitStatistics {
  benefit_type: BenefitType;
  total_configurations: number;
  active_configurations: number;
  total_assignments: number;
  active_assignments: number;
  total_processed_value: number;
  total_paid_value: number;
  pending_value: number;
}

// 7. PROCESSAMENTO EM MASSA
// =====================================================

export interface BulkPremiacaoImport {
  employee_id: string;
  value: number;
  description?: string;
}

export interface BulkPremiacaoImportResult {
  employee_id: string;
  employee_name: string;
  benefit_config_id: string;
  benefit_name: string;
  value: number;
  success: boolean;
  error_message?: string;
}

// 8. RESULTADOS DE PROCESSAMENTO
// =====================================================

export interface ProcessMonthlyBenefitsResult {
  employee_id: string;
  employee_name: string;
  benefit_type: BenefitType;
  benefit_name: string;
  base_value: number;
  work_days: number;
  absence_days: number;
  discount_value: number;
  final_value: number;
  status: ProcessingStatus;
}

export interface ValidateProcessingResult {
  processing_id: string;
  employee_name: string;
  benefit_name: string;
  final_value: number;
  status: ProcessingStatus;
}

export interface CreateBulkPaymentsResult {
  payment_id: string;
  employee_name: string;
  benefit_name: string;
  payment_value: number;
  payment_status: PaymentStatus;
}

// 9. CONFIGURAÇÕES ESPECÍFICAS POR TIPO
// =====================================================

export interface VrVaConfiguration extends BenefitConfiguration {
  benefit_type: 'vr_va';
  calculation_type: 'fixed_value' | 'daily_value';
  flash_category: 'REFEICAO E ALIMENTACAO';
}

export interface TransporteConfiguration extends BenefitConfiguration {
  benefit_type: 'transporte';
  calculation_type: 'fixed_value' | 'daily_value';
  flash_category: 'VALE TRANSPORTE PIX';
}

export interface EquipmentRentalConfiguration extends BenefitConfiguration {
  benefit_type: 'equipment_rental';
  calculation_type: 'daily_value';
  daily_calculation_base: 30; // Base fixa de 30 dias
  flash_category: 'PREMIACAO VIRTUAL';
}

export interface PremiacaoConfiguration extends BenefitConfiguration {
  benefit_type: 'premiacao';
  calculation_type: 'fixed_value' | 'production_based' | 'goal_based';
  flash_category: 'PREMIACAO VIRTUAL';
}

// 10. UTILITÁRIOS
// =====================================================

export const BENEFIT_TYPE_LABELS: Record<BenefitType, string> = {
  vr_va: 'VR/VA',
  transporte: 'Vale Transporte',
  equipment_rental: 'Locação de Equipamentos',
  premiacao: 'Premiação/Produtividade'
};

export const CALCULATION_TYPE_LABELS: Record<CalculationType, string> = {
  fixed_value: 'Valor Fixo',
  daily_value: 'Valor por Dia',
  percentage: 'Percentual',
  production_based: 'Baseado em Produção',
  goal_based: 'Baseado em Meta'
};

export const PROCESSING_STATUS_LABELS: Record<ProcessingStatus, string> = {
  pending: 'Pendente',
  calculated: 'Calculado',
  validated: 'Validado',
  paid: 'Pago',
  cancelled: 'Cancelado'
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  flash: 'Flash',
  transfer: 'Transferência Bancária',
  pix: 'PIX'
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pendente',
  processing: 'Processando',
  completed: 'Concluído',
  failed: 'Falhou'
};
