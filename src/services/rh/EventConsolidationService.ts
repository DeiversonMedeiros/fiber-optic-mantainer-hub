import { rhSupabase, coreSupabase } from '@/integrations/supabase/client';

// Interfaces para consolidação de eventos
export interface PayrollEvent {
  id: string;
  company_id: string;
  employee_id: string;
  period: string;
  event_type: 'time_record' | 'benefit' | 'absence' | 'allowance' | 'overtime' | 'manual' | 'calculation';
  event_source: 'time_records' | 'benefits' | 'absences' | 'manual' | 'calculation';
  event_data: Record<string, any>;
  calculated_value: number;
  base_value: number;
  multiplier: number;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  approved_by?: string;
  approved_at?: string;
  processed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface PayrollEventInsert {
  company_id: string;
  employee_id: string;
  period: string;
  event_type: 'time_record' | 'benefit' | 'absence' | 'allowance' | 'overtime' | 'manual' | 'calculation';
  event_source: 'time_records' | 'benefits' | 'absences' | 'manual' | 'calculation';
  event_data: Record<string, any>;
  calculated_value?: number;
  base_value?: number;
  multiplier?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'processed';
  notes?: string;
  created_by?: string;
  updated_by?: string;
}

export interface ConsolidationConfig {
  id: string;
  company_id: string;
  config_type: 'time_records' | 'benefits' | 'absences' | 'allowances';
  config_data: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface ConsolidationResult {
  period: string;
  total_events: number;
  processed_events: number;
  error_events: number;
  events: PayrollEvent[];
  errors: string[];
}

export class EventConsolidationService {
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  /**
   * Consolida todos os eventos de folha para um período
   */
  async consolidatePayrollEvents(
    period: string, 
    employeeIds?: string[]
  ): Promise<ConsolidationResult> {
    try {
      console.log(`🔄 Iniciando consolidação de eventos para período ${period}`);
      
      const result: ConsolidationResult = {
        period,
        total_events: 0,
        processed_events: 0,
        error_events: 0,
        events: [],
        errors: []
      };

      // 1. Consolidar eventos de controle de ponto
      const timeRecordEvents = await this.consolidateTimeRecordEvents(period, employeeIds);
      result.events.push(...timeRecordEvents);
      result.processed_events += timeRecordEvents.length;

      // 2. Consolidar eventos de benefícios
      const benefitEvents = await this.consolidateBenefitEvents(period, employeeIds);
      result.events.push(...benefitEvents);
      result.processed_events += benefitEvents.length;

      // 3. Consolidar eventos de ausências
      const absenceEvents = await this.consolidateAbsenceEvents(period, employeeIds);
      result.events.push(...absenceEvents);
      result.processed_events += absenceEvents.length;

      // 4. Consolidar eventos de adicionais
      const allowanceEvents = await this.consolidateAllowanceEvents(period, employeeIds);
      result.events.push(...allowanceEvents);
      result.processed_events += allowanceEvents.length;

      // 5. Validar eventos consolidados
      const validationResult = await this.validateConsolidatedEvents(result.events);
      result.error_events = validationResult.errors.length;
      result.errors.push(...validationResult.errors);

      result.total_events = result.events.length;

      console.log(`✅ Consolidação concluída: ${result.processed_events} eventos processados, ${result.error_events} erros`);

      return result;

    } catch (error) {
      console.error('❌ Erro na consolidação de eventos:', error);
      throw error;
    }
  }

