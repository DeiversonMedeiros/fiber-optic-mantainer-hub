import { rhSupabase } from '@/integrations/supabase/client';

// Interfaces para o serviço de desconto por ausência
export interface AbsenceDay {
  date: string;
  type: 'no_time_record' | 'medical_certificate' | 'vacation' | 'license';
  description: string;
  is_justified: boolean;
}

export interface EquipmentRentalAbsenceCalculation {
  equipment_rental_id: string;
  employee_id: string;
  employee_name: string;
  equipment_name: string;
  equipment_type: string;
  period: string; // YYYY-MM
  monthly_value: number;
  daily_value: number;
  absence_days: AbsenceDay[];
  total_absence_days: number;
  total_discount: number;
  final_value: number;
  calculation_details: {
    original_value: number;
    daily_rate: number;
    absence_discount: number;
    final_value: number;
  };
}

export interface AbsenceCalculationFilters {
  employee_id?: string;
  period?: string;
  equipment_type?: 'vehicle' | 'computer' | 'phone' | 'other';
  include_justified?: boolean;
}

export class EquipmentRentalAbsenceService {
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  /**
   * Calcula desconto por ausência para todos os equipamentos de um período
   * Agora considera a escala de trabalho de cada funcionário
   */
  async calculateAbsenceDiscounts(
    period: string,
    filters?: AbsenceCalculationFilters
  ): Promise<EquipmentRentalAbsenceCalculation[]> {
    try {
      console.log(`🧮 Calculando descontos por ausência para período ${period}`);
      console.debug('[AbsenceService] calculateAbsenceDiscounts:params', { period, filters, companyId: this.companyId });

      const [year, month] = period.split('-');

      // Usar função RPC do Supabase para cálculo otimizado com escalas flexíveis
      const { data, error } = await rhSupabase.rpc(
        'calculate_all_equipment_rental_absence_discounts',
        {
          p_company_id: this.companyId,
          p_year: parseInt(year),
          p_month: parseInt(month)
        }
      );

      if (error) {
        console.error('[AbsenceService] calculateAbsenceDiscounts:rpc_error', error);
        throw error;
      }

      // Converter dados da RPC para formato da interface
      const calculations: EquipmentRentalAbsenceCalculation[] = (data || []).map((item: any) => ({
        equipment_rental_id: item.equipment_rental_id,
        employee_id: item.employee_id,
        employee_name: item.employee_name || `Funcionário ${item.employee_id}`,
        equipment_name: item.equipment_name || `Equipamento ${item.equipment_rental_id}`,
        equipment_type: item.equipment_type || 'outros',
        period: item.period,
        monthly_value: item.monthly_value,
        daily_value: item.daily_value,
        absence_days: this.parseAbsenceDetails(item.absence_details),
        total_absence_days: item.total_absence_days,
        total_discount: item.total_discount,
        final_value: item.final_value,
        calculation_details: {
          original_value: item.monthly_value,
          daily_rate: item.daily_value,
          absence_discount: item.total_discount,
          final_value: item.final_value
        }
      }));

      // Aplicar filtros se especificados
      let filteredCalculations = calculations;
      if (filters?.employee_id) {
        filteredCalculations = filteredCalculations.filter(calc => calc.employee_id === filters.employee_id);
      }
      if (filters?.equipment_type) {
        filteredCalculations = filteredCalculations.filter(calc => calc.equipment_type === filters.equipment_type);
      }

      console.log(`✅ Calculados ${filteredCalculations.length} descontos por ausência`);
      console.debug('[AbsenceService] calculateAbsenceDiscounts:sample', filteredCalculations?.[0]);
      return filteredCalculations;

    } catch (error) {
      console.error('❌ Erro ao calcular descontos por ausência:', error);
      throw error;
    }
  }

