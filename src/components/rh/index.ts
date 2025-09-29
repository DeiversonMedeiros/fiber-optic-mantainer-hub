// ===== COMPONENTES BASE =====
export { EnhancedDataTable } from './EnhancedDataTable';
export { FormModal, FormSection, FormField, FormRow, FormColumn, type FormModalProps } from './FormModal';
export {
  TableActions, ViewAction, EditAction, DeleteAction, StatusAction, EmployeeStatusAction,
  type ActionItem, type TableActionsProps
} from './TableActions';

// ===== COMPONENTES ESPECÍFICOS =====
export { EmployeeTable, EmployeeStats } from './EmployeeTable';
export { EmployeeForm, EmployeeDetails } from './EmployeeForm';
export { PositionTable } from './PositionTable';
export { PositionForm, PositionDetails } from './PositionForm';
export { TimeRecordTable } from './TimeRecordTable';
export { TimeRecordForm, TimeRecordDetails } from './TimeRecordForm';
export { WorkScheduleTable } from './WorkScheduleTable';
export { WorkScheduleForm } from './WorkScheduleForm';
export { WorkShiftTable } from './WorkShiftTable';
export { WorkShiftForm } from './WorkShiftForm';
// BenefitsTable e BenefitsForm removidos - substituídos pelo sistema unificado
export { PayrollTable } from './PayrollTable';
export { PayrollForm } from './PayrollForm';
export { VacationsTable } from './VacationsTable';
export { VacationsForm } from './VacationsForm';
export { MedicalCertificatesTable } from './MedicalCertificatesTable';
export { MedicalCertificatesForm } from './MedicalCertificatesForm';
export { ESocialEventsTable } from './ESocialEventsTable';
export { ESocialEventsForm } from './ESocialEventsForm';
export { RecruitmentTable } from './RecruitmentTable';
export { RecruitmentForm } from './RecruitmentForm';
export { TrainingTable } from './TrainingTable';
export { TrainingForm } from './TrainingForm';
export { UnionTable } from './UnionTable';
export { UnionForm } from './UnionForm';
export { EmploymentContractTable } from './EmploymentContractTable';
export { EmploymentContractForm } from './EmploymentContractForm';
export { EmployeeShiftTable } from './EmployeeShiftTable';
export { EmployeeShiftForm } from './EmployeeShiftForm';
export { PayrollConfigTable } from './PayrollConfigTable';
export { PayrollConfigForm } from './PayrollConfigForm';
export { ValidationDisplay } from './ValidationDisplay';

// ===== COMPONENTES DE GERENCIAMENTO =====
export { EmployeeManagement, EmployeeManagementPage } from './EmployeeManagement';
export { PositionManagement } from './PositionManagement';
export { TimeRecordManagement, TimeRecordManagementPage } from './TimeRecordManagement';
export { WorkShiftManagement } from './WorkShiftManagement';
// BenefitsManagement removido - substituído pelo sistema unificado
export { VacationsManagement } from './VacationsManagement';
export { MedicalCertificatesManagement } from './MedicalCertificatesManagement';
export { ESocialEventsManagement } from './ESocialEventsManagement';
export { RecruitmentManagement } from './RecruitmentManagement';
export { TrainingManagement } from './TrainingManagement';
export { UnionManagement } from './UnionManagement';
export { EmploymentContractManagement } from './EmploymentContractManagement';
export { EmployeeShiftManagement } from './EmployeeShiftManagement';
export { PayrollConfigManagement } from './PayrollConfigManagement';
export { TimeBankManagement } from './TimeBankManagement';
export { CompensationRequestManagement } from './CompensationRequestManagement';
export { PeriodicExamManagement } from './PeriodicExamManagement';

// ===== BENEFÍCIOS AVANÇADOS =====
export { ConveniosEmpresasManagement } from './ConveniosEmpresasManagement';
export { ConveniosEmpresasTable } from './ConveniosEmpresasTable';
export { ConveniosEmpresasForm } from './ConveniosEmpresasForm';
export { ConveniosPlanosManagement } from './ConveniosPlanosManagement';
export { ConveniosPlanosTable } from './ConveniosPlanosTable';
export { ConveniosPlanosForm } from './ConveniosPlanosForm';
export { FuncionarioConveniosManagement } from './FuncionarioConveniosManagement';
export { FuncionarioConveniosTable } from './FuncionarioConveniosTable';
export { FuncionarioConveniosForm } from './FuncionarioConveniosForm';
export { FuncionarioConvenioDependentesManagement } from './FuncionarioConvenioDependentesManagement';
export { FuncionarioConvenioDependentesTable } from './FuncionarioConvenioDependentesTable';
export { FuncionarioConvenioDependentesForm } from './FuncionarioConvenioDependentesForm';