  /**
   * Consolida eventos de controle de ponto
   */
  private async consolidateTimeRecordEvents(
    period: string, 
    employeeIds?: string[]
  ): Promise<PayrollEvent[]> {
    try {
      console.log('🕐 Consolidando eventos de controle de ponto...');

      // Buscar registros de ponto do período
      let query = rhSupabase
        .from('time_records')
        .select(`
          *,
          employee:employees!time_records_employee_id_fkey(
            id,
            nome,
            matricula
          )
        `)
        .eq('company_id', this.companyId)
        .gte('data', `${period}-01`)
        .lte('data', `${period}-31`);

      if (employeeIds && employeeIds.length > 0) {
        query = query.in('employee_id', employeeIds);
      }

      const { data: timeRecords, error } = await query;

      if (error) throw error;

      const events: PayrollEvent[] = [];

      for (const record of timeRecords || []) {
        // Calcular horas trabalhadas
        const workedHours = this.calculateWorkedHours(
          record.hora_entrada,
          record.hora_saida,
          record.intervalo_inicio,
          record.intervalo_fim
        );

        // Calcular horas extras (assumindo 8h por dia)
        const regularHours = 8;
        const overtimeHours = Math.max(0, workedHours - regularHours);

        // Criar evento de horas regulares
        if (workedHours > 0) {
          const regularEvent: PayrollEventInsert = {
            company_id: this.companyId,
            employee_id: record.employee_id,
            period,
            event_type: 'time_record',
            event_source: 'time_records',
            event_data: {
              date: record.data,
              check_in: record.hora_entrada,
              check_out: record.hora_saida,
              break_start: record.intervalo_inicio,
              break_end: record.intervalo_fim,
              worked_hours: workedHours,
              is_holiday: record.tipo === 'feriado',
              is_weekend: this.isWeekend(record.data),
              notes: record.justificativa
            },
            calculated_value: workedHours,
            base_value: regularHours,
            multiplier: 1.0,
            status: 'pending'
          };

          const { data: createdEvent, error: createError } = await rhSupabase
            .from('payroll_events')
            .insert(regularEvent)
            .select()
            .single();

          if (!createError && createdEvent) {
            events.push(createdEvent);
          }
        }

        // Criar evento de horas extras
        if (overtimeHours > 0) {
          const overtimeEvent: PayrollEventInsert = {
            company_id: this.companyId,
            employee_id: record.employee_id,
            period,
            event_type: 'overtime',
            event_source: 'time_records',
            event_data: {
              date: record.data,
              overtime_hours: overtimeHours,
              regular_hours: regularHours,
              total_hours: workedHours,
              overtime_rate: 1.5 // 50% adicional
            },
            calculated_value: overtimeHours,
            base_value: overtimeHours,
            multiplier: 1.5,
            status: 'pending'
          };

          const { data: createdEvent, error: createError } = await rhSupabase
            .from('payroll_events')
            .insert(overtimeEvent)
            .select()
            .single();

          if (!createError && createdEvent) {
            events.push(createdEvent);
          }
        }
      }

      console.log(`✅ ${events.length} eventos de controle de ponto consolidados`);
      return events;

    } catch (error) {
      console.error('❌ Erro ao consolidar eventos de controle de ponto:', error);
      return [];
    }
  }

  /**
   * Consolida eventos de benefícios
   */
  private async consolidateBenefitEvents(
    period: string, 
    employeeIds?: string[]
  ): Promise<PayrollEvent[]> {
    try {
      console.log('🎁 Consolidando eventos de benefícios...');

      // Buscar benefícios ativos dos funcionários
      let query = rhSupabase
        .from('employee_benefits')
        .select(`
          *,
          employee:employees!employee_benefits_employee_id_fkey(
            id,
            nome,
            matricula
          ),
          benefit:benefits!employee_benefits_benefit_id_fkey(
            id,
            nome,
            tipo,
            valor,
            percentual
          )
        `)
        .eq('company_id', this.companyId)
        .eq('is_active', true)
        .lte('data_inicio', `${period}-31`)
        .or(`data_fim.is.null,data_fim.gte.${period}-01`);

      if (employeeIds && employeeIds.length > 0) {
        query = query.in('employee_id', employeeIds);
      }

      const { data: employeeBenefits, error } = await query;

      if (error) throw error;

      const events: PayrollEvent[] = [];

      for (const empBenefit of employeeBenefits || []) {
        // Calcular valor do benefício
        let calculatedValue = 0;
        
        if (empBenefit.benefit.tipo === 'valor_fixo') {
          calculatedValue = empBenefit.benefit.valor || 0;
        } else if (empBenefit.benefit.tipo === 'percentual') {
          calculatedValue = (empBenefit.salario_base || 0) * ((empBenefit.benefit.percentual || 0) / 100);
        }

        const benefitEvent: PayrollEventInsert = {
          company_id: this.companyId,
          employee_id: empBenefit.employee_id,
          period,
          event_type: 'benefit',
          event_source: 'benefits',
          event_data: {
            benefit_id: empBenefit.benefit_id,
            benefit_name: empBenefit.benefit.nome,
            benefit_type: empBenefit.benefit.tipo,
            base_salary: empBenefit.salario_base,
            benefit_value: empBenefit.valor_beneficio,
            start_date: empBenefit.data_inicio,
            end_date: empBenefit.data_fim
          },
          calculated_value: calculatedValue,
          base_value: empBenefit.salario_base || 0,
          multiplier: empBenefit.benefit.percentual ? (empBenefit.benefit.percentual / 100) : 1.0,
          status: 'pending'
        };

        const { data: createdEvent, error: createError } = await rhSupabase
          .from('payroll_events')
          .insert(benefitEvent)
          .select()
          .single();

        if (!createError && createdEvent) {
          events.push(createdEvent);
        }
      }

      console.log(`✅ ${events.length} eventos de benefícios consolidados`);
      return events;

    } catch (error) {
      console.error('❌ Erro ao consolidar eventos de benefícios:', error);
      return [];
    }
  }