  /**
   * Calcula desconto por ausência para um equipamento específico
   * Agora considera a escala de trabalho do funcionário
   */
  async calculateEquipmentAbsenceDiscount(
    equipmentId: string,
    employeeId: string,
    period: string,
    monthlyValue: number
  ): Promise<EquipmentRentalAbsenceCalculation | null> {
    try {
      // Usar função RPC do Supabase para cálculo otimizado com escala flexível
      const { data, error } = await rhSupabase.rpc(
        'calculate_equipment_rental_absence_discount',
        {
          p_equipment_rental_id: equipmentId,
          p_company_id: this.companyId,
          p_year: parseInt(period.split('-')[0]),
          p_month: parseInt(period.split('-')[1])
        }
      );

      if (error) {
        console.error('[AbsenceService] calculateEquipmentAbsenceDiscount:rpc_error', error);
        throw error;
      }
      if (!data || data.length === 0) return null;

      const item = data[0];

      const calculation: EquipmentRentalAbsenceCalculation = {
        equipment_rental_id: item.equipment_rental_id,
        employee_id: item.employee_id,
        employee_name: item.employee_name || `Funcionário ${item.employee_id}`,
        equipment_name: item.equipment_name || `Equipamento ${item.equipment_rental_id}`,
        equipment_type: item.equipment_type || 'outros',
        period: item.period,
        monthly_value: item.monthly_value,
        daily_value: item.daily_value,
        absence_days: this.parseAbsenceDetails(item.absence_details),
        total_absence_days: item.total_absence_days,
        total_discount: item.total_discount,
        final_value: item.final_value,
        calculation_details: {
          original_value: item.monthly_value,
          daily_rate: item.daily_value,
          absence_discount: item.total_discount,
          final_value: item.final_value
        }
      };

      return calculation;

    } catch (error) {
      console.error(`❌ Erro ao calcular desconto para equipamento ${equipmentId}:`, error);
      return null;
    }
  }

  /**
   * Busca dias de ausência de um funcionário em um período
   */
  private async getEmployeeAbsenceDays(
    employeeId: string,
    period: string
  ): Promise<AbsenceDay[]> {
    const absenceDays: AbsenceDay[] = [];
    const [year, month] = period.split('-');
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;

    try {
      // 1. Buscar dias sem registro de ponto
      const noTimeRecordDays = await this.getNoTimeRecordDays(employeeId, startDate, endDate);
      absenceDays.push(...noTimeRecordDays);

      // 2. Buscar dias com atestado médico
      const medicalCertificateDays = await this.getMedicalCertificateDays(employeeId, startDate, endDate);
      absenceDays.push(...medicalCertificateDays);

      // 3. Buscar dias de férias
      const vacationDays = await this.getVacationDays(employeeId, startDate, endDate);
      absenceDays.push(...vacationDays);

      // 4. Buscar dias de licença
      const licenseDays = await this.getLicenseDays(employeeId, startDate, endDate);
      absenceDays.push(...licenseDays);

      // 5. Remover duplicatas e ordenar por data
      const uniqueDays = this.removeDuplicateAbsenceDays(absenceDays);
      return uniqueDays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    } catch (error) {
      console.error('❌ Erro ao buscar dias de ausência:', error);
      return [];
    }
  }

  /**
   * Busca dias sem registro de ponto
   */
  private async getNoTimeRecordDays(
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<AbsenceDay[]> {
    try {
      // Buscar todos os dias úteis do período (excluindo fins de semana)
      const workDays = this.getWorkDaysInPeriod(startDate, endDate);
      
      // Buscar registros de ponto existentes
      const { data: timeRecords, error } = await rhSupabase
        .from('rh.time_records')
        .select('data')
        .eq('employee_id', employeeId)
        .eq('company_id', this.companyId)
        .gte('data', startDate)
        .lte('data', endDate);

      if (error) {
        console.error('[AbsenceService] generateAbsenceDiscountReport:rpc_error', error);
        throw error;
      }

      const recordedDays = new Set(timeRecords?.map(record => record.data) || []);
      
      // Encontrar dias sem registro
      const absenceDays: AbsenceDay[] = [];
      for (const workDay of workDays) {
        if (!recordedDays.has(workDay)) {
          absenceDays.push({
            date: workDay,
            type: 'no_time_record',
            description: 'Sem registro de ponto',
            is_justified: false
          });
        }
      }

      return absenceDays;

    } catch (error) {
      console.error('❌ Erro ao buscar dias sem registro de ponto:', error);
      return [];
    }
  }

  /**
   * Busca dias com atestado médico
   */
  private async getMedicalCertificateDays(
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<AbsenceDay[]> {
    try {
      const { data: certificates, error } = await rhSupabase
        .from('rh.medical_certificates')
        .select('data_inicio, data_fim, tipo, status')
        .eq('employee_id', employeeId)
        .eq('company_id', this.companyId)
        .eq('status', 'aprovado')
        .or(`and(data_inicio.lte.${endDate},data_fim.gte.${startDate})`);

      if (error) throw error;

      const absenceDays: AbsenceDay[] = [];
      
      for (const certificate of certificates || []) {
        const days = this.getDaysInRange(
          certificate.data_inicio,
          certificate.data_fim,
          startDate,
          endDate
        );
        
        for (const day of days) {
          absenceDays.push({
            date: day,
            type: 'medical_certificate',
            description: `Atestado médico - ${certificate.tipo}`,
            is_justified: true
          });
        }
      }

      return absenceDays;

    } catch (error) {
      console.error('❌ Erro ao buscar dias de atestado médico:', error);
      return [];
    }
  }

  /**
   * Busca dias de férias
   */
  private async getVacationDays(
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<AbsenceDay[]> {
    try {
      const { data: vacations, error } = await rhSupabase
        .from('rh.vacations')
        .select('data_inicio, data_fim, status')
        .eq('employee_id', employeeId)
        .eq('company_id', this.companyId)
        .eq('status', 'aprovado')
        .or(`and(data_inicio.lte.${endDate},data_fim.gte.${startDate})`);

      if (error) throw error;

      const absenceDays: AbsenceDay[] = [];
      
      for (const vacation of vacations || []) {
        const days = this.getDaysInRange(
          vacation.data_inicio,
          vacation.data_fim,
          startDate,
          endDate
        );
        
        for (const day of days) {
          absenceDays.push({
            date: day,
            type: 'vacation',
            description: 'Férias',
            is_justified: true
          });
        }
      }

      return absenceDays;

    } catch (error) {
      console.error('❌ Erro ao buscar dias de férias:', error);
      return [];
    }
  }

  /**
   * Busca dias de licença
   */
  private async getLicenseDays(
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<AbsenceDay[]> {
    try {
      // Buscar licenças em outras tabelas se existirem
      // Por enquanto, retornar array vazio
      // Implementar quando houver tabela de licenças
      return [];

    } catch (error) {
      console.error('❌ Erro ao buscar dias de licença:', error);
      return [];
    }
  }

  /**
   * Busca equipamentos ativos no período
   */
  private async getActiveEquipments(
    period: string,
    filters?: AbsenceCalculationFilters
  ) {
    try {
      let query = rhSupabase
        .from('rh.equipment_rentals')
        .select('id, employee_id, monthly_value, equipment_type')
        .eq('company_id', this.companyId)
        .eq('status', 'active');

      if (filters?.employee_id) {
        query = query.eq('employee_id', filters.employee_id);
      }

      if (filters?.equipment_type) {
        query = query.eq('equipment_type', filters.equipment_type);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('❌ Erro ao buscar equipamentos ativos:', error);
      return [];
    }
  }

  /**
   * Gera relatório de descontos por ausência
   */
  async generateAbsenceDiscountReport(
    period: string,
    filters?: AbsenceCalculationFilters
  ) {
    try {
      // Usar função RPC do Supabase para relatório otimizado
      const { data, error } = await rhSupabase.rpc(
        'generate_absence_discount_report',
        {
          p_company_id: this.companyId,
          p_period: period
        }
      );

      if (error) throw error;
      if (!data || data.length === 0) {
        return {
          period,
          total_equipments: 0,
          total_original_value: 0,
          total_discount: 0,
          total_final_value: 0,
          calculations: [],
          summary: {
            by_equipment_type: {},
            by_absence_type: {},
            top_employees: []
          }
        };
      }

      const reportData = data[0];
      
      // Buscar cálculos detalhados
      const calculations = await this.calculateAbsenceDiscounts(period, filters);

      const report = {
        period: reportData.period,
        total_equipments: reportData.total_equipments,
        total_original_value: reportData.total_original_value,
        total_discount: reportData.total_discount,
        total_final_value: reportData.total_final_value,
        average_discount_per_equipment: reportData.average_discount_per_equipment,
        equipment_with_discounts: reportData.equipment_with_discounts,
        calculations,
        summary: {
          by_equipment_type: reportData.summary_by_equipment_type || {},
          by_absence_type: reportData.summary_by_absence_type || {},
          top_employees: this.getTopEmployeesByDiscount(calculations)
        }
      };

      return report;

    } catch (error) {
      console.error('❌ Erro ao gerar relatório de descontos:', error);
      throw error;
    }
  }

  /**
   * Converte detalhes de ausência do JSON para array de AbsenceDay
   */
  private parseAbsenceDetails(absenceDetails: any): AbsenceDay[] {
    if (!absenceDetails || !Array.isArray(absenceDetails)) {
      return [];
    }

    return absenceDetails.map((detail: any) => ({
      date: detail.date,
      type: detail.type,
      description: detail.description,
      is_justified: detail.is_justified
    }));
  }

  // Métodos auxiliares
  private getWorkDaysInPeriod(startDate: string, endDate: string): string[] {
    const workDays: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      // Excluir fins de semana (0 = domingo, 6 = sábado)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workDays.push(date.toISOString().split('T')[0]);
      }
    }
    
    return workDays;
  }

  private getDaysInRange(
    startDate: string,
    endDate: string,
    periodStart: string,
    periodEnd: string
  ): string[] {
    const days: string[] = [];
    const start = new Date(Math.max(new Date(startDate).getTime(), new Date(periodStart).getTime()));
    const end = new Date(Math.min(new Date(endDate).getTime(), new Date(periodEnd).getTime()));
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      days.push(date.toISOString().split('T')[0]);
    }
    
    return days;
  }

  private removeDuplicateAbsenceDays(days: AbsenceDay[]): AbsenceDay[] {
    const uniqueDays = new Map<string, AbsenceDay>();
    
    for (const day of days) {
      if (!uniqueDays.has(day.date)) {
        uniqueDays.set(day.date, day);
      } else {
        // Se já existe, priorizar o tipo mais específico
        const existing = uniqueDays.get(day.date)!;
        if (this.getAbsenceTypePriority(day.type) > this.getAbsenceTypePriority(existing.type)) {
          uniqueDays.set(day.date, day);
        }
      }
    }
    
    return Array.from(uniqueDays.values());
  }

  private getAbsenceTypePriority(type: string): number {
    const priorities = {
      'medical_certificate': 4,
      'vacation': 3,
      'license': 2,
      'no_time_record': 1
    };
    return priorities[type as keyof typeof priorities] || 0;
  }

  private groupByEquipmentType(calculations: EquipmentRentalAbsenceCalculation[]) {
    // Implementar agrupamento por tipo de equipamento
    return {};
  }

  private groupByAbsenceType(calculations: EquipmentRentalAbsenceCalculation[]) {
    // Implementar agrupamento por tipo de ausência
    return {};
  }

  private getTopEmployeesByDiscount(calculations: EquipmentRentalAbsenceCalculation[]) {
    // Implementar ranking de funcionários por desconto
    return [];
  }
}
