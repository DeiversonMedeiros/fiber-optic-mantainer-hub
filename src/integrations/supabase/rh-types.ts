// Tipos para o módulo de Recursos Humanos (RH)

// =====================================================
// TIPOS PARA BENEFÍCIOS AVANÇADOS
// =====================================================

// Departamentos (esquema core)
export type Department = RhDatabase['core']['Tables']['departments']['Row'];
export type DepartmentInsert = RhDatabase['core']['Tables']['departments']['Insert'];
export type DepartmentUpdate = RhDatabase['core']['Tables']['departments']['Update'];

// Convênios Médicos e Odontológicos - Estrutura Atualizada
export type ConvenioEmpresa = RhDatabase['rh']['Tables']['convenios_empresas']['Row'];
export type ConvenioEmpresaInsert = RhDatabase['rh']['Tables']['convenios_empresas']['Insert'];
export type ConvenioEmpresaUpdate = RhDatabase['rh']['Tables']['convenios_empresas']['Update'];

export type ConvenioPlano = RhDatabase['rh']['Tables']['convenios_planos']['Row'];
export type ConvenioPlanoInsert = RhDatabase['rh']['Tables']['convenios_planos']['Insert'];
export type ConvenioPlanoUpdate = RhDatabase['rh']['Tables']['convenios_planos']['Update'];

export type FuncionarioConvenio = RhDatabase['rh']['Tables']['funcionario_convenios']['Row'];
export type FuncionarioConvenioInsert = RhDatabase['rh']['Tables']['funcionario_convenios']['Insert'];
export type FuncionarioConvenioUpdate = RhDatabase['rh']['Tables']['funcionario_convenios']['Update'];

export type FuncionarioConvenioDependente = RhDatabase['rh']['Tables']['funcionario_convenio_dependentes']['Row'];
export type FuncionarioConvenioDependenteInsert = RhDatabase['rh']['Tables']['funcionario_convenio_dependentes']['Insert'];
export type FuncionarioConvenioDependenteUpdate = RhDatabase['rh']['Tables']['funcionario_convenio_dependentes']['Update'];

// Dependentes (usando tabelas existentes)
export type EmployeeDependent = RhDatabase['rh']['Tables']['employee_dependents']['Row'];
export type EmployeeDependentInsert = RhDatabase['rh']['Tables']['employee_dependents']['Insert'];
export type EmployeeDependentUpdate = RhDatabase['rh']['Tables']['employee_dependents']['Update'];

export type DependentType = RhDatabase['rh']['Tables']['dependent_types']['Row'];
export type DependentTypeInsert = RhDatabase['rh']['Tables']['dependent_types']['Insert'];
export type DependentTypeUpdate = RhDatabase['rh']['Tables']['dependent_types']['Update'];

export type KinshipDegree = RhDatabase['rh']['Tables']['kinship_degrees']['Row'];
export type KinshipDegreeInsert = RhDatabase['rh']['Tables']['kinship_degrees']['Insert'];
export type KinshipDegreeUpdate = RhDatabase['rh']['Tables']['kinship_degrees']['Update'];

// Sistema de Elegibilidade de Benefícios
export type BeneficioTipo = RhDatabase['rh']['Tables']['beneficio_tipos']['Row'];
export type BeneficioTipoInsert = RhDatabase['rh']['Tables']['beneficio_tipos']['Insert'];
export type BeneficioTipoUpdate = RhDatabase['rh']['Tables']['beneficio_tipos']['Update'];

export type BeneficioElegibilidade = RhDatabase['rh']['Tables']['beneficio_elegibilidade']['Row'];
export type BeneficioElegibilidadeInsert = RhDatabase['rh']['Tables']['beneficio_elegibilidade']['Insert'];
export type BeneficioElegibilidadeUpdate = RhDatabase['rh']['Tables']['beneficio_elegibilidade']['Update'];

export type BeneficioElegibilidadeCargo = RhDatabase['rh']['Tables']['beneficio_elegibilidade_cargos']['Row'];
export type BeneficioElegibilidadeCargoInsert = RhDatabase['rh']['Tables']['beneficio_elegibilidade_cargos']['Insert'];
export type BeneficioElegibilidadeCargoUpdate = RhDatabase['rh']['Tables']['beneficio_elegibilidade_cargos']['Update'];

export type BeneficioElegibilidadeDepartamento = RhDatabase['rh']['Tables']['beneficio_elegibilidade_departamentos']['Row'];
export type BeneficioElegibilidadeDepartamentoInsert = RhDatabase['rh']['Tables']['beneficio_elegibilidade_departamentos']['Insert'];
export type BeneficioElegibilidadeDepartamentoUpdate = RhDatabase['rh']['Tables']['beneficio_elegibilidade_departamentos']['Update'];

export type FuncionarioElegibilidade = RhDatabase['rh']['Tables']['funcionario_elegibilidade']['Row'];
export type FuncionarioElegibilidadeInsert = RhDatabase['rh']['Tables']['funcionario_elegibilidade']['Insert'];
export type FuncionarioElegibilidadeUpdate = RhDatabase['rh']['Tables']['funcionario_elegibilidade']['Update'];

// Sistema de Rateios de Benefícios
export type BeneficioRateio = RhDatabase['rh']['Tables']['beneficio_rateios']['Row'];
export type BeneficioRateioInsert = RhDatabase['rh']['Tables']['beneficio_rateios']['Insert'];
export type BeneficioRateioUpdate = RhDatabase['rh']['Tables']['beneficio_rateios']['Update'];

export type BeneficioRateioDepartamento = RhDatabase['rh']['Tables']['beneficio_rateio_departamentos']['Row'];
export type BeneficioRateioDepartamentoInsert = RhDatabase['rh']['Tables']['beneficio_rateio_departamentos']['Insert'];
export type BeneficioRateioDepartamentoUpdate = RhDatabase['rh']['Tables']['beneficio_rateio_departamentos']['Update'];

export type BeneficioRateioHistorico = RhDatabase['rh']['Tables']['beneficio_rateio_historico']['Row'];
export type BeneficioRateioHistoricoInsert = RhDatabase['rh']['Tables']['beneficio_rateio_historico']['Insert'];
export type BeneficioRateioHistoricoUpdate = RhDatabase['rh']['Tables']['beneficio_rateio_historico']['Update'];

// VR/VA (Vale Refeição/Vale Alimentação)
export type VrVaConfig = RhDatabase['rh']['Tables']['vr_va_configs']['Row'];
export type VrVaConfigInsert = RhDatabase['rh']['Tables']['vr_va_configs']['Insert'];
export type VrVaConfigUpdate = RhDatabase['rh']['Tables']['vr_va_configs']['Update'];

// Configurações de Transporte
export type TransporteConfig = RhDatabase['rh']['Tables']['transporte_configs']['Row'];
export type TransporteConfigInsert = RhDatabase['rh']['Tables']['transporte_configs']['Insert'];
export type TransporteConfigUpdate = RhDatabase['rh']['Tables']['transporte_configs']['Update'];