  /**
   * Consolida eventos de ausências
   */
  private async consolidateAbsenceEvents(
    period: string, 
    employeeIds?: string[]
  ): Promise<PayrollEvent[]> {
    try {
      console.log('🚫 Consolidando eventos de ausências...');

      // Buscar ausências do período
      let query = rhSupabase
        .from('employee_absences')
        .select(`
          *,
          employee:employees!employee_absences_employee_id_fkey(
            id,
            nome,
            matricula
          ),
          absence_type:absence_types!employee_absences_absence_type_id_fkey(
            id,
            codigo,
            descricao
          )
        `)
        .eq('company_id', this.companyId)
        .gte('data_inicio', `${period}-01`)
        .lte('data_fim', `${period}-31`);

      if (employeeIds && employeeIds.length > 0) {
        query = query.in('employee_id', employeeIds);
      }

      const { data: absences, error } = await query;

      if (error) throw error;

      const events: PayrollEvent[] = [];

      for (const absence of absences || []) {
        // Calcular dias de ausência
        const startDate = new Date(absence.data_inicio);
        const endDate = new Date(absence.data_fim);
        const absenceDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        const absenceEvent: PayrollEventInsert = {
          company_id: this.companyId,
          employee_id: absence.employee_id,
          period,
          event_type: 'absence',
          event_source: 'absences',
          event_data: {
            absence_type_id: absence.absence_type_id,
            absence_type_name: absence.absence_type?.descricao,
            start_date: absence.data_inicio,
            end_date: absence.data_fim,
            absence_days: absenceDays,
            reason: absence.motivo,
            medical_certificate: absence.atestado_medico
          },
          calculated_value: -absenceDays, // Valor negativo para descontos
          base_value: absenceDays,
          multiplier: -1.0, // Multiplicador negativo para descontos
          status: 'pending'
        };

        const { data: createdEvent, error: createError } = await rhSupabase
          .from('payroll_events')
          .insert(absenceEvent)
          .select()
          .single();

        if (!createError && createdEvent) {
          events.push(createdEvent);
        }
      }

      console.log(`✅ ${events.length} eventos de ausências consolidados`);
      return events;

    } catch (error) {
      console.error('❌ Erro ao consolidar eventos de ausências:', error);
      return [];
    }
  }

  /**
   * Consolida eventos de adicionais
   */
  private async consolidateAllowanceEvents(
    period: string, 
    employeeIds?: string[]
  ): Promise<PayrollEvent[]> {
    try {
      console.log('💰 Consolidando eventos de adicionais...');

      // Buscar adicionais dos funcionários
      let query = rhSupabase
        .from('employee_allowances')
        .select(`
          *,
          employee:employees!employee_allowances_employee_id_fkey(
            id,
            nome,
            matricula
          ),
          allowance_type:allowance_types!employee_allowances_allowance_type_id_fkey(
            id,
            codigo,
            descricao
          )
        `)
        .eq('company_id', this.companyId)
        .eq('is_active', true)
        .lte('data_inicio', `${period}-31`)
        .or(`data_fim.is.null,data_fim.gte.${period}-01`);

      if (employeeIds && employeeIds.length > 0) {
        query = query.in('employee_id', employeeIds);
      }

      const { data: allowances, error } = await query;

      if (error) throw error;

      const events: PayrollEvent[] = [];

      for (const allowance of allowances || []) {
        const allowanceEvent: PayrollEventInsert = {
          company_id: this.companyId,
          employee_id: allowance.employee_id,
          period,
          event_type: 'allowance',
          event_source: 'manual',
          event_data: {
            allowance_type_id: allowance.allowance_type_id,
            allowance_type_name: allowance.allowance_type?.descricao,
            value: allowance.valor,
            percentage: allowance.percentual,
            start_date: allowance.data_inicio,
            end_date: allowance.data_fim,
            notes: allowance.observacoes
          },
          calculated_value: allowance.valor || 0,
          base_value: allowance.valor || 0,
          multiplier: allowance.percentual ? (allowance.percentual / 100) : 1.0,
          status: 'pending'
        };

        const { data: createdEvent, error: createError } = await rhSupabase
          .from('payroll_events')
          .insert(allowanceEvent)
          .select()
          .single();

        if (!createError && createdEvent) {
          events.push(createdEvent);
        }
      }

      console.log(`✅ ${events.length} eventos de adicionais consolidados`);
      return events;

    } catch (error) {
      console.error('❌ Erro ao consolidar eventos de adicionais:', error);
      return [];
    }
  }

