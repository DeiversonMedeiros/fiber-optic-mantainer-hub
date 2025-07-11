export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      access_profiles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          permissions: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          permissions?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          permissions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      activities: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          category: Database["public"]["Enums"]["checklist_category"]
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_class_id: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["checklist_category"]
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_class_id?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["checklist_category"]
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_class_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_user_class_id_fkey"
            columns: ["user_class_id"]
            isOneToOne: false
            referencedRelation: "user_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      material_adjustments: {
        Row: {
          created_at: string
          created_by: string
          id: string
          checklist_item_id: string
          quantity_reduced: number
          reason: string | null
          sa_code: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          checklist_item_id: string
          quantity_reduced: number
          reason?: string | null
          sa_code: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          checklist_item_id?: string
          quantity_reduced?: number
          reason?: string | null
          sa_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_adjustments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_adjustments_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_adjustments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      material_consumption: {
        Row: {
          created_at: string
          id: string
          material_id: string
          notes: string | null
          quantity: number
          sa_code: string | null
          service_order_id: string | null
          used_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          notes?: string | null
          quantity: number
          sa_code?: string | null
          service_order_id?: string | null
          used_by: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          notes?: string | null
          quantity?: number
          sa_code?: string | null
          service_order_id?: string | null
          used_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_consumption_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_consumption_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_consumption_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          min_stock: number
          name: string
          stock_quantity: number
          unit: string
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          min_stock?: number
          name: string
          stock_quantity?: number
          unit: string
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          min_stock?: number
          name?: string
          stock_quantity?: number
          unit?: string
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      preventive_schedule: {
        Row: {
          attachments: Json | null
          cable_number: string
          client_site: string
          completed_at: string | null
          created_at: string
          created_by: string
          id: string
          inspector_id: string
          is_completed: boolean
          observations: string | null
          scheduled_month: number
          scheduled_year: number
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          cable_number: string
          client_site: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          inspector_id: string
          is_completed?: boolean
          observations?: string | null
          scheduled_month: number
          scheduled_year: number
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          cable_number?: string
          client_site?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          inspector_id?: string
          is_completed?: boolean
          observations?: string | null
          scheduled_month?: number
          scheduled_year?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "preventive_schedule_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preventive_schedule_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          access_profile_id: string | null
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          manager_id: string | null
          name: string
          phone: string | null
          updated_at: string
          user_class_id: string | null
        }
        Insert: {
          access_profile_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          manager_id?: string | null
          name: string
          phone?: string | null
          updated_at?: string
          user_class_id?: string | null
        }
        Update: {
          access_profile_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          user_class_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_access_profile_id_fkey"
            columns: ["access_profile_id"]
            isOneToOne: false
            referencedRelation: "access_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_user_class_id_fkey"
            columns: ["user_class_id"]
            isOneToOne: false
            referencedRelation: "user_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      report_checklist_items: {
        Row: {
          checklist_item_id: string
          created_at: string
          id: string
          notes: string | null
          quantity: number | null
          report_id: string
        }
        Insert: {
          checklist_item_id: string
          created_at?: string
          id?: string
          notes?: string | null
          quantity?: number | null
          report_id: string
        }
        Update: {
          checklist_item_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          quantity?: number | null
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_checklist_items_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_checklist_items_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_templates: {
        Row: {
          checklist_class_id: string | null
          checklist_enabled: boolean
          created_at: string
          description: string | null
          fields: Json
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_class_id: string | null
        }
        Insert: {
          checklist_class_id?: string | null
          checklist_enabled?: boolean
          created_at?: string
          description?: string | null
          fields?: Json
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_class_id?: string | null
        }
        Update: {
          checklist_class_id?: string | null
          checklist_enabled?: boolean
          created_at?: string
          description?: string | null
          fields?: Json
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_class_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_templates_checklist_class_id_fkey"
            columns: ["checklist_class_id"]
            isOneToOne: false
            referencedRelation: "user_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_templates_user_class_id_fkey"
            columns: ["user_class_id"]
            isOneToOne: false
            referencedRelation: "user_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          attachments: Json | null
          checklist_data: Json | null
          created_at: string
          description: string
          form_data: Json | null
          id: string
          status: Database["public"]["Enums"]["report_status"]
          technician_id: string
          template_id: string | null
          title: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          numero_servico: string | null
          service_order_id: string | null
          assigned_to: string | null
          pending_reason: string | null
          pending_notes: string | null
          parent_report_id: string | null
        }
        Insert: {
          attachments?: Json | null
          checklist_data?: Json | null
          created_at?: string
          description: string
          form_data?: Json | null
          id?: string
          status?: Database["public"]["Enums"]["report_status"]
          technician_id: string
          template_id?: string | null
          title: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          numero_servico?: string | null
          service_order_id?: string | null
          assigned_to?: string | null
          pending_reason?: string | null
          pending_notes?: string | null
          parent_report_id?: string | null
        }
        Update: {
          attachments?: Json | null
          checklist_data?: Json | null
          created_at?: string
          description?: string
          form_data?: Json | null
          id?: string
          status?: Database["public"]["Enums"]["report_status"]
          technician_id?: string
          template_id?: string | null
          title?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          numero_servico?: string | null
          service_order_id?: string | null
          assigned_to?: string | null
          pending_reason?: string | null
          pending_notes?: string | null
          parent_report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      risks: {
        Row: {
          assigned_to: string | null
          cable_client_site: string | null
          city: string | null
          created_at: string
          description: string
          directed_at: string | null
          directed_to: string | null
          id: string
          location: string
          photos: Json | null
          reported_by: string
          resolved_at: string | null
          risk_number: string | null
          risk_type: string | null
          severity: number
          status: Database["public"]["Enums"]["risk_status"]
          status_updated_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          cable_client_site?: string | null
          city?: string | null
          created_at?: string
          description: string
          directed_at?: string | null
          directed_to?: string | null
          id?: string
          location: string
          photos?: Json | null
          reported_by: string
          resolved_at?: string | null
          risk_number?: string | null
          risk_type?: string | null
          severity: number
          status?: Database["public"]["Enums"]["risk_status"]
          status_updated_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          cable_client_site?: string | null
          city?: string | null
          created_at?: string
          description?: string
          directed_at?: string | null
          directed_to?: string | null
          id?: string
          location?: string
          photos?: Json | null
          reported_by?: string
          resolved_at?: string | null
          risk_number?: string | null
          risk_type?: string | null
          severity?: number
          status?: Database["public"]["Enums"]["risk_status"]
          status_updated_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risks_directed_to_fkey"
            columns: ["directed_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risks_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_classes: {
        Row: {
          access_profile_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          access_profile_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          access_profile_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_classes_access_profile_id_fkey"
            columns: ["access_profile_id"]
            isOneToOne: false
            referencedRelation: "access_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_reports: {
        Row: {
          id: string;
          technician_id: string;
          schedule_id: string | null;
          risk_type: string;
          risk_level: string;
          address: string;
          city: string;
          neighborhood: string;
          cable_number: string;
          network_type: string;
          description: string;
          photos: string[];
          created_at: string;
          updated_at: string;
          assigned_to: string | null;
          status: 'pendente' | 'concluido' | 'cancelado'; // novo campo
        };
        Insert: {
          id?: string;
          technician_id: string;
          schedule_id?: string | null;
          risk_type: string;
          risk_level: string;
          address: string;
          city: string;
          neighborhood: string;
          cable_number: string;
          network_type: string;
          description: string;
          photos: string[];
          created_at?: string;
          updated_at?: string;
          assigned_to?: string | null;
          status?: 'pendente' | 'concluido' | 'cancelado'; // novo campo
        };
        Update: {
          id?: string;
          technician_id?: string;
          schedule_id?: string | null;
          risk_type?: string;
          risk_level?: string;
          address?: string;
          city?: string;
          neighborhood?: string;
          cable_number?: string;
          network_type?: string;
          description?: string;
          photos?: string[];
          created_at?: string;
          updated_at?: string;
          assigned_to?: string | null;
          status?: 'pendente' | 'concluido' | 'cancelado'; // novo campo
        };
        Relationships: [
          {
            foreignKeyName: "inspection_reports_technician_id_fkey",
            columns: ["technician_id"],
            isOneToOne: false,
            referencedRelation: "profiles",
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_reports_schedule_id_fkey",
            columns: ["schedule_id"],
            isOneToOne: false,
            referencedRelation: "preventive_schedule",
            referencedColumns: ["id"]
          }
        ];
      },
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin_or_manager: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_admin_or_manager_safe: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      checklist_category: "servicos" | "materiais"
      maintenance_type: "preventiva" | "corretiva" | "emergencial"
      os_status: "pendente" | "em_andamento" | "concluida" | "cancelada"
      report_field_type:
        | "texto_curto"
        | "texto_longo"
        | "data"
        | "radio"
        | "checkbox"
        | "dropdown"
        | "upload"
        | "checklist"
      report_status: "nao_validado" | "validado" | "pendente" | "cancelado" | "em_adequacao" | "adequado" | "faturado"
      risk_status: "enviado" | "direcionado" | "concluido" | "aberto"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      checklist_category: ["servicos", "materiais"],
      maintenance_type: ["preventiva", "corretiva", "emergencial"],
      os_status: ["pendente", "em_andamento", "concluida", "cancelada"],
      report_field_type: [
        "texto_curto",
        "texto_longo",
        "data",
        "radio",
        "checkbox",
        "dropdown",
        "upload",
        "checklist",
      ],
      report_status: ["nao_validado", "validado", "pendente", "cancelado", "em_adequacao", "adequado", "faturado"],
      risk_status: ["enviado", "direcionado", "concluido", "aberto"],
    },
  },
} as const
