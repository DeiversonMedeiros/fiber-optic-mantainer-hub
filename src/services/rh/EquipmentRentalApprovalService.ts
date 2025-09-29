import { rhSupabase } from '@/integrations/supabase/client';

export interface EquipmentRentalApproval {
  id: string;
  company_id: string;
  employee_id: string;
  equipment_rental_id: string;
  mes_referencia: number;
  ano_referencia: number;
  valor_aprovado: number;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  aprovado_por: string | null;
  data_aprovacao: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  employee?: {
    id: string;
    nome: string;
    cpf: string;
    position?: {
      id: string;
      nome: string;
    };
    department?: {
      id: string;
      nome: string;
    };
  };
  equipment_rental?: {
    id: string;
    equipment_name: string;
    equipment_type: string;
    brand: string | null;
    model: string | null;
    serial_number: string | null;
    license_plate: string | null;
    monthly_value: number;
    start_date: string;
    end_date: string | null;
    status: string;
  };
  manager?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ApprovalFilters {
  status?: 'pendente' | 'aprovado' | 'rejeitado';
  mes_referencia?: number;
  ano_referencia?: number;
  manager_id?: string;
}

export class EquipmentRentalApprovalService {
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  async getApprovals(filters: ApprovalFilters = {}): Promise<EquipmentRentalApproval[]> {
    try {
      let query = rhSupabase
        .from('rh.equipment_rental_approvals')
        .select(`
          *,
          employee:employees!equipment_rental_approvals_employee_id_fkey(
            id,
            nome,
            cpf,
            position:positions!employees_position_id_fkey(
              id,
              nome
            ),
            department:departments!employees_department_id_fkey(
              id,
              nome
            )
          ),
          equipment_rental:equipment_rentals!equipment_rental_approvals_equipment_rental_id_fkey(
            id,
            equipment_name,
            equipment_type,
            brand,
            model,
            serial_number,
            license_plate,
            monthly_value,
            start_date,
            end_date,
            status
          ),
          manager:users!equipment_rental_approvals_aprovado_por_fkey(
            id,
            name,
            email
          )
        `)
        .eq('company_id', this.companyId)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.mes_referencia) {
        query = query.eq('mes_referencia', filters.mes_referencia);
      }
      if (filters.ano_referencia) {
        query = query.eq('ano_referencia', filters.ano_referencia);
      }
      if (filters.manager_id) {
        query = query.eq('aprovado_por', filters.manager_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar aprovações:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro no EquipmentRentalApprovalService.getApprovals:', error);
      throw error;
    }
  }

  async getApprovalById(id: string): Promise<EquipmentRentalApproval | null> {
    try {
      const { data, error } = await rhSupabase
        .from('rh.equipment_rental_approvals')
        .select(`
          *,
          employee:employees!equipment_rental_approvals_employee_id_fkey(
            id,
            nome,
            cpf,
            position:positions!employees_position_id_fkey(
              id,
              nome
            ),
            department:departments!employees_department_id_fkey(
              id,
              nome
            )
          ),
          equipment_rental:equipment_rentals!equipment_rental_approvals_equipment_rental_id_fkey(
            id,
            equipment_name,
            equipment_type,
            brand,
            model,
            serial_number,
            license_plate,
            monthly_value,
            start_date,
            end_date,
            status
          ),
          manager:users!equipment_rental_approvals_aprovado_por_fkey(
            id,
            name,
            email
          )
        `)
        .eq('id', id)
        .eq('company_id', this.companyId)
        .single();

      if (error) {
        console.error('Erro ao buscar aprovação:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro no EquipmentRentalApprovalService.getApprovalById:', error);
      throw error;
    }
  }

  async updateApprovalStatus(
    id: string, 
    status: 'aprovado' | 'rejeitado', 
    observacoes?: string
  ): Promise<void> {
    try {
      const { error } = await rhSupabase
        .from('rh.equipment_rental_approvals')
        .update({
          status,
          data_aprovacao: new Date().toISOString(),
          observacoes: observacoes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('company_id', this.companyId);

      if (error) {
        console.error('Erro ao atualizar status da aprovação:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro no EquipmentRentalApprovalService.updateApprovalStatus:', error);
      throw error;
    }
  }

  async getApprovalStats(): Promise<{
    total: number;
    pendentes: number;
    aprovados: number;
    rejeitados: number;
    valorTotalPendente: number;
  }> {
    try {
      const { data, error } = await rhSupabase
        .from('rh.equipment_rental_approvals')
        .select('status, valor_aprovado')
        .eq('company_id', this.companyId);

      if (error) {
        console.error('Erro ao buscar estatísticas:', error);
        throw error;
      }

      const stats = {
        total: data?.length || 0,
        pendentes: 0,
        aprovados: 0,
        rejeitados: 0,
        valorTotalPendente: 0
      };

      data?.forEach(approval => {
        switch (approval.status) {
          case 'pendente':
            stats.pendentes++;
            stats.valorTotalPendente += Number(approval.valor_aprovado || 0);
            break;
          case 'aprovado':
            stats.aprovados++;
            break;
          case 'rejeitado':
            stats.rejeitados++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Erro no EquipmentRentalApprovalService.getApprovalStats:', error);
      throw error;
    }
  }
}