// Elegibilidade de Benefícios
export type BeneficioElegibilidade = RhDatabase['rh']['Tables']['beneficios_elegibilidade']['Row'];
export type BeneficioElegibilidadeInsert = RhDatabase['rh']['Tables']['beneficios_elegibilidade']['Insert'];
export type BeneficioElegibilidadeUpdate = RhDatabase['rh']['Tables']['beneficios_elegibilidade']['Update'];

// Rateios de Benefícios
export type BeneficioRateio = RhDatabase['rh']['Tables']['beneficios_rateios']['Row'];
export type BeneficioRateioInsert = RhDatabase['rh']['Tables']['beneficios_rateios']['Insert'];
export type BeneficioRateioUpdate = RhDatabase['rh']['Tables']['beneficios_rateios']['Update'];

// Descontos por Afastamento
export type BeneficioDescontoAfastamento = RhDatabase['rh']['Tables']['beneficios_descontos_afastamento']['Row'];
export type BeneficioDescontoAfastamentoInsert = RhDatabase['rh']['Tables']['beneficios_descontos_afastamento']['Insert'];
export type BeneficioDescontoAfastamentoUpdate = RhDatabase['rh']['Tables']['beneficios_descontos_afastamento']['Update'];

// Histórico de Benefícios por Funcionário
export type FuncionarioBeneficioHistorico = RhDatabase['rh']['Tables']['funcionario_beneficios_historico']['Row'];
export type FuncionarioBeneficioHistoricoInsert = RhDatabase['rh']['Tables']['funcionario_beneficios_historico']['Insert'];
export type FuncionarioBeneficioHistoricoUpdate = RhDatabase['rh']['Tables']['funcionario_beneficios_historico']['Update'];

// =====================================================
// TIPOS EXISTENTES
// =====================================================

// Tipos específicos para as novas tabelas
export type ESocialCategory = RhDatabase['rh']['Tables']['esocial_categories']['Row'];
export type ESocialCategoryInsert = RhDatabase['rh']['Tables']['esocial_categories']['Insert'];
export type ESocialCategoryUpdate = RhDatabase['rh']['Tables']['esocial_categories']['Update'];

export type ESocialLeaveType = RhDatabase['rh']['Tables']['esocial_leave_types']['Row'];
export type ESocialLeaveTypeInsert = RhDatabase['rh']['Tables']['esocial_leave_types']['Insert'];
export type ESocialLeaveTypeUpdate = RhDatabase['rh']['Tables']['esocial_leave_types']['Update'];

export type ESocialNaturezaRubrica = RhDatabase['rh']['Tables']['esocial_naturezas_rubricas']['Row'];
export type ESocialNaturezaRubricaInsert = RhDatabase['rh']['Tables']['esocial_naturezas_rubricas']['Insert'];
export type ESocialNaturezaRubricaUpdate = RhDatabase['rh']['Tables']['esocial_naturezas_rubricas']['Update'];

export type ESocialBenefitType = RhDatabase['rh']['Tables']['esocial_benefit_types']['Row'];
export type ESocialBenefitTypeInsert = RhDatabase['rh']['Tables']['esocial_benefit_types']['Insert'];
export type ESocialBenefitTypeUpdate = RhDatabase['rh']['Tables']['esocial_benefit_types']['Update'];

export type Rubrica = RhDatabase['rh']['Tables']['rubricas']['Row'];
export type RubricaInsert = RhDatabase['rh']['Tables']['rubricas']['Insert'];
export type RubricaUpdate = RhDatabase['rh']['Tables']['rubricas']['Update'];

export type Unit = RhDatabase['rh']['Tables']['units']['Row'];
export type UnitInsert = RhDatabase['rh']['Tables']['units']['Insert'];
export type UnitUpdate = RhDatabase['rh']['Tables']['units']['Update'];

// PCD e Dependentes
export type DeficiencyType = RhDatabase['rh']['Tables']['deficiency_types']['Row'];
export type DeficiencyTypeInsert = RhDatabase['rh']['Tables']['deficiency_types']['Insert'];
export type DeficiencyTypeUpdate = RhDatabase['rh']['Tables']['deficiency_types']['Update'];

export type DeficiencyDegree = RhDatabase['rh']['Tables']['deficiency_degrees']['Row'];
export type DeficiencyDegreeInsert = RhDatabase['rh']['Tables']['deficiency_degrees']['Insert'];
export type DeficiencyDegreeUpdate = RhDatabase['rh']['Tables']['deficiency_degrees']['Update'];

export type DependentType = RhDatabase['rh']['Tables']['dependent_types']['Row'];
export type DependentTypeInsert = RhDatabase['rh']['Tables']['dependent_types']['Insert'];
export type DependentTypeUpdate = RhDatabase['rh']['Tables']['dependent_types']['Update'];

export type KinshipDegree = RhDatabase['rh']['Tables']['kinship_degrees']['Row'];
export type KinshipDegreeInsert = RhDatabase['rh']['Tables']['kinship_degrees']['Insert'];
export type KinshipDegreeUpdate = RhDatabase['rh']['Tables']['kinship_degrees']['Update'];

export type EmployeePcdInfo = RhDatabase['rh']['Tables']['employee_pcd_info']['Row'];
export type EmployeePcdInfoInsert = RhDatabase['rh']['Tables']['employee_pcd_info']['Insert'];
export type EmployeePcdInfoUpdate = RhDatabase['rh']['Tables']['employee_pcd_info']['Update'];

export type EmployeeDependent = RhDatabase['rh']['Tables']['employee_dependents']['Row'];
export type EmployeeDependentInsert = RhDatabase['rh']['Tables']['employee_dependents']['Insert'];
export type EmployeeDependentUpdate = RhDatabase['rh']['Tables']['employee_dependents']['Update'];