// Sistema de Elegibilidade de Benefícios
export { ElegibilidadeManagement } from './ElegibilidadeManagement';
export { ElegibilidadeTable } from './ElegibilidadeTable';
export { ElegibilidadeForm } from './ElegibilidadeForm';
export { BeneficioTiposManagement } from './BeneficioTiposManagement';
export { BeneficioTiposTable } from './BeneficioTiposTable';
export { BeneficioTiposForm } from './BeneficioTiposForm';
export { FuncionariosElegiveisTable } from './FuncionariosElegiveisTable';

// Componentes de rateios de benefícios
export { RateiosManagement } from './RateiosManagement';
export { RateiosTable } from './RateiosTable';
export { RateioDepartamentosTable } from './RateioDepartamentosTable';
export { RateioForm } from './RateioForm';
// Componentes antigos de benefícios removidos - substituídos pelo sistema unificado
// VrVaManagement, VrVaTable, VrVaForm
// TransporteManagement, TransporteTable, TransporteForm  
// PremiacaoManagement, PremiacaoTable, PremiacaoForm, PremiacaoCalculator

// Sistema Unificado de Benefícios
export { UnifiedBenefitsManagement } from './UnifiedBenefitsManagement';
export { BenefitsConfigurationTab } from './BenefitsConfigurationTab';
export { BenefitsAssignmentsTab } from './BenefitsAssignmentsTab';
export { BenefitsProcessingTab } from './BenefitsProcessingTab';
export { BenefitsPaymentsTab } from './BenefitsPaymentsTab';
export { BenefitsStatisticsTab } from './BenefitsStatisticsTab';
export { BenefitConfigurationForm } from './BenefitConfigurationForm';
export { BenefitsRedirect } from './BenefitsRedirect';

// ===== CADASTROS AVANÇADOS =====
export { RubricasManagement } from './RubricasManagement';
export { RubricasTable } from './RubricasTable';
export { RubricasForm } from './RubricasForm';
export { UnitsManagement } from './UnitsManagement';
export { UnitsTable } from './UnitsTable';
export { UnitsForm } from './UnitsForm';

// PCD e Dependentes
export { DeficiencyTypesManagement } from './DeficiencyTypesManagement';
export { DeficiencyTypesTable } from './DeficiencyTypesTable';
export { DeficiencyTypesForm } from './DeficiencyTypesForm';

// Motivos de Atraso e CID
export { DelayReasonsManagement } from './DelayReasonsManagement';
export { DelayReasonsForm } from './DelayReasonsForm';
export { CidCodesManagement } from './CidCodesManagement';
export { CidCodesForm } from './CidCodesForm';

// Afastamentos e Adicionais
export { AbsenceTypesManagement } from './AbsenceTypesManagement';
export { AbsenceTypesForm } from './AbsenceTypesForm';
export { AllowanceTypesManagement } from './AllowanceTypesManagement';
export { AllowanceTypesForm } from './AllowanceTypesForm';

// Impostos
export { InssBracketsManagement } from './InssBracketsManagement';
export { InssBracketsForm } from './InssBracketsForm';
export { IrrfBracketsManagement } from './IrrfBracketsManagement';
export { IrrfBracketsForm } from './IrrfBracketsForm';
export { FgtsConfigManagement } from './FgtsConfigManagement';
export { FgtsConfigForm } from './FgtsConfigForm';

// ===== SISTEMA DE LOCAÇÃO DE EQUIPAMENTOS =====
// Componentes antigos de Equipment Rental removidos - substituídos pelo sistema unificado
// EquipmentRentalManagement, EquipmentRentalTable, EquipmentRentalForm, EquipmentRentalPayments

// ===== DASHBOARD PRINCIPAL =====
export { HRDashboard, HRDashboardPage } from './HRDashboard';

// ===== TIPOS EXPORTADOS =====
export type {
  Employee,
  EmployeeInsert,
  EmployeeUpdate,
  Position,
  PositionInsert,
  PositionUpdate,
  TimeRecord,
  TimeRecordInsert,
  TimeRecordUpdate,
  WorkSchedule,
  WorkScheduleInsert,
  WorkScheduleUpdate,
  Benefit,
  BenefitInsert,
  BenefitUpdate,
  Payroll,
  PayrollInsert,
  PayrollUpdate,
  Vacation,
  VacationInsert,
  VacationUpdate,
  MedicalCertificate,
  MedicalCertificateInsert,
  MedicalCertificateUpdate,
  ESocialEvent,
  ESocialEventInsert,
  ESocialEventUpdate,
  Recruitment,
  RecruitmentInsert,
  RecruitmentUpdate,
  Training,
  TrainingInsert,
  TrainingUpdate
} from '@/integrations/supabase/rh-types-export';