  /**
   * Valida eventos consolidados
   */
  private async validateConsolidatedEvents(events: PayrollEvent[]): Promise<{ errors: string[] }> {
    const errors: string[] = [];

    // Validações básicas
    for (const event of events) {
      // Validar se o funcionário existe
      if (!event.employee_id) {
        errors.push(`Evento ${event.id}: Funcionário não informado`);
      }

      // Validar valores negativos para proventos
      if (event.event_type !== 'absence' && event.calculated_value < 0) {
        errors.push(`Evento ${event.id}: Valor negativo inválido para ${event.event_type}`);
      }

      // Validar multiplicador
      if (event.multiplier < 0 && event.event_type !== 'absence') {
        errors.push(`Evento ${event.id}: Multiplicador negativo inválido para ${event.event_type}`);
      }
    }

    return { errors };
  }

  /**
   * Calcula horas trabalhadas
   */
  private calculateWorkedHours(
    startTime: string,
    endTime: string,
    breakStart?: string,
    breakEnd?: string
  ): number {
    if (!startTime || !endTime) return 0;

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    let totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    // Subtrair intervalo se existir
    if (breakStart && breakEnd) {
      const breakStartTime = new Date(`2000-01-01T${breakStart}`);
      const breakEndTime = new Date(`2000-01-01T${breakEnd}`);
      const breakMinutes = (breakEndTime.getTime() - breakStartTime.getTime()) / (1000 * 60);
      totalMinutes -= breakMinutes;
    }

    return Math.max(0, totalMinutes / 60);
  }

  /**
   * Verifica se é fim de semana
   */
  private isWeekend(dateString: string): boolean {
    const date = new Date(dateString);
    const day = date.getDay();
    return day === 0 || day === 6; // Domingo ou Sábado
  }

  /**
   * Busca eventos consolidados para um período
   */
  async getConsolidatedEvents(
    period: string,
    employeeId?: string,
    eventType?: string,
    status?: string
  ): Promise<PayrollEvent[]> {
    try {
      let query = rhSupabase
        .from('payroll_events')
        .select(`
          *,
          employee:employees!payroll_events_employee_id_fkey(
            id,
            nome,
            matricula
          )
        `)
        .eq('company_id', this.companyId)
        .eq('period', period)
        .order('created_at', { ascending: false });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data: events, error } = await query;

      if (error) throw error;

      return events || [];

    } catch (error) {
      console.error('❌ Erro ao buscar eventos consolidados:', error);
      return [];
    }
  }

  /**
   * Aprova eventos consolidados
   */
  async approveEvents(eventIds: string[], approvedBy: string): Promise<boolean> {
    try {
      const { error } = await rhSupabase
        .from('payroll_events')
        .update({
          status: 'approved',
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', eventIds);

      if (error) throw error;

      return true;

    } catch (error) {
      console.error('❌ Erro ao aprovar eventos:', error);
      return false;
    }
  }

  /**
   * Rejeita eventos consolidados
   */
  async rejectEvents(eventIds: string[], rejectedBy: string, reason: string): Promise<boolean> {
    try {
      const { error } = await rhSupabase
        .from('payroll_events')
        .update({
          status: 'rejected',
          approved_by: rejectedBy,
          approved_at: new Date().toISOString(),
          notes: reason,
          updated_at: new Date().toISOString()
        })
        .in('id', eventIds);

      if (error) throw error;

      return true;

    } catch (error) {
      console.error('❌ Erro ao rejeitar eventos:', error);
      return false;
    }
  }
}