export type RhDatabase = {
  rh: {
    Tables: {
      // ===== CADASTROS AVANÇADOS =====
      // Catálogos eSocial
      esocial_categories: {
        Row: {
          id: string
          company_id: string | null
          codigo: string
          descricao: string
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          codigo: string
          descricao: string
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          codigo?: string
          descricao?: string
          is_active?: boolean | null
          created_at?: string
        }
      }
      esocial_leave_types: {
        Row: {
          id: string
          company_id: string | null
          codigo: string
          descricao: string
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          codigo: string
          descricao: string
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          codigo?: string
          descricao?: string
          is_active?: boolean | null
          created_at?: string
        }
      }
      esocial_naturezas_rubricas: {
        Row: {
          id: string
          company_id: string | null
          codigo: string
          descricao: string
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          codigo: string
          descricao: string
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          codigo?: string
          descricao?: string
          is_active?: boolean | null
          created_at?: string
        }
      }
      esocial_benefit_types: {
        Row: {
          id: string
          company_id: string | null
          codigo: string
          descricao: string
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          codigo: string
          descricao: string
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          codigo?: string
          descricao?: string
          is_active?: boolean | null
          created_at?: string
        }
      }
      // Rubricas
      rubricas: {
        Row: {
          id: string
          company_id: string
          codigo: string
          descricao: string
          natureza_esocial_id: string | null
          tipo: 'provento' | 'desconto'
          incidencias: any
          referencia: string | null
          unidade: string | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          codigo: string
          descricao: string
          natureza_esocial_id?: string | null
          tipo: 'provento' | 'desconto'
          incidencias?: any
          referencia?: string | null
          unidade?: string | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          codigo?: string
          descricao?: string
          natureza_esocial_id?: string | null
          tipo?: 'provento' | 'desconto'
          incidencias?: any
          referencia?: string | null
          unidade?: string | null
          is_active?: boolean | null
          created_at?: string
        }
      }
      // Unidades organizacionais
      units: {
        Row: {
          id: string
          company_id: string
          codigo: string
          nome: string
          descricao: string | null
          parent_id: string | null
          nivel_hierarquico: number | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          codigo: string
          nome: string
          descricao?: string | null
          parent_id?: string | null
          nivel_hierarquico?: number | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          codigo?: string
          nome?: string
          descricao?: string | null
          parent_id?: string | null
          nivel_hierarquico?: number | null
          is_active?: boolean | null
          created_at?: string
        }
      }
      
      // PCD e Dependentes
      deficiency_types: {
        Row: {
          id: string
          company_id: string | null
          codigo: string
          descricao: string
          is_active: boolean | null
          created_at: string
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          company_id?: string | null
          codigo: string
          descricao: string
          is_active?: boolean | null
          created_at?: string
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          company_id?: string | null
          codigo?: string
          descricao?: string
          is_active?: boolean | null
          created_at?: string
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
      }
      
      deficiency_degrees: {
        Row: {
          id: string
          company_id: string | null
          codigo: string
          descricao: string
          is_active: boolean | null
          created_at: string
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          company_id?: string | null
          codigo: string
          descricao: string
          is_active?: boolean | null
          created_at?: string
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          company_id?: string | null
          codigo?: string
          descricao?: string
          is_active?: boolean | null
          created_at?: string
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
      }
      
      dependent_types: {
        Row: {
          id: string
          company_id: string | null
          codigo: string
          descricao: string
          is_active: boolean | null
          created_at: string
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          company_id?: string | null
          codigo: string
          descricao: string
          is_active?: boolean | null
          created_at?: string
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          company_id?: string | null
          codigo?: string
          descricao?: string
          is_active?: boolean | null
          created_at?: string
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
      }
      
      kinship_degrees: {
        Row: {
          id: string
          company_id: string | null
          codigo: string
          descricao: string
          is_active: boolean | null
          created_at: string
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          company_id?: string | null
          codigo: string
          descricao: string
          is_active?: boolean | null
          created_at?: string
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          company_id?: string | null
          codigo?: string
          descricao?: string
          is_active?: boolean | null
          created_at?: string
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
      }
      
      employee_pcd_info: {
        Row: {
          id: string
          employee_id: string
          is_pcd: boolean | null
          deficiency_type_id: string | null
          deficiency_degree_id: string | null
          cid_code: string | null
          cid_description: string | null
          needs_accommodation: boolean | null
          accommodation_description: string | null
          medical_certificate_url: string | null
          certificate_validity: string | null
          is_active: boolean | null
          company_id: string | null
          created_at: string
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          is_pcd?: boolean | null
          deficiency_type_id?: string | null
          deficiency_degree_id?: string | null
          cid_code?: string | null
          cid_description?: string | null
          needs_accommodation?: boolean | null
          accommodation_description?: string | null
          medical_certificate_url?: string | null
          certificate_validity?: string | null
          is_active?: boolean | null
          company_id?: string | null
          created_at?: string
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          is_pcd?: boolean | null
          deficiency_type_id?: string | null
          deficiency_degree_id?: string | null
          cid_code?: string | null
          cid_description?: string | null
          needs_accommodation?: boolean | null
          accommodation_description?: string | null
          medical_certificate_url?: string | null
          certificate_validity?: string | null
          is_active?: boolean | null
          company_id?: string | null
          created_at?: string
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
      }
      
      employee_dependents: {
        Row: {
          id: string
          employee_id: string
          name: string
          cpf: string
          birth_date: string
          dependent_type_id: string
          kinship_degree_id: string
          is_pcd: boolean | null
          deficiency_type_id: string | null
          deficiency_degree_id: string | null
          cid_code: string | null
          cid_description: string | null
          needs_special_care: boolean | null
          special_care_description: string | null
          is_ir_dependent: boolean | null
          is_health_plan_dependent: boolean | null
          is_school_allowance_dependent: boolean | null
          is_active: boolean | null
          company_id: string | null
          created_at: string
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          name: string
          cpf: string
          birth_date: string
          dependent_type_id: string
          kinship_degree_id: string
          is_pcd?: boolean | null
          deficiency_type_id?: string | null
          deficiency_degree_id?: string | null
          cid_code?: string | null
          cid_description?: string | null
          needs_special_care?: boolean | null
          special_care_description?: string | null
          is_ir_dependent?: boolean | null
          is_health_plan_dependent?: boolean | null
          is_school_allowance_dependent?: boolean | null
          is_active?: boolean | null
          company_id?: string | null
          created_at?: string
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          name?: string
          cpf?: string
          birth_date?: string
          dependent_type_id?: string
          kinship_degree_id?: string
          is_pcd?: boolean | null
          deficiency_type_id?: string | null
          deficiency_degree_id?: string | null
          cid_code?: string | null
          cid_description?: string | null
          needs_special_care?: boolean | null
          special_care_description?: string | null
          is_ir_dependent?: boolean | null
          is_health_plan_dependent?: boolean | null
          is_school_allowance_dependent?: boolean | null
          is_active?: boolean | null
          company_id?: string | null
          created_at?: string
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
      }
      
      // ===== GESTÃO DE FUNCIONÁRIOS =====
      employees: {
        Row: {
          id: string
          company_id: string | null
          matricula: string | null
          nome: string
          cpf: string | null
          rg: string | null
          data_nascimento: string | null
          data_admissao: string | null
          data_demissao: string | null
          status: 'ativo' | 'inativo' | 'demitido' | 'aposentado' | 'licenca' | null
          cost_center_id: string | null
          project_id: string | null
          // Novos campos adicionados
          position_id: string | null
          work_schedule_id: string | null
          department_id: string | null
          manager_id: string | null
          salario_base: number | null
          telefone: string | null
          email: string | null
          estado_civil: string | null
          nacionalidade: string | null
          naturalidade: string | null
          nome_mae: string | null
          nome_pai: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          matricula?: string | null
          nome: string
          cpf?: string | null
          rg?: string | null
          data_nascimento?: string | null
          data_admissao?: string | null
          data_demissao?: string | null
          status?: 'ativo' | 'inativo' | 'demitido' | 'aposentado' | 'licenca' | null
          cost_center_id?: string | null
          project_id?: string | null
          // Novos campos adicionados
          position_id?: string | null
          work_schedule_id?: string | null
          department_id?: string | null
          manager_id?: string | null
          salario_base?: number | null
          telefone?: string | null
          email?: string | null
          estado_civil?: string | null
          nacionalidade?: string | null
          naturalidade?: string | null
          nome_mae?: string | null
          nome_pai?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          matricula?: string | null
          nome?: string
          cpf?: string | null
          rg?: string | null
          data_nascimento?: string | null
          data_admissao?: string | null
          data_demissao?: string | null
          status?: 'ativo' | 'inativo' | 'demitido' | 'aposentado' | 'licenca' | null
          cost_center_id?: string | null
          project_id?: string | null
          // Novos campos adicionados
          position_id?: string | null
          work_schedule_id?: string | null
          department_id?: string | null
          manager_id?: string | null
          salario_base?: number | null
          telefone?: string | null
          email?: string | null
          estado_civil?: string | null
          nacionalidade?: string | null
          naturalidade?: string | null
          nome_mae?: string | null
          nome_pai?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "core.cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "core.projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "rh.positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_work_schedule_id_fkey"
            columns: ["work_schedule_id"]
            isOneToOne: false
            referencedRelation: "rh.work_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "core.departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "rh.employees"
            referencedColumns: ["id"]
          }
        ]
      }

      positions: {
        Row: {
          id: string
          company_id: string | null
          codigo: string
          nome: string
          descricao: string | null
          nivel_hierarquico: number | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          codigo: string
          nome: string
          descricao?: string | null
          nivel_hierarquico?: number | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          codigo?: string
          nome?: string
          descricao?: string | null
          nivel_hierarquico?: number | null
          is_active?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          }
        ]
      }

      employment_contracts: {
        Row: {
          id: string
          company_id: string | null
          employee_id: string | null
          position_id: string | null
          work_schedule_id: string | null
          tipo_contrato: 'clt' | 'pj' | 'estagiario' | 'temporario' | 'terceirizado'
          data_inicio: string | null
          data_fim: string | null
          salario_base: number | null
          sindicato_id: string | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          employee_id?: string | null
          position_id?: string | null
          work_schedule_id?: string | null
          tipo_contrato: 'clt' | 'pj' | 'estagiario' | 'temporario' | 'terceirizado'
          data_inicio?: string | null
          data_fim?: string | null
          salario_base?: number | null
          sindicato_id?: string | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          employee_id?: string | null
          position_id?: string | null
          work_schedule_id?: string | null
          tipo_contrato?: 'clt' | 'pj' | 'estagiario' | 'temporario' | 'terceirizado'
          data_inicio?: string | null
          data_fim?: string | null
          salario_base?: number | null
          sindicato_id?: string | null
          is_active?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employment_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employment_contracts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rh.employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employment_contracts_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "rh.positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employment_contracts_work_schedule_id_fkey"
            columns: ["work_schedule_id"]
            isOneToOne: false
            referencedRelation: "rh.work_schedules"
            referencedColumns: ["id"]
          }
        ]
      }

      // ===== GESTÃO DE TEMPO E PONTO =====
      time_records: {
        Row: {
          id: string
          company_id: string | null
          employee_id: string | null
          data: string
          hora_entrada: string | null
          hora_saida: string | null
          intervalo_inicio: string | null
          intervalo_fim: string | null
          tipo: string | null
          justificativa: string | null
          aprovado_por: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          employee_id?: string | null
          data: string
          hora_entrada?: string | null
          hora_saida?: string | null
          intervalo_inicio?: string | null
          intervalo_fim?: string | null
          tipo?: string | null
          justificativa?: string | null
          aprovado_por?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          employee_id?: string | null
          data?: string
          hora_entrada?: string | null
          hora_saida?: string | null
          intervalo_inicio?: string | null
          intervalo_fim?: string | null
          tipo?: string | null
          justificativa?: string | null
          aprovado_por?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rh.employees"
            referencedColumns: ["id"]
          }
        ]
      }

      work_schedules: {
        Row: {
          id: string
          company_id: string | null
          nome: string
          hora_entrada: string | null
          hora_saida: string | null
          intervalo_inicio: string | null
          intervalo_fim: string | null
          dias_semana: number[] | null
          carga_horaria_semanal: number | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          nome: string
          hora_entrada?: string | null
          hora_saida?: string | null
          intervalo_inicio?: string | null
          intervalo_fim?: string | null
          dias_semana?: number[] | null
          carga_horaria_semanal?: number | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          nome?: string
          hora_entrada?: string | null
          hora_saida?: string | null
          intervalo_inicio?: string | null
          intervalo_fim?: string | null
          dias_semana?: number[] | null
          carga_horaria_semanal?: number | null
          is_active?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_schedules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          }
        ]
      }

      work_shifts: {
        Row: {
          id: string
          company_id: string | null
          nome: string
          hora_inicio: string
          hora_fim: string
          dias_semana: number[] | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          nome: string
          hora_inicio: string
          hora_fim: string
          dias_semana?: number[] | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          nome?: string
          hora_inicio?: string
          hora_fim?: string
          dias_semana?: number[] | null
          is_active?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_shifts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          }
        ]
      }

      employee_shifts: {
        Row: {
          id: string
          company_id: string | null
          employee_id: string | null
          shift_id: string | null
          data_inicio: string
          data_fim: string | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          employee_id?: string | null
          shift_id?: string | null
          data_inicio: string
          data_fim?: string | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          employee_id?: string | null
          shift_id?: string | null
          data_inicio?: string
          data_fim?: string | null
          is_active?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_shifts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rh.employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_shifts_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "rh.work_shifts"
            referencedColumns: ["id"]
          }
        ]
      }

      time_bank: {
        Row: {
          id: string
          company_id: string | null
          employee_id: string | null
          tipo: string
          quantidade: number
          data_registro: string
          justificativa: string | null
          aprovado_por: string | null
          status: 'pendente' | 'aprovado' | 'rejeitado' | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          employee_id?: string | null
          tipo: string
          quantidade: number
          data_registro: string
          justificativa?: string | null
          aprovado_por?: string | null
          status?: 'pendente' | 'aprovado' | 'rejeitado' | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          employee_id?: string | null
          tipo?: string
          quantidade?: number
          data_registro?: string
          justificativa?: string | null
          aprovado_por?: string | null
          status?: 'pendente' | 'aprovado' | 'rejeitado' | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_bank_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_bank_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rh.employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_bank_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "rh.employees"
            referencedColumns: ["id"]
          }
        ]
      }

      compensation_requests: {
        Row: {
          id: string
          company_id: string | null
          employee_id: string | null
          data_solicitacao: string
          data_compensacao: string
          quantidade_horas: number
          justificativa: string | null
          aprovado_por: string | null
          status: 'pendente' | 'aprovado' | 'rejeitado' | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          employee_id?: string | null
          data_solicitacao: string
          data_compensacao: string
          quantidade_horas: number
          justificativa?: string | null
          aprovado_por?: string | null
          status?: 'pendente' | 'aprovado' | 'rejeitado' | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          employee_id?: string | null
          data_solicitacao?: string
          data_compensacao?: string
          quantidade_horas?: number
          justificativa?: string | null
          aprovado_por?: string | null
          status?: 'pendente' | 'aprovado' | 'rejeitado' | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compensation_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compensation_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rh.employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compensation_requests_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "rh.employees"
            referencedColumns: ["id"]
          }
        ]
      }

      // ===== BENEFÍCIOS E REMUNERAÇÃO =====
      benefits: {
        Row: {
          id: string
          company_id: string | null
          nome: string
          tipo: 'valor_fixo' | 'percentual' | 'flexivel'
          valor: number | null
          percentual: number | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          nome: string
          tipo: 'valor_fixo' | 'percentual' | 'flexivel'
          valor?: number | null
          percentual?: number | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          nome?: string
          tipo?: 'valor_fixo' | 'percentual' | 'flexivel'
          valor?: number | null
          percentual?: number | null
          is_active?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          }
        ]
      }

      employee_benefits: {
        Row: {
          id: string
          company_id: string | null
          employee_id: string | null
          benefit_id: string | null
          salario_base: number | null
          valor_beneficio: number | null
          data_inicio: string | null
          data_fim: string | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          employee_id?: string | null
          benefit_id?: string | null
          salario_base?: number | null
          valor_beneficio?: number | null
          data_inicio?: string | null
          data_fim?: string | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          employee_id?: string | null
          benefit_id?: string | null
          salario_base?: number | null
          valor_beneficio?: number | null
          data_inicio?: string | null
          data_fim?: string | null
          is_active?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_benefits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_benefits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rh.employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_benefits_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "rh.benefits"
            referencedColumns: ["id"]
          }
        ]
      }

      payroll: {
        Row: {
          id: string
          company_id: string | null
          competencia: string
          data_processamento: string | null
          status: 'processando' | 'processado' | 'erro' | 'cancelado' | null
          total_proventos: number | null
          total_descontos: number | null
          total_liquido: number | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          competencia: string
          data_processamento?: string | null
          status?: 'processando' | 'processado' | 'erro' | 'cancelado' | null
          total_proventos?: number | null
          total_descontos?: number | null
          total_liquido?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          competencia?: string
          data_processamento?: string | null
          status?: 'processando' | 'processado' | 'erro' | 'cancelado' | null
          total_proventos?: number | null
          total_descontos?: number | null
          total_liquido?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          }
        ]
      }

      payroll_items: {
        Row: {
          id: string
          company_id: string | null
          payroll_id: string | null
          employee_id: string | null
          tipo: string
          codigo: string
          descricao: string
          valor: number | null
          base_calculo: number | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          payroll_id?: string | null
          employee_id?: string | null
          tipo: string
          codigo: string
          descricao: string
          valor?: number | null
          base_calculo?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          payroll_id?: string | null
          employee_id?: string | null
          tipo?: string
          codigo?: string
          descricao?: string
          valor?: number | null
          base_calculo?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_items_payroll_id_fkey"
            columns: ["payroll_id"]
            isOneToOne: false
            referencedRelation: "rh.payroll"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_items_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rh.employees"
            referencedColumns: ["id"]
          }
        ]
      }

      payroll_config: {
        Row: {
          id: string
          company_id: string | null
          employee_id: string | null
          regime_hora_extra: string | null
          vigencia_banco_horas: number | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          employee_id?: string | null
          regime_hora_extra?: string | null
          vigencia_banco_horas?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          employee_id?: string | null
          regime_hora_extra?: string | null
          vigencia_banco_horas?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_config_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_config_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rh.employees"
            referencedColumns: ["id"]
          }
        ]
      }

      // ===== GESTÃO DE AUSÊNCIAS E LICENÇAS =====
      vacations: {
        Row: {
          id: string
          company_id: string | null
          employee_id: string | null
          ano: number
          periodo: string
          data_inicio: string | null
          data_fim: string | null
          dias_ferias: number | null
          dias_abono: number | null
          status: 'solicitado' | 'aprovado' | 'rejeitado' | 'em_andamento' | 'concluido' | null
          aprovado_por: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          employee_id?: string | null
          ano: number
          periodo: string
          data_inicio?: string | null
          data_fim?: string | null
          dias_ferias?: number | null
          dias_abono?: number | null
          status?: 'solicitado' | 'aprovado' | 'rejeitado' | 'em_andamento' | 'concluido' | null
          aprovado_por?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          employee_id?: string | null
          ano?: number
          periodo?: string
          data_inicio?: string | null
          data_fim?: string | null
          dias_ferias?: number | null
          dias_abono?: number | null
          status?: 'solicitado' | 'aprovado' | 'rejeitado' | 'em_andamento' | 'concluido' | null
          aprovado_por?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rh.employees"
            referencedColumns: ["id"]
          }
        ]
      }

      medical_certificates: {
        Row: {
          id: string
          company_id: string | null
          employee_id: string | null
          data_inicio: string | null
          data_fim: string | null
          dias_afastamento: number | null
          cid: string | null
          tipo: string | null
          arquivo_anexo: string | null
          aprovado_por: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          employee_id?: string | null
          data_inicio?: string | null
          data_fim?: string | null
          dias_afastamento?: number | null
          cid?: string | null
          tipo?: string | null
          arquivo_anexo?: string | null
          aprovado_por?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          employee_id?: string | null
          data_inicio?: string | null
          data_fim?: string | null
          dias_afastamento?: number | null
          cid?: string | null
          tipo?: string | null
          arquivo_anexo?: string | null
          aprovado_por?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_certificates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_certificates_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rh.employees"
            referencedColumns: ["id"]
          }
        ]
      }

      // ===== SAÚDE E SEGURANÇA =====
      periodic_exams: {
        Row: {
          id: string
          company_id: string | null
          employee_id: string | null
          tipo_exame: string
          data_agendada: string
          data_realizacao: string | null
          resultado: string | null
          arquivo_anexo: string | null
          status: 'agendado' | 'realizado' | 'cancelado' | 'pendente' | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          employee_id?: string | null
          tipo_exame: string
          data_agendada: string
          data_realizacao?: string | null
          resultado?: string | null
          arquivo_anexo?: string | null
          status?: 'agendado' | 'realizado' | 'cancelado' | 'pendente' | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          employee_id?: string | null
          tipo_exame?: string
          data_realizacao?: string | null
          resultado?: string | null
          arquivo_anexo?: string | null
          status?: 'agendado' | 'realizado' | 'cancelado' | 'pendente' | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "periodic_exams_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periodic_exams_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rh.employees"
            referencedColumns: ["id"]
          }
        ]
      }

      // ===== COMPLIANCE E RELATÓRIOS =====
      esocial_events: {
        Row: {
          id: string
          company_id: string | null
          tipo_evento: string
          numero_recibo: string | null
          xml_evento: string | null
          status: 'pendente' | 'enviado' | 'processado' | 'erro' | null
          data_envio: string | null
          data_retorno: string | null
          retorno_xml: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          tipo_evento: string
          numero_recibo?: string | null
          xml_evento?: string | null
          status?: 'pendente' | 'enviado' | 'processado' | 'erro' | null
          data_envio?: string | null
          data_retorno?: string | null
          retorno_xml?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          tipo_evento?: string
          numero_recibo?: string | null
          xml_evento?: string | null
          status?: 'pendente' | 'enviado' | 'processado' | 'erro' | null
          data_envio?: string | null
          data_retorno?: string | null
          retorno_xml?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "esocial_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          }
        ]
      }

      unions: {
        Row: {
          id: string
          company_id: string | null
          nome: string
          cnpj: string | null
          endereco: string | null
          contato: string | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          nome: string
          cnpj?: string | null
          endereco?: string | null
          contato?: string | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          nome?: string
          cnpj?: string | null
          endereco?: string | null
          contato?: string | null
          is_active?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          }
        ]
      }

            // ===== TABELAS DE BENEFÍCIOS E CONVÊNIOS =====
      funcionario_beneficios_historico: {
        Row: {
          id: string
          employee_id: string
          benefit_id: string
          convenio_id: string | null
          vr_va_config_id: string | null
          transporte_config_id: string | null
          valor_beneficio: number
          valor_desconto: number | null
          valor_final: number
          motivo_desconto: string | null
          mes_referencia: number
          ano_referencia: number
          status: 'ativo' | 'suspenso' | 'cancelado'
          data_inicio: string
          data_fim: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          benefit_id: string
          convenio_id?: string | null
          vr_va_config_id?: string | null
          transporte_config_id?: string | null
          valor_beneficio?: number
          valor_desconto?: number | null
          valor_final?: number
          motivo_desconto?: string | null
          mes_referencia: number
          ano_referencia: number
          status?: 'ativo' | 'suspenso' | 'cancelado'
          data_inicio: string
          data_fim?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          benefit_id?: string
          convenio_id?: string | null
          vr_va_config_id?: string | null
          transporte_config_id?: string | null
          valor_beneficio?: number
          valor_desconto?: number | null
          valor_final?: number
          motivo_desconto?: string | null
          mes_referencia?: number
          ano_referencia?: number
          status?: 'ativo' | 'suspenso' | 'cancelado'
          data_inicio?: string
          data_fim?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionario_beneficios_historico_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rh.employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionario_beneficios_historico_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "rh.benefits"
            referencedColumns: ["id"]
          }
        ]
      }

      funcionario_convenios: {
        Row: {
          id: string
          employee_id: string
          convenio_plano_id: string
          data_inicio: string
          data_fim: string | null
          valor_titular: number
          valor_dependentes: number
          valor_total: number
          status: 'ativo' | 'suspenso' | 'cancelado'
          observacoes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          convenio_plano_id: string
          data_inicio: string
          data_fim?: string | null
          valor_titular?: number
          valor_dependentes?: number
          valor_total?: number
          status?: 'ativo' | 'suspenso' | 'cancelado'
          observacoes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          convenio_plano_id?: string
          data_inicio?: string
          data_fim?: string | null
          valor_titular?: number
          valor_dependentes?: number
          valor_total?: number
          status?: 'ativo' | 'suspenso' | 'cancelado'
          observacoes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionario_convenios_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rh.employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionario_convenios_convenio_plano_id_fkey"
            columns: ["convenio_plano_id"]
            isOneToOne: false
            referencedRelation: "rh.convenios_planos"
            referencedColumns: ["id"]
          }
        ]
      }

      funcionario_convenio_dependentes: {
        Row: {
          id: string
          funcionario_convenio_id: string
          employee_dependent_id: string
          valor_dependente: number
          is_ativo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          funcionario_convenio_id: string
          employee_dependent_id: string
          valor_dependente?: number
          is_ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          funcionario_convenio_id?: string
          employee_dependent_id?: string
          valor_dependente?: number
          is_ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionario_convenio_dependentes_funcionario_convenio_id_fkey"
            columns: ["funcionario_convenio_id"]
            isOneToOne: false
            referencedRelation: "rh.funcionario_convenios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionario_convenio_dependentes_employee_dependent_id_fkey"
            columns: ["employee_dependent_id"]
            isOneToOne: false
            referencedRelation: "rh.employee_dependents"
            referencedColumns: ["id"]
          }
        ]
      }

      funcionario_elegibilidade: {
        Row: {
          id: string
          employee_id: string
          elegibilidade_id: string
          is_elegivel: boolean
          data_calculo: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          elegibilidade_id: string
          is_elegivel?: boolean
          data_calculo?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          elegibilidade_id?: string
          is_elegivel?: boolean
          data_calculo?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionario_elegibilidade_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rh.employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionario_elegibilidade_elegibilidade_id_fkey"
            columns: ["elegibilidade_id"]
            isOneToOne: false
            referencedRelation: "rh.beneficio_elegibilidade"
            referencedColumns: ["id"]
          }
        ]
      }

      employee_tax_calculations: {
        Row: {
          id: string
          employee_id: string
          reference_month: string
          salario_bruto: number
          inss_bracket_id: string | null
          inss_valor: number
          irrf_bracket_id: string | null
          irrf_valor: number
          fgts_config_id: string | null
          fgts_valor: number
          dependentes_irrf: number | null
          outros_descontos: number | null
          salario_liquido: number
          observacoes: string | null
          is_active: boolean
          company_id: string
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          reference_month: string
          salario_bruto: number
          inss_bracket_id?: string | null
          inss_valor?: number
          irrf_bracket_id?: string | null
          irrf_valor?: number
          fgts_config_id?: string | null
          fgts_valor?: number
          dependentes_irrf?: number | null
          outros_descontos?: number | null
          salario_liquido: number
          observacoes?: string | null
          is_active?: boolean
          company_id: string
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          reference_month?: string
          salario_bruto?: number
          inss_bracket_id?: string | null
          inss_valor?: number
          irrf_bracket_id?: string | null
          irrf_valor?: number
          fgts_config_id?: string | null
          fgts_valor?: number
          dependentes_irrf?: number | null
          outros_descontos?: number | null
          salario_liquido?: number
          observacoes?: string | null
          is_active?: boolean
          company_id?: string
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_tax_calculations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rh.employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_tax_calculations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          }
        ]
      }

      // ===== NOVAS TABELAS DE DOCUMENTOS E INFORMAÇÕES PESSOAIS =====
      employee_documents: {
        Row: {
          id: string
          employee_id: string
          company_id: string
          carteira_trabalho_numero: string | null
          carteira_trabalho_serie: string | null
          carteira_trabalho_uf: string | null
          carteira_trabalho_data_emissao: string | null
          titulo_eleitoral_numero: string | null
          titulo_eleitoral_zona: string | null
          titulo_eleitoral_secao: string | null
          titulo_eleitoral_uf: string | null
          carteira_reservista_numero: string | null
          carteira_reservista_serie: string | null
          carteira_reservista_categoria: string | null
          carteira_motorista_numero: string | null
          carteira_motorista_categoria: string | null
          carteira_motorista_data_vencimento: string | null
          cartao_pis_numero: string | null
          cartao_pis_data_emissao: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          company_id: string
          carteira_trabalho_numero?: string | null
          carteira_trabalho_serie?: string | null
          carteira_trabalho_uf?: string | null
          carteira_trabalho_data_emissao?: string | null
          titulo_eleitoral_numero?: string | null
          titulo_eleitoral_zona?: string | null
          titulo_eleitoral_secao?: string | null
          titulo_eleitoral_uf?: string | null
          carteira_reservista_numero?: string | null
          carteira_reservista_serie?: string | null
          carteira_reservista_categoria?: string | null
          carteira_motorista_numero?: string | null
          carteira_motorista_categoria?: string | null
          carteira_motorista_data_vencimento?: string | null
          cartao_pis_numero?: string | null
          cartao_pis_data_emissao?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          company_id?: string
          carteira_trabalho_numero?: string | null
          carteira_trabalho_serie?: string | null
          carteira_trabalho_uf?: string | null
          carteira_trabalho_data_emissao?: string | null
          titulo_eleitoral_numero?: string | null
          titulo_eleitoral_zona?: string | null
          titulo_eleitoral_secao?: string | null
          titulo_eleitoral_uf?: string | null
          carteira_reservista_numero?: string | null
          carteira_reservista_serie?: string | null
          carteira_reservista_categoria?: string | null
          carteira_motorista_numero?: string | null
          carteira_motorista_categoria?: string | null
          carteira_motorista_data_vencimento?: string | null
          cartao_pis_numero?: string | null
          cartao_pis_data_emissao?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rh.employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          }
        ]
      }

      employee_addresses: {
        Row: {
          id: string
          employee_id: string
          company_id: string
          cep: string | null
          logradouro: string | null
          numero: string | null
          complemento: string | null
          bairro: string | null
          cidade: string | null
          uf: string | null
          pais: string | null
          tipo_endereco: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          company_id: string
          cep?: string | null
          logradouro?: string | null
          numero?: string | null
          complemento?: string | null
          bairro?: string | null
          cidade?: string | null
          uf?: string | null
          pais?: string | null
          tipo_endereco?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          company_id?: string
          cep?: string | null
          logradouro?: string | null
          numero?: string | null
          complemento?: string | null
          bairro?: string | null
          cidade?: string | null
          uf?: string | null
          pais?: string | null
          tipo_endereco?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_addresses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rh.employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_addresses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          }
        ]
      }

      employee_spouses: {
        Row: {
          id: string
          employee_id: string
          company_id: string
          nome: string | null
          cpf: string | null
          rg: string | null
          data_nascimento: string | null
          certidao_casamento_numero: string | null
          certidao_casamento_data: string | null
          certidao_casamento_cartorio: string | null
          certidao_casamento_uf: string | null
          uniao_estavel_data: string | null
          uniao_estavel_cartorio: string | null
          uniao_estavel_uf: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          company_id: string
          nome?: string | null
          cpf?: string | null
          rg?: string | null
          data_nascimento?: string | null
          certidao_casamento_numero?: string | null
          certidao_casamento_data?: string | null
          certidao_casamento_cartorio?: string | null
          certidao_casamento_uf?: string | null
          uniao_estavel_data?: string | null
          uniao_estavel_cartorio?: string | null
          uniao_estavel_uf?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          company_id?: string
          nome?: string | null
          cpf?: string | null
          rg?: string | null
          data_nascimento?: string | null
          certidao_casamento_numero?: string | null
          certidao_casamento_data?: string | null
          certidao_casamento_cartorio?: string | null
          certidao_casamento_uf?: string | null
          uniao_estavel_data?: string | null
          uniao_estavel_cartorio?: string | null
          uniao_estavel_uf?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_spouses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rh.employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_spouses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          }
        ]
      }

      employee_bank_accounts: {
        Row: {
          id: string
          employee_id: string
          company_id: string
          banco_codigo: string | null
          banco_nome: string | null
          agencia_numero: string | null
          agencia_digito: string | null
          conta_numero: string | null
          conta_digito: string | null
          tipo_conta: string | null
          titular_nome: string | null
          titular_cpf: string | null
          conta_principal: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          company_id: string
          banco_codigo?: string | null
          banco_nome?: string | null
          agencia_numero?: string | null
          agencia_digito?: string | null
          conta_numero?: string | null
          conta_digito?: string | null
          tipo_conta?: string | null
          titular_nome?: string | null
          titular_cpf?: string | null
          conta_principal?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          company_id?: string
          banco_codigo?: string | null
          banco_nome?: string | null
          agencia_numero?: string | null
          agencia_digito?: string | null
          conta_numero?: string | null
          conta_digito?: string | null
          tipo_conta?: string | null
          titular_nome?: string | null
          titular_cpf?: string | null
          conta_principal?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_bank_accounts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rh.employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          }
        ]
      }

      employee_education: {
        Row: {
          id: string
          employee_id: string
          company_id: string
          nivel_escolaridade: string | null
          curso: string | null
          instituicao: string | null
          ano_conclusao: number | null
          status_curso: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          company_id: string
          nivel_escolaridade?: string | null
          curso?: string | null
          instituicao?: string | null
          ano_conclusao?: number | null
          status_curso?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          company_id?: string
          nivel_escolaridade?: string | null
          curso?: string | null
          instituicao?: string | null
          ano_conclusao?: number | null
          status_curso?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_education_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rh.employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_education_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "core.companies"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  core: {
    Tables: {
      departments: {
        Row: {
          id: string
          company_id: string
          nome: string
          descricao: string | null
          is_active: boolean | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          nome: string
          descricao?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          nome?: string
          descricao?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string | null
        }
      }
    }
  }
}

// Tipos auxiliares para facilitar o uso
export type RhTables<
  TableName extends keyof RhDatabase["rh"]["Tables"]
> = RhDatabase["rh"]["Tables"][TableName]

export type RhTablesInsert<
  TableName extends keyof RhDatabase["rh"]["Tables"]
> = RhDatabase["rh"]["Tables"][TableName]["Insert"]

export type RhTablesUpdate<
  TableName extends keyof RhDatabase["rh"]["Tables"]
> = RhDatabase["rh"]["Tables"][TableName]["Update"]

export type RhTablesRow<
  TableName extends keyof RhDatabase["rh"]["Tables"]
> = RhDatabase["rh"]["Tables"][TableName]["Row"]

// Tipos específicos para entidades principais
export type Employee = RhTablesRow<"employees">
export type EmployeeInsert = RhTablesInsert<"employees">
export type EmployeeUpdate = RhTablesUpdate<"employees">

export type Position = RhTablesRow<"positions">
export type PositionInsert = RhTablesInsert<"positions">
export type PositionUpdate = RhTablesUpdate<"positions">

export type TimeRecord = RhTablesRow<"time_records">
export type TimeRecordInsert = RhTablesInsert<"time_records">
export type TimeRecordUpdate = RhTablesUpdate<"time_records">

export type Benefit = RhTablesRow<"benefits">
export type BenefitInsert = RhTablesInsert<"benefits">
export type BenefitUpdate = RhTablesUpdate<"benefits">

export type Payroll = RhTablesRow<"payroll">
export type PayrollInsert = RhTablesInsert<"payroll">
export type PayrollUpdate = RhTablesUpdate<"payroll">

export type PayrollItem = RhTablesRow<"payroll_items">
export type PayrollItemInsert = RhTablesInsert<"payroll_items">
export type PayrollItemUpdate = RhTablesUpdate<"payroll_items">

export type Vacation = RhTablesRow<"vacations">
export type VacationInsert = RhTablesInsert<"vacations">
export type VacationUpdate = RhTablesUpdate<"vacations">

export type EmploymentContract = RhTablesRow<"employment_contracts">
export type EmploymentContractInsert = RhTablesInsert<"employment_contracts">
export type EmploymentContractUpdate = RhTablesUpdate<"employment_contracts">

export type WorkSchedule = RhTablesRow<"work_schedules">
export type WorkScheduleInsert = RhTablesInsert<"work_schedules">
export type WorkScheduleUpdate = RhTablesUpdate<"work_schedules">

export type WorkShift = RhTablesRow<"work_shifts">
export type WorkShiftInsert = RhTablesInsert<"work_shifts">
export type WorkShiftUpdate = RhTablesUpdate<"work_shifts">

export type EmployeeShift = RhTablesRow<"employee_shifts">
export type EmployeeShiftInsert = RhTablesInsert<"employee_shifts">
export type EmployeeShiftUpdate = RhTablesUpdate<"employee_shifts">

export type TimeBank = RhTablesRow<"time_bank">
export type TimeBankInsert = RhTablesInsert<"time_bank">
export type TimeBankUpdate = RhTablesUpdate<"time_bank">

export type CompensationRequest = RhTablesRow<"compensation_requests">
export type CompensationRequestInsert = RhTablesInsert<"compensation_requests">
export type CompensationRequestUpdate = RhTablesUpdate<"compensation_requests">

export type EmployeeBenefit = RhTablesRow<"employee_benefits">
export type EmployeeBenefitInsert = RhTablesInsert<"employee_benefits">
export type EmployeeBenefitUpdate = RhTablesUpdate<"employee_benefits">

export type PayrollConfig = RhTablesRow<"payroll_config">
export type PayrollConfigInsert = RhTablesInsert<"payroll_config">
export type PayrollConfigUpdate = RhTablesUpdate<"payroll_config">

export type MedicalCertificate = RhTablesRow<"medical_certificates">
export type MedicalCertificateInsert = RhTablesInsert<"medical_certificates">
export type MedicalCertificateUpdate = RhTablesUpdate<"medical_certificates">

export type PeriodicExam = RhTablesRow<"periodic_exams">
export type PeriodicExamInsert = RhTablesInsert<"periodic_exams">
export type PeriodicExamUpdate = RhTablesUpdate<"periodic_exams">

export type ESocialEvent = RhTablesRow<"esocial_events">
export type ESocialEventInsert = RhTablesInsert<"esocial_events">
export type ESocialEventUpdate = RhTablesUpdate<"esocial_events">

export type Union = RhTablesRow<"unions">
export type UnionInsert = RhTablesInsert<"unions">
export type UnionUpdate = RhTablesUpdate<"unions">

// Novos tipos para as tabelas de documentos e informações pessoais
export type EmployeeDocument = RhTablesRow<"employee_documents">
export type EmployeeDocumentInsert = RhTablesInsert<"employee_documents">
export type EmployeeDocumentUpdate = RhTablesUpdate<"employee_documents">

export type EmployeeAddress = RhTablesRow<"employee_addresses">
export type EmployeeAddressInsert = RhTablesInsert<"employee_addresses">
export type EmployeeAddressUpdate = RhTablesUpdate<"employee_addresses">

export type EmployeeSpouse = RhTablesRow<"employee_spouses">
export type EmployeeSpouseInsert = RhTablesInsert<"employee_spouses">
export type EmployeeSpouseUpdate = RhTablesUpdate<"employee_spouses">

export type EmployeeBankAccount = RhTablesRow<"employee_bank_accounts">
export type EmployeeBankAccountInsert = RhTablesInsert<"employee_bank_accounts">
export type EmployeeBankAccountUpdate = RhTablesUpdate<"employee_bank_accounts">

export type EmployeeEducation = RhTablesRow<"employee_education">
export type EmployeeEducationInsert = RhTablesInsert<"employee_education">
export type EmployeeEducationUpdate = RhTablesUpdate<"employee_education">

// Novos tipos para as tabelas de benefícios e convênios
export type FuncionarioBeneficioHistorico = RhTablesRow<"funcionario_beneficios_historico">
export type FuncionarioBeneficioHistoricoInsert = RhTablesInsert<"funcionario_beneficios_historico">
export type FuncionarioBeneficioHistoricoUpdate = RhTablesUpdate<"funcionario_beneficios_historico">

export type FuncionarioConvenio = RhTablesRow<"funcionario_convenios">
export type FuncionarioConvenioInsert = RhTablesInsert<"funcionario_convenios">
export type FuncionarioConvenioUpdate = RhTablesUpdate<"funcionario_convenios">

export type FuncionarioConvenioDependente = RhTablesRow<"funcionario_convenio_dependentes">
export type FuncionarioConvenioDependenteInsert = RhTablesInsert<"funcionario_convenio_dependentes">
export type FuncionarioConvenioDependenteUpdate = RhTablesUpdate<"funcionario_convenio_dependentes">

export type FuncionarioElegibilidade = RhTablesRow<"funcionario_elegibilidade">
export type FuncionarioElegibilidadeInsert = RhTablesInsert<"funcionario_elegibilidade">
export type FuncionarioElegibilidadeUpdate = RhTablesUpdate<"funcionario_elegibilidade">

export type EmployeeTaxCalculation = RhTablesRow<"employee_tax_calculations">
export type EmployeeTaxCalculationInsert = RhTablesInsert<"employee_tax_calculations">
export type EmployeeTaxCalculationUpdate = RhTablesUpdate<"employee_tax_calculations">

// Enums para status e tipos
export const RhStatus = {
  employee: {
    ativo: 'ativo',
    inativo: 'inativo',
    demitido: 'demitido',
    aposentado: 'aposentado',
    licenca: 'licenca'
  },
  approval: {
    pendente: 'pendente',
    aprovado: 'aprovado',
    rejeitado: 'rejeitado'
  },
  payroll: {
    processando: 'processando',
    processado: 'processado',
    erro: 'erro',
    cancelado: 'cancelado'
  },
  vacation: {
    solicitado: 'solicitado',
    aprovado: 'aprovado',
    rejeitado: 'rejeitado',
    emandamento: 'em_andamento',
    concluido: 'concluido'
  },
  exam: {
    agendado: 'agendado',
    realizado: 'realizado',
    cancelado: 'cancelado',
    pendente: 'pendente'
  },
  esocial: {
    pendente: 'pendente',
    enviado: 'enviado',
    processado: 'processado',
    erro: 'erro'
  }
} as const

export const RhTypes = {
  contract: {
    clt: 'clt',
    pj: 'pj',
    estagiario: 'estagiario',
    temporario: 'temporario',
    terceirizado: 'terceirizado'
  },
  benefit: {
    valor_fixo: 'valor_fixo',
    percentual: 'percentual',
    flexivel: 'flexivel'
  }
} as const
