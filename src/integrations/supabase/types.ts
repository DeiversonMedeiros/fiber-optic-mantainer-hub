export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  core: {
    Tables: {
      companies: {
        Row: {
          id: string
          razao_social: string
          nome_fantasia: string | null
          cnpj: string | null
          inscricao_estadual: string | null
          endereco: string | null
          contato: string | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          razao_social: string
          nome_fantasia?: string | null
          cnpj?: string | null
          inscricao_estadual?: string | null
          endereco?: string | null
          contato?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          razao_social?: string
          nome_fantasia?: string | null
          cnpj?: string | null
          inscricao_estadual?: string | null
          endereco?: string | null
          contato?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      cost_centers: {
        Row: {
          id: string
          company_id: string | null
          codigo: string
          nome: string
          descricao: string | null
          parent_id: string | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          company_id?: string | null
          codigo: string
          nome: string
          descricao?: string | null
          parent_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string | null
          codigo?: string
          nome?: string
          descricao?: string | null
          parent_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_centers_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          }
        ]
      }
      departments: {
        Row: {
          id: string
          company_id: string | null
          codigo: string
          nome: string
          descricao: string | null
          parent_id: string | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          company_id?: string | null
          codigo: string
          nome: string
          descricao?: string | null
          parent_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string | null
          codigo?: string
          nome?: string
          descricao?: string | null
          parent_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          }
        ]
      }
      entity_permissions: {
        Row: {
          id: string
          profile_id: string | null
          entity_name: string
          can_read: boolean | null
          can_create: boolean | null
          can_edit: boolean | null
          can_delete: boolean | null
        }
        Insert: {
          id?: string
          profile_id?: string | null
          entity_name: string
          can_read?: boolean | null
          can_create?: boolean | null
          can_edit?: boolean | null
          can_delete?: boolean | null
        }
        Update: {
          id?: string
          profile_id?: string | null
          entity_name?: string
          can_read?: boolean | null
          can_create?: boolean | null
          can_edit?: boolean | null
          can_delete?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_permissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      module_permissions: {
        Row: {
          id: string
          profile_id: string | null
          module_name: string
          can_read: boolean | null
          can_create: boolean | null
          can_edit: boolean | null
          can_delete: boolean | null
        }
        Insert: {
          id?: string
          profile_id?: string | null
          module_name: string
          can_read?: boolean | null
          can_create?: boolean | null
          can_edit?: boolean | null
          can_delete?: boolean | null
        }
        Update: {
          id?: string
          profile_id?: string | null
          module_name?: string
          can_read?: boolean | null
          can_create?: boolean | null
          can_edit?: boolean | null
          can_delete?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "module_permissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          nome: string
          permissoes_gerais: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          nome: string
          permissoes_gerais?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          nome?: string
          permissoes_gerais?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          company_id: string | null
          cost_center_id: string | null
          codigo: string
          nome: string
          descricao: string | null
          data_inicio: string | null
          data_fim: string | null
          status: string | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          company_id?: string | null
          cost_center_id?: string | null
          codigo: string
          nome: string
          descricao?: string | null
          data_inicio?: string | null
          data_fim?: string | null
          status?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string | null
          cost_center_id?: string | null
          codigo?: string
          nome?: string
          descricao?: string | null
          data_inicio?: string | null
          data_fim?: string | null
          status?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          }
        ]
      }
      user_companies: {
        Row: {
          user_id: string
          company_id: string
          profile_id: string | null
          is_primary: boolean | null
          created_at: string | null
        }
        Insert: {
          user_id: string
          company_id: string
          profile_id?: string | null
          is_primary?: boolean | null
          created_at?: string | null
        }
        Update: {
          user_id?: string
          company_id?: string
          profile_id?: string | null
          is_primary?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_companies_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          avatar_url: string | null
          is_active: boolean | null
          company_id: string | null
          profile_id: string | null
          manager_id: string | null
          username: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name: string
          email: string
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean | null
          company_id?: string | null
          profile_id?: string | null
          manager_id?: string | null
          username?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean | null
          company_id?: string | null
          profile_id?: string | null
          manager_id?: string | null
          username?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      employees: {
        Row: {
          id: string
          name: string
          email: string
          cpf: string
          rg: string | null
          birth_date: string | null
          hire_date: string
          position_id: string | null
          department: string | null
          salary: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          cpf: string
          rg?: string | null
          birth_date?: string | null
          hire_date: string
          position_id?: string | null
          department?: string | null
          salary?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          cpf?: string
          rg?: string | null
          birth_date?: string | null
          hire_date?: string
          position_id?: string | null
          department?: string | null
          salary?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          }
        ]
      }
      positions: {
        Row: {
          id: string
          name: string
          description: string | null
          department: string | null
          salary_range_min: number | null
          salary_range_max: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          department?: string | null
          salary_range_min?: number | null
          salary_range_max?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          department?: string | null
          salary_range_min?: number | null
          salary_range_max?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      time_records: {
        Row: {
          id: string
          employee_id: string
          date: string
          check_in: string | null
          check_out: string | null
          break_start: string | null
          break_end: string | null
          total_hours: number | null
          overtime_hours: number | null
          is_holiday: boolean
          is_weekend: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          date: string
          check_in?: string | null
          check_out?: string | null
          break_start?: string | null
          break_end?: string | null
          total_hours?: number | null
          overtime_hours?: number | null
          is_holiday?: boolean
          is_weekend?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          date?: string
          check_in?: string | null
          check_out?: string | null
          break_start?: string | null
          break_end?: string | null
          total_hours?: number | null
          overtime_hours?: number | null
          is_holiday?: boolean
          is_weekend?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      work_schedules: {
        Row: {
          id: string
          employee_id: string
          day_of_week: number
          start_time: string
          end_time: string
          break_start: string | null
          break_end: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          day_of_week: number
          start_time: string
          end_time: string
          break_start?: string | null
          break_end?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          break_start?: string | null
          break_end?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      benefits: {
        Row: {
          id: string
          name: string
          description: string | null
          type: string
          value: number | null
          is_percentage: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          type: string
          value?: number | null
          is_percentage?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          type?: string
          value?: number | null
          is_percentage?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_benefits: {
        Row: {
          id: string
          employee_id: string
          benefit_id: string
          value: number | null
          start_date: string
          end_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          benefit_id: string
          value?: number | null
          start_date: string
          end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          benefit_id?: string
          value?: number | null
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_benefits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_benefits_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          }
        ]
      }
      payroll: {
        Row: {
          id: string
          employee_id: string
          month: number
          year: number
          base_salary: number
          benefits_total: number
          deductions_total: number
          net_salary: number
          status: string
          payment_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          month: number
          year: number
          base_salary: number
          benefits_total?: number
          deductions_total?: number
          net_salary?: number
          status?: string
          payment_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          month?: number
          year?: number
          base_salary?: number
          benefits_total?: number
          deductions_total?: number
          net_salary?: number
          status?: string
          payment_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      vacations: {
        Row: {
          id: string
          employee_id: string
          start_date: string
          end_date: string
          days_requested: number
          days_approved: number | null
          status: string
          reason: string | null
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          start_date: string
          end_date: string
          days_requested: number
          days_approved?: number | null
          status?: string
          reason?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          start_date?: string
          end_date?: string
          days_requested?: number
          days_approved?: number | null
          status?: string
          reason?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      medical_certificates: {
        Row: {
          id: string
          employee_id: string
          start_date: string
          end_date: string
          days: number
          reason: string
          doctor_name: string
          doctor_crm: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          start_date: string
          end_date: string
          days: number
          reason: string
          doctor_name: string
          doctor_crm: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          start_date?: string
          end_date?: string
          days?: number
          reason?: string
          doctor_name?: string
          doctor_crm?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_certificates_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      esocial_events: {
        Row: {
          id: string
          employee_id: string
          event_type: string
          event_date: string
          status: string
          xml_data: Json | null
          sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          event_type: string
          event_date: string
          status?: string
          xml_data?: Json | null
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          event_type?: string
          event_date?: string
          status?: string
          xml_data?: Json | null
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "esocial_events_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      recruitment: {
        Row: {
          id: string
          position_id: string
          title: string
          description: string
          requirements: string | null
          salary_range_min: number | null
          salary_range_max: number | null
          status: string
          open_date: string
          close_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          position_id: string
          title: string
          description: string
          requirements?: string | null
          salary_range_min?: number | null
          salary_range_max?: number | null
          status?: string
          open_date: string
          close_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          position_id?: string
          title?: string
          description?: string
          requirements?: string | null
          salary_range_min?: number | null
          salary_range_max?: number | null
          status?: string
          open_date?: string
          close_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruitment_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          }
        ]
      }
      training: {
        Row: {
          id: string
          title: string
          description: string
          type: string
          duration_hours: number | null
          start_date: string | null
          end_date: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          type: string
          duration_hours?: number | null
          start_date?: string | null
          end_date?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          type?: string
          duration_hours?: number | null
          start_date?: string | null
          end_date?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_training: {
        Row: {
          id: string
          employee_id: string
          training_id: string
          status: string
          completion_date: string | null
          score: number | null
          certificate_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          training_id: string
          status?: string
          completion_date?: string | null
          score?: number | null
          certificate_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          training_id?: string
          status?: string
          completion_date?: string | null
          score?: number | null
          certificate_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_training_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_training_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "training"
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
  rh: {
    Tables: {
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
          created_at?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          id: string
          company_id: string | null
          codigo: string
          nome: string
          descricao: string | null
          nivel_hierarquico: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          codigo: string
          nome: string
          descricao?: string | null
          nivel_hierarquico?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          codigo?: string
          nome?: string
          descricao?: string | null
          nivel_hierarquico?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      time_records: {
        Row: {
          id: string
          employee_id: string
          date: string
          check_in: string | null
          check_out: string | null
          break_start: string | null
          break_end: string | null
          total_hours: number | null
          overtime_hours: number | null
          is_holiday: boolean
          is_weekend: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          date: string
          check_in?: string | null
          check_out?: string | null
          break_start?: string | null
          break_end?: string | null
          total_hours?: number | null
          overtime_hours?: number | null
          is_holiday?: boolean
          is_weekend?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          date?: string
          check_in?: string | null
          check_out?: string | null
          break_start?: string | null
          break_end?: string | null
          total_hours?: number | null
          overtime_hours?: number | null
          is_holiday?: boolean
          is_weekend?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      work_schedules: {
        Row: {
          id: string
          employee_id: string
          day_of_week: number
          start_time: string
          end_time: string
          break_start: string | null
          break_end: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          day_of_week: number
          start_time: string
          end_time: string
          break_start?: string | null
          break_end?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          break_start?: string | null
          break_end?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      benefits: {
        Row: {
          id: string
          name: string
          description: string | null
          type: string
          value: number | null
          is_percentage: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          type: string
          value?: number | null
          is_percentage?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          type?: string
          value?: number | null
          is_percentage?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_benefits: {
        Row: {
          id: string
          employee_id: string
          benefit_id: string
          value: number | null
          start_date: string
          end_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          benefit_id: string
          value?: number | null
          start_date: string
          end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          benefit_id?: string
          value?: number | null
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_benefits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_benefits_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          }
        ]
      }
      payroll: {
        Row: {
          id: string
          employee_id: string
          month: number
          year: number
          base_salary: number
          benefits_total: number
          deductions_total: number
          net_salary: number
          status: string
          payment_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          month: number
          year: number
          base_salary: number
          benefits_total?: number
          deductions_total?: number
          net_salary?: number
          status?: string
          payment_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          month?: number
          year?: number
          base_salary?: number
          benefits_total?: number
          deductions_total?: number
          net_salary?: number
          status?: string
          payment_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      vacations: {
        Row: {
          id: string
          employee_id: string
          start_date: string
          end_date: string
          days_requested: number
          days_approved: number | null
          status: string
          reason: string | null
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          start_date: string
          end_date: string
          days_requested: number
          days_approved?: number | null
          status?: string
          reason?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          start_date?: string
          end_date?: string
          days_requested?: number
          days_approved?: number | null
          status?: string
          reason?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      medical_certificates: {
        Row: {
          id: string
          employee_id: string
          start_date: string
          end_date: string
          days: number
          reason: string
          doctor_name: string
          doctor_crm: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          start_date: string
          end_date: string
          days: number
          reason: string
          doctor_name: string
          doctor_crm: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          start_date?: string
          end_date?: string
          days?: number
          reason?: string
          doctor_name?: string
          doctor_crm?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_certificates_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      esocial_events: {
        Row: {
          id: string
          employee_id: string
          event_type: string
          event_date: string
          status: string
          xml_data: Json | null
          sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          event_type: string
          event_date: string
          status?: string
          xml_data?: Json | null
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          event_type?: string
          event_date?: string
          status?: string
          xml_data?: Json | null
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "esocial_events_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      recruitment: {
        Row: {
          id: string
          position_id: string
          title: string
          description: string
          requirements: string | null
          salary_range_min: number | null
          salary_range_max: number | null
          status: string
          open_date: string
          close_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          position_id: string
          title: string
          description: string
          requirements?: string | null
          salary_range_min?: number | null
          salary_range_max?: number | null
          status?: string
          open_date: string
          close_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          position_id?: string
          title?: string
          description?: string
          requirements?: string | null
          salary_range_min?: number | null
          salary_range_max?: number | null
          status?: string
          open_date?: string
          close_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruitment_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          }
        ]
      }
      training: {
        Row: {
          id: string
          title: string
          description: string
          type: string
          duration_hours: number | null
          start_date: string | null
          end_date: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          type: string
          duration_hours?: number | null
          start_date?: string | null
          end_date?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          type?: string
          duration_hours?: number | null
          start_date?: string | null
          end_date?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_training: {
        Row: {
          id: string
          employee_id: string
          training_id: string
          status: string
          completion_date: string | null
          score: number | null
          certificate_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          training_id: string
          status?: string
          completion_date?: string | null
          score?: number | null
          certificate_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          training_id?: string
          status?: string
          completion_date?: string | null
          score?: number | null
          certificate_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_training_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_training_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "training"
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
}

// ===== EXPORTAÇÕES DE TIPOS PARA O MÓDULO RH =====

// Tipos de Funcionários
export type Employee = Database['rh']['Tables']['employees']['Row'];
export type EmployeeInsert = Database['rh']['Tables']['employees']['Insert'];
export type EmployeeUpdate = Database['rh']['Tables']['employees']['Update'];

// Tipos de Cargos
export type Position = Database['rh']['Tables']['positions']['Row'];
export type PositionInsert = Database['rh']['Tables']['positions']['Insert'];
export type PositionUpdate = Database['rh']['Tables']['positions']['Update'];

// Tipos de Registros de Ponto
export type TimeRecord = Database['rh']['Tables']['time_records']['Row'];
export type TimeRecordInsert = Database['rh']['Tables']['time_records']['Insert'];
export type TimeRecordUpdate = Database['rh']['Tables']['time_records']['Update'];

// Tipos de Escalas de Trabalho
export type WorkSchedule = Database['rh']['Tables']['work_schedules']['Row'];
export type WorkScheduleInsert = Database['rh']['Tables']['work_schedules']['Insert'];
export type WorkScheduleUpdate = Database['rh']['Tables']['work_schedules']['Update'];

// Tipos de Benefícios
export type Benefit = Database['rh']['Tables']['benefits']['Row'];
export type BenefitInsert = Database['rh']['Tables']['benefits']['Insert'];
export type BenefitUpdate = Database['rh']['Tables']['benefits']['Update'];

// Tipos de Folha de Pagamento
export type Payroll = Database['rh']['Tables']['payroll']['Row'];
export type PayrollInsert = Database['rh']['Tables']['payroll']['Insert'];
export type PayrollUpdate = Database['rh']['Tables']['payroll']['Update'];

// Tipos de Férias
export type Vacation = Database['rh']['Tables']['vacations']['Row'];
export type VacationInsert = Database['rh']['Tables']['vacations']['Insert'];
export type VacationUpdate = Database['rh']['Tables']['vacations']['Update'];

// Tipos de Atestados Médicos
export type MedicalCertificate = Database['rh']['Tables']['medical_certificates']['Row'];
export type MedicalCertificateInsert = Database['rh']['Tables']['medical_certificates']['Insert'];
export type MedicalCertificateUpdate = Database['rh']['Tables']['medical_certificates']['Update'];

// Tipos de Eventos eSocial
export type ESocialEvent = Database['rh']['Tables']['esocial_events']['Row'];
export type ESocialEventInsert = Database['rh']['Tables']['esocial_events']['Insert'];
export type ESocialEventUpdate = Database['rh']['Tables']['esocial_events']['Update'];

// Tipos de Recrutamento
export type Recruitment = Database['rh']['Tables']['recruitment']['Row'];
export type RecruitmentInsert = Database['rh']['Tables']['recruitment']['Insert'];
export type RecruitmentUpdate = Database['rh']['Tables']['recruitment']['Update'];

// Tipos de Treinamento
export type Training = Database['rh']['Tables']['training']['Row'];
export type TrainingInsert = Database['rh']['Tables']['training']['Insert'];
export type TrainingUpdate = Database['rh']['Tables']['training']['Update'];

// Nota: As tabelas adicionais (compensation_requests, employee_shifts, employment_contracts,
// payroll_config, payroll_items, periodic_exams, time_bank, unions, work_shifts) 
// existem no banco de dados mas ainda não foram adicionadas ao types.ts
// Elas podem ser adicionadas posteriormente conforme necessário