export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      time_records: {
        Row: {
          company_id: string
          created_at: string | null
          device_info: string | null
          employee_id: string
          id: string
          is_offline: boolean | null
          is_synced: boolean | null
          last_sync_attempt: string | null
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          record_date: string
          record_time: string
          record_type: string
          sync_attempts: number | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          device_info?: string | null
          employee_id: string
          id?: string
          is_offline?: boolean | null
          is_synced?: boolean | null
          last_sync_attempt?: string | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          record_date: string
          record_time: string
          record_type: string
          sync_attempts?: number | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          device_info?: string | null
          employee_id?: string
          id?: string
          is_offline?: boolean | null
          is_synced?: boolean | null
          last_sync_attempt?: string | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          record_date?: string
          record_time?: string
          record_type?: string
          sync_attempts?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          auth_id: string | null
          created_at: string | null
          email: string
          id: string
          name: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          auth_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          auth_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_auth_id_fkey"
            columns: ["auth_id"]
            isOneToOne: true
            referencedRelation: "auth_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      auth_users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          cep: string | null
          cidade: string | null
          cnpj: string | null
          created_at: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string | null
          logo_bucket: string | null
          logo_url: string | null
          nome_fantasia: string | null
          razao_social: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string | null
          logo_bucket?: string | null
          logo_url?: string | null
          nome_fantasia?: string | null
          razao_social?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string | null
          logo_bucket?: string | null
          logo_url?: string | null
          nome_fantasia?: string | null
          razao_social?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cost_centers: {
        Row: {
          code: string | null
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          manager_id: string | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          manager_id?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          manager_id?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_absences: {
        Row: {
          absence_date: string | null
          absence_type: string | null
          company_id: string | null
          created_at: string | null
          employee_id: string | null
          id: string | null
          is_justified: boolean | null
          justification_document: string | null
          reason: string | null
          updated_at: string | null
        }
        Insert: {
          absence_date?: string | null
          absence_type?: string | null
          company_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string | null
          is_justified?: boolean | null
          justification_document?: string | null
          reason?: string | null
          updated_at?: string | null
        }
        Update: {
          absence_date?: string | null
          absence_type?: string | null
          company_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string | null
          is_justified?: boolean | null
          justification_document?: string | null
          reason?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_shifts: {
        Row: {
          company_id: string | null
          created_at: string | null
          employee_id: string | null
          end_date: string | null
          id: string | null
          is_active: boolean | null
          start_date: string | null
          updated_at: string | null
          work_shift_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          end_date?: string | null
          id?: string | null
          is_active?: boolean | null
          start_date?: string | null
          updated_at?: string | null
          work_shift_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          end_date?: string | null
          id?: string | null
          is_active?: boolean | null
          start_date?: string | null
          updated_at?: string | null
          work_shift_id?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          company_id: string | null
          cpf: string | null
          created_at: string | null
          data_admissao: string | null
          data_demissao: string | null
          email: string | null
          id: string | null
          matricula: string | null
          nome: string | null
          status: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          cpf?: string | null
          created_at?: string | null
          data_admissao?: string | null
          data_demissao?: string | null
          email?: string | null
          id?: string | null
          matricula?: string | null
          nome?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          cpf?: string | null
          created_at?: string | null
          data_admissao?: string | null
          data_demissao?: string | null
          email?: string | null
          id?: string | null
          matricula?: string | null
          nome?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      periodic_exams: {
        Row: {
          arquivo_anexo: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          data_agendada: string | null
          data_realizacao: string | null
          employee_id: string | null
          id: string | null
          medico_responsavel: string | null
          observacoes: string | null
          resultado: string | null
          status:
            | "ativo"
            | "inativo"
            | "pendente"
            | "aprovado"
            | "reprovado"
            | "cancelado"
            | "concluido"
            | "agendado"
            | "realizado"
            | "em_andamento"
            | null
          tipo_exame: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          arquivo_anexo?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_agendada?: string | null
          data_realizacao?: string | null
          employee_id?: string | null
          id?: string | null
          medico_responsavel?: string | null
          observacoes?: string | null
          resultado?: string | null
          status?:
            | "ativo"
            | "inativo"
            | "pendente"
            | "aprovado"
            | "reprovado"
            | "cancelado"
            | "concluido"
            | "agendado"
            | "realizado"
            | "em_andamento"
            | null
          tipo_exame?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          arquivo_anexo?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_agendada?: string | null
          data_realizacao?: string | null
          employee_id?: string | null
          id?: string | null
          medico_responsavel?: string | null
          observacoes?: string | null
          resultado?: string | null
          status?:
            | "ativo"
            | "inativo"
            | "pendente"
            | "aprovado"
            | "reprovado"
            | "cancelado"
            | "concluido"
            | "agendado"
            | "realizado"
            | "em_andamento"
            | null
          tipo_exame?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      positions: {
        Row: {
          company_id: string | null
          created_at: string | null
          department_id: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          salary_max: number | null
          salary_min: number | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          salary_max?: number | null
          salary_min?: number | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          salary_max?: number | null
          salary_min?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      test_view: {
        Row: {
          message: string | null
        }
        Relationships: []
      }
      user_auth: {
        Row: {
          created_at: string | null
          email: string | null
          email_confirmed_at: string | null
          encrypted_password: string | null
          id: string | null
          is_anonymous: boolean | null
          is_sso_user: boolean | null
          is_super_admin: boolean | null
          last_sign_in_at: string | null
          raw_app_meta_data: Json | null
          raw_user_meta_data: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id?: string | null
          is_anonymous?: boolean | null
          is_sso_user?: boolean | null
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id?: string | null
          is_anonymous?: boolean | null
          is_sso_user?: boolean | null
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          company_id: string | null
          created_at: string | null
          email: string | null
          id: string | null
          manager_id: string | null
          name: string | null
          phone: string | null
          profile_id: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          manager_id?: string | null
          name?: string | null
          phone?: string | null
          profile_id?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          manager_id?: string | null
          name?: string | null
          phone?: string | null
          profile_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vacations: {
        Row: {
          aprovado_por: string | null
          company_id: string | null
          created_at: string | null
          data_aprovacao: string | null
          data_fim: string | null
          data_inicio: string | null
          dias_abono: number | null
          dias_ferias: number | null
          employee_id: string | null
          id: string | null
          observacoes: string | null
          status: string | null
          tipo_fracionamento: string | null
          total_periodos: number | null
          updated_at: string | null
        }
        Insert: {
          aprovado_por?: string | null
          company_id?: string | null
          created_at?: string | null
          data_aprovacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          dias_abono?: number | null
          dias_ferias?: number | null
          employee_id?: string | null
          id?: string | null
          observacoes?: string | null
          status?: string | null
          tipo_fracionamento?: string | null
          total_periodos?: number | null
          updated_at?: string | null
        }
        Update: {
          aprovado_por?: string | null
          company_id?: string | null
          created_at?: string | null
          data_aprovacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          dias_abono?: number | null
          dias_ferias?: number | null
          employee_id?: string | null
          id?: string | null
          observacoes?: string | null
          status?: string | null
          tipo_fracionamento?: string | null
          total_periodos?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      work_shifts: {
        Row: {
          break_duration: number | null
          ciclo_dias: number | null
          company_id: string | null
          created_at: string | null
          descricao: string | null
          description: string | null
          dias_folga: number | null
          dias_trabalho: number | null
          end_time: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          regras_clt: Json | null
          start_time: string | null
          template_escala: boolean | null
          tipo_escala: string | null
          updated_at: string | null
          work_days: number[] | null
        }
        Insert: {
          break_duration?: number | null
          ciclo_dias?: number | null
          company_id?: string | null
          created_at?: string | null
          descricao?: string | null
          description?: string | null
          dias_folga?: number | null
          dias_trabalho?: number | null
          end_time?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          regras_clt?: Json | null
          start_time?: string | null
          template_escala?: boolean | null
          tipo_escala?: string | null
          updated_at?: string | null
          work_days?: number[] | null
        }
        Update: {
          break_duration?: number | null
          ciclo_dias?: number | null
          company_id?: string | null
          created_at?: string | null
          descricao?: string | null
          description?: string | null
          dias_folga?: number | null
          dias_trabalho?: number | null
          end_time?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          regras_clt?: Json | null
          start_time?: string | null
          template_escala?: boolean | null
          tipo_escala?: string | null
          updated_at?: string | null
          work_days?: number[] | null
        }
        Relationships: []
      }
    }
    Functions: {
      algorithm_sign: {
        Args: { algorithm: string; secret: string; signables: string }
        Returns: string
      }
      check_entity_permission: {
        Args: { action: string; entity_name: string; user_id: string }
        Returns: boolean
      }
      check_user_permission: {
        Args: { p_module_name: string; p_permission: string }
        Returns: boolean
      }
      get_user_profile: {
        Args: { user_id: string }
        Returns: Json
      }
      sign: {
        Args: { algorithm?: string; payload: Json; secret: string }
        Returns: string
      }
      try_cast_double: {
        Args: { inp: string }
        Returns: number
      }
      url_decode: {
        Args: { data: string }
        Returns: string
      }
      url_encode: {
        Args: { data: string }
        Returns: string
      }
      verify: {
        Args: { algorithm?: string; secret: string; token: string }
        Returns: {
          header: Json
          payload: Json
          valid: boolean
        }[]
      }
      verify_password: {
        Args: { input_password: string; stored_hash: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
