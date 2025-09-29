import { useState, useEffect } from 'react';
import { rhSupabase } from '@/integrations/supabase/client';
import {
  EquipmentRental,
  EquipmentRentalInsert,
  EquipmentRentalUpdate,
  EquipmentRentalWithEmployee,
  EquipmentRentalWithPayments,
  EquipmentRentalStats,
  EquipmentRentalFilters,
  EquipmentRentalPayment,
  EquipmentRentalPaymentInsert,
  EquipmentRentalPaymentUpdate,
  EquipmentRentalPaymentFilters
} from '@/integrations/supabase/rh-equipment-rental-types';

export function useEquipmentRental(companyId: string) {
  const [equipments, setEquipments] = useState<EquipmentRentalWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar todos os equipamentos locados
  const fetchEquipments = async (filters?: EquipmentRentalFilters) => {
    try {
      setLoading(true);
      setError(null);

      let query = rhSupabase
        .from('equipment_rentals')
        .select(`
          *,
          employee:employees!equipment_rentals_employee_id_fkey(
            id,
            nome,
            cpf
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (filters?.employee_id) {
        query = query.eq('employee_id', filters.employee_id);
      }
      if (filters?.equipment_type) {
        query = query.eq('equipment_type', filters.equipment_type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.start_date_from) {
        query = query.gte('start_date', filters.start_date_from);
      }
      if (filters?.start_date_to) {
        query = query.lte('start_date', filters.start_date_to);
      }
      if (filters?.monthly_value_min) {
        query = query.gte('monthly_value', filters.monthly_value_min);
      }
      if (filters?.monthly_value_max) {
        query = query.lte('monthly_value', filters.monthly_value_max);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const formattedData = data?.map(item => ({
        ...item,
        employee: {
          id: item.employee.id,
          name: item.employee.nome,
          cpf: item.employee.cpf
        }
      })) || [];

      setEquipments(formattedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar equipamentos');
    } finally {
      setLoading(false);
    }
  };

  // Buscar equipamento com pagamentos
  const fetchEquipmentWithPayments = async (equipmentId: string): Promise<EquipmentRentalWithPayments | null> => {
    try {
      const { data, error } = await rhSupabase
        .from('equipment_rentals')
        .select(`
          *,
          employee:employees!equipment_rentals_employee_id_fkey(
            id,
            nome,
            cpf
          ),
          payments:equipment_rental_payments(*)
        `)
        .eq('id', equipmentId)
        .eq('company_id', companyId)
        .single();

      if (error) throw error;

      const totalPaid = data.payments
        ?.filter((p: EquipmentRentalPayment) => p.status === 'paid')
        .reduce((sum: number, p: EquipmentRentalPayment) => sum + p.amount, 0) || 0;

      const pendingAmount = data.payments
        ?.filter((p: EquipmentRentalPayment) => p.status === 'pending')
        .reduce((sum: number, p: EquipmentRentalPayment) => sum + p.amount, 0) || 0;

      return {
        ...data,
        employee: {
          id: data.employee.id,
          name: data.employee.nome,
          cpf: data.employee.cpf
        },
        payments: data.payments || [],
        total_paid: totalPaid,
        pending_amount: pendingAmount
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar equipamento');
      return null;
    }
  };

  // Criar novo equipamento
  const createEquipment = async (equipment: EquipmentRentalInsert) => {
    try {
      setError(null);
      const { data, error } = await rhSupabase
        .from('equipment_rentals')
        .insert(equipment)
        .select()
        .single();

      if (error) throw error;

      // Recarregar lista
      await fetchEquipments();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar equipamento');
      throw err;
    }
  };

  // Atualizar equipamento
  const updateEquipment = async (id: string, updates: EquipmentRentalUpdate) => {
    try {
      setError(null);
      const { data, error } = await rhSupabase
        .from('equipment_rentals')
        .update(updates)
        .eq('id', id)
        .eq('company_id', companyId)
        .select()
        .single();

      if (error) throw error;

      // Recarregar lista
      await fetchEquipments();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar equipamento');
      throw err;
    }
  };

  // Deletar equipamento
  const deleteEquipment = async (id: string) => {
    try {
      setError(null);
      const { error } = await rhSupabase
        .from('equipment_rentals')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);

      if (error) throw error;

      // Recarregar lista
      await fetchEquipments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar equipamento');
      throw err;
    }
  };

  // Buscar estatísticas
  const fetchStats = async (): Promise<EquipmentRentalStats | null> => {
    try {
      const { data: equipments, error: equipmentsError } = await rhSupabase
        .from('equipment_rentals')
        .select('equipment_type, monthly_value, status')
        .eq('company_id', companyId);

      if (equipmentsError) throw equipmentsError;

      const { data: payments, error: paymentsError } = await rhSupabase
        .from('equipment_rental_payments')
        .select('status, amount')
        .eq('company_id', companyId);

      if (paymentsError) throw paymentsError;

      const totalEquipments = equipments?.length || 0;
      const activeEquipments = equipments?.filter(e => e.status === 'active').length || 0;
      const totalMonthlyValue = equipments
        ?.filter(e => e.status === 'active')
        .reduce((sum, e) => sum + e.monthly_value, 0) || 0;

      const equipmentsByType = {
        vehicle: equipments?.filter(e => e.equipment_type === 'vehicle').length || 0,
        computer: equipments?.filter(e => e.equipment_type === 'computer').length || 0,
        phone: equipments?.filter(e => e.equipment_type === 'phone').length || 0,
        other: equipments?.filter(e => e.equipment_type === 'other').length || 0
      };

      const pendingPayments = payments?.filter(p => p.status === 'pending').length || 0;
      const overduePayments = 0; // Implementar lógica de vencimento

      return {
        total_equipments: totalEquipments,
        active_equipments: activeEquipments,
        total_monthly_value: totalMonthlyValue,
        equipments_by_type: equipmentsByType,
        pending_payments: pendingPayments,
        overdue_payments: overduePayments
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar estatísticas');
      return null;
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchEquipments();
    }
  }, [companyId]);

  return {
    equipments,
    loading,
    error,
    fetchEquipments,
    fetchEquipmentWithPayments,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    fetchStats
  };
}

// Hook específico para pagamentos
export function useEquipmentRentalPayments(companyId: string) {
  const [payments, setPayments] = useState<EquipmentRentalPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async (filters?: EquipmentRentalPaymentFilters) => {
    try {
      setLoading(true);
      setError(null);

      let query = rhSupabase
        .from('equipment_rental_payments')
        .select(`
          *,
          equipment_rental:equipment_rentals!equipment_rental_payments_equipment_rental_id_fkey(
            id,
            equipment_name,
            equipment_type,
            monthly_value
          )
        `)
        .eq('company_id', companyId)
        .order('payment_month', { ascending: false });

      if (filters?.equipment_rental_id) {
        query = query.eq('equipment_rental_id', filters.equipment_rental_id);
      }
      if (filters?.payment_month) {
        query = query.eq('payment_month', filters.payment_month);
      }
      if (filters?.payment_year) {
        query = query.eq('payment_year', filters.payment_year);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.payment_date_from) {
        query = query.gte('payment_date', filters.payment_date_from);
      }
      if (filters?.payment_date_to) {
        query = query.lte('payment_date', filters.payment_date_to);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setPayments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar pagamentos');
    } finally {
      setLoading(false);
    }
  };

  const createPayment = async (payment: EquipmentRentalPaymentInsert) => {
    try {
      setError(null);
      const { data, error } = await rhSupabase
        .from('equipment_rental_payments')
        .insert(payment)
        .select()
        .single();

      if (error) throw error;

      await fetchPayments();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar pagamento');
      throw err;
    }
  };

  const updatePayment = async (id: string, updates: EquipmentRentalPaymentUpdate) => {
    try {
      setError(null);
      const { data, error } = await rhSupabase
        .from('equipment_rental_payments')
        .update(updates)
        .eq('id', id)
        .eq('company_id', companyId)
        .select()
        .single();

      if (error) throw error;

      await fetchPayments();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar pagamento');
      throw err;
    }
  };

  const deletePayment = async (id: string) => {
    try {
      setError(null);
      const { error } = await rhSupabase
        .from('equipment_rental_payments')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);

      if (error) throw error;

      await fetchPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar pagamento');
      throw err;
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchPayments();
    }
  }, [companyId]);

  return {
    payments,
    loading,
    error,
    fetchPayments,
    createPayment,
    updatePayment,
    deletePayment
  };
}
