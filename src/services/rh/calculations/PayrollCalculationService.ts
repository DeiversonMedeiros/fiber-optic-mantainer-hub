import { rhSupabase } from '@/integrations/supabase/client';

// Interfaces para cálculos de folha
export interface OvertimeCalculation {
  employeeId: string;
  period: string;
  regularHours: number;
  overtimeHours: number;
  overtimeValue: number;
  dsrValue: number;
  nightShiftHours: number;
  nightShiftValue: number;
  totalOvertimeValue: number;
}

export interface VacationCalculation {
  employeeId: string;
  period: string;
  vacationDays: number;
  vacationValue: number;
  constitutionalThird: number;
  cashAllowance: number;
  totalVacationValue: number;
}

export interface ThirteenthSalaryCalculation {
  employeeId: string;
  year: number;
  proportionalMonths: number;
  thirteenthValue: number;
  proportionalValue: number;
  totalValue: number;
}

export interface TaxCalculation {
  grossSalary: number;
  inssValue: number;
  irrfValue: number;
  fgtsValue: number;
  unionContribution: number;
  totalTaxes: number;
}

export interface AllowanceCalculation {
  employeeId: string;
  period: string;
  dangerAllowance: number;
  unhealthyAllowance: number;
  onCallAllowance: number;
  functionAllowance: number;
  totalAllowances: number;
}

export interface PLRCalculation {
  employeeId: string;
  period: string;
  baseValue: number;
  criteriaValue: number;
  totalValue: number;
}

export interface AbsenceCalculation {
  employeeId: string;
  period: string;
  absenceDays: number;
  delayMinutes: number;
  earlyLeaveMinutes: number;
  totalDiscounts: number;
}

export interface TerminationCalculation {
  employeeId: string;
  terminationDate: string;
  terminationType: 'sem_justa_causa' | 'com_justa_causa' | 'aposentadoria';
  noticeValue: number;
  vacationValue: number;
  thirteenthValue: number;
  fgtsValue: number;
  totalValue: number;
}

export class PayrollCalculationService {
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  /**
   * Calcula horas extras de um funcionário em um período
   */
  async calculateOvertime(
    employeeId: string, 
    period: string
  ): Promise<OvertimeCalculation> {
    try {
      // Buscar registros de ponto do período
      const { data: timeRecords, error: timeError } = await rhSupabase
        .from('rh.time_records')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('company_id', this.companyId)
        .gte('data', `${period}-01`)
        .lte('data', `${period}-31`);

      if (timeError) throw timeError;

      // Buscar configuração de jornada do funcionário
      const { data: contract, error: contractError } = await rhSupabase
        .from('rh.employment_contracts')
        .select(`
          *,
          work_schedule:work_schedules(*)
        `)
        .eq('employee_id', employeeId)
        .eq('company_id', this.companyId)
        .eq('is_active', true)
        .single();

      if (contractError) throw contractError;

      const workSchedule = contract.work_schedule;
      if (!workSchedule) {
        throw new Error('Jornada de trabalho não encontrada');
      }

      // Calcular horas trabalhadas vs horas contratuais
      const regularHoursPerDay = this.calculateDailyHours(workSchedule);
      const totalRegularHours = timeRecords.length * regularHoursPerDay;
      
      let totalWorkedHours = 0;
      let totalOvertimeHours = 0;
      let totalNightShiftHours = 0;

      // Processar cada registro de ponto
      for (const record of timeRecords) {
        if (record.hora_entrada && record.hora_saida) {
          const workedHours = this.calculateWorkedHours(
            record.hora_entrada,
            record.hora_saida,
            record.intervalo_inicio,
            record.intervalo_fim
          );

          totalWorkedHours += workedHours;

          // Calcular horas extras
          if (workedHours > regularHoursPerDay) {
            totalOvertimeHours += (workedHours - regularHoursPerDay);
          }

          // Calcular adicional noturno (22h às 6h)
          const nightShiftHours = this.calculateNightShiftHours(
            record.hora_entrada,
            record.hora_saida
          );
          totalNightShiftHours += nightShiftHours;
        }
      }

      // Buscar salário base do funcionário
      const { data: employee, error: employeeError } = await rhSupabase
        .from('rh.employees')
        .select('*')
        .eq('id', employeeId)
        .eq('company_id', this.companyId)
        .single();

      if (employeeError) throw employeeError;

      // Buscar contrato ativo para pegar salário
      const { data: activeContract, error: activeContractError } = await rhSupabase
        .from('rh.employment_contracts')
        .select('salario_base')
        .eq('employee_id', employeeId)
        .eq('company_id', this.companyId)
        .eq('is_active', true)
        .single();

      if (activeContractError) throw activeContractError;

      const baseSalary = activeContract.salario_base || 0;
      const hourlyRate = baseSalary / 220; // 220 horas mensais padrão

      // Calcular valores
      const overtimeValue = totalOvertimeHours * hourlyRate * 1.5; // 50% adicional
      const dsrValue = this.calculateDSR(totalOvertimeHours, timeRecords.length);
      const nightShiftValue = totalNightShiftHours * hourlyRate * 0.2; // 20% adicional noturno
      const totalOvertimeValue = overtimeValue + dsrValue + nightShiftValue;

      return {
        employeeId,
        period,
        regularHours: totalRegularHours,
        overtimeHours: totalOvertimeHours,
        overtimeValue,
        dsrValue,
        nightShiftHours: totalNightShiftHours,
        nightShiftValue,
        totalOvertimeValue
      };

    } catch (error) {
      console.error('Erro ao calcular horas extras:', error);
      throw error;
    }
  }

  /**
   * Calcula DSR (Descanso Semanal Remunerado) sobre horas extras
   */
  private calculateDSR(overtimeHours: number, workDays: number): number {
    // DSR = (horas extras / dias úteis) * domingos e feriados
    const sundaysAndHolidays = 4; // Aproximação mensal
    return (overtimeHours / workDays) * sundaysAndHolidays;
  }

  /**
   * Calcula horas trabalhadas em um dia
   */
  private calculateWorkedHours(
    startTime: string,
    endTime: string,
    breakStart?: string,
    breakEnd?: string
  ): number {
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

    return totalMinutes / 60; // Converter para horas
  }

  /**
   * Calcula horas noturnas (22h às 6h)
   */
  private calculateNightShiftHours(startTime: string, endTime: string): number {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    // Lógica simplificada - em produção seria mais complexa
    const startHour = start.getHours();
    const endHour = end.getHours();
    
    if (startHour >= 22 || endHour <= 6) {
      return this.calculateWorkedHours(startTime, endTime);
    }
    
    return 0;
  }

  /**
   * Calcula horas diárias baseadas na jornada
   */
  private calculateDailyHours(workSchedule: any): number {
    if (!workSchedule.hora_entrada || !workSchedule.hora_saida) {
      return 8; // Padrão 8 horas
    }

    const start = new Date(`2000-01-01T${workSchedule.hora_entrada}`);
    const end = new Date(`2000-01-01T${workSchedule.hora_saida}`);
    
    let totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    // Subtrair intervalo se existir
    if (workSchedule.intervalo_inicio && workSchedule.intervalo_fim) {
      const breakStart = new Date(`2000-01-01T${workSchedule.intervalo_inicio}`);
      const breakEnd = new Date(`2000-01-01T${workSchedule.intervalo_fim}`);
      const breakMinutes = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60);
      totalMinutes -= breakMinutes;
    }

    return totalMinutes / 60;
  }

  /**
   * Calcula férias proporcionais
   */
  async calculateVacation(
    employeeId: string,
    period: string
  ): Promise<VacationCalculation> {
    try {
      // Buscar dados do funcionário
      const { data: employee, error: employeeError } = await rhSupabase
        .from('rh.employees')
        .select('data_admissao')
        .eq('id', employeeId)
        .eq('company_id', this.companyId)
        .single();

      if (employeeError) throw employeeError;

      // Buscar salário base
      const { data: contract, error: contractError } = await rhSupabase
        .from('rh.employment_contracts')
        .select('salario_base')
        .eq('employee_id', employeeId)
        .eq('company_id', this.companyId)
        .eq('is_active', true)
        .single();

      if (contractError) throw contractError;

      const baseSalary = contract.salario_base || 0;
      const admissionDate = new Date(employee.data_admissao);
      const periodDate = new Date(`${period}-01`);
      
      // Calcular meses trabalhados no período
      const monthsWorked = this.calculateMonthsWorked(admissionDate, periodDate);
      
      // Férias proporcionais: 1/12 por mês trabalhado
      const vacationDays = Math.floor(monthsWorked * 2.5); // 30 dias / 12 meses
      const vacationValue = (baseSalary / 30) * vacationDays;
      const constitutionalThird = vacationValue / 3;
      const cashAllowance = 0; // Implementar lógica específica
      const totalVacationValue = vacationValue + constitutionalThird + cashAllowance;

      return {
        employeeId,
        period,
        vacationDays,
        vacationValue,
        constitutionalThird,
        cashAllowance,
        totalVacationValue
      };

    } catch (error) {
      console.error('Erro ao calcular férias:', error);
      throw error;
    }
  }

  /**
   * Calcula 13º salário
   */
  async calculateThirteenthSalary(
    employeeId: string,
    year: number
  ): Promise<ThirteenthSalaryCalculation> {
    try {
      // Buscar dados do funcionário
      const { data: employee, error: employeeError } = await rhSupabase
        .from('rh.employees')
        .select('data_admissao')
        .eq('id', employeeId)
        .eq('company_id', this.companyId)
        .single();

      if (employeeError) throw employeeError;

      // Buscar salário base
      const { data: contract, error: contractError } = await rhSupabase
        .from('rh.employment_contracts')
        .select('salario_base')
        .eq('employee_id', employeeId)
        .eq('company_id', this.companyId)
        .eq('is_active', true)
        .single();

      if (contractError) throw contractError;

      const baseSalary = contract.salario_base || 0;
      const admissionDate = new Date(employee.data_admissao);
      const yearStart = new Date(`${year}-01-01`);
      const yearEnd = new Date(`${year}-12-31`);
      
      // Calcular meses trabalhados no ano
      const monthsWorked = this.calculateMonthsWorked(
        admissionDate > yearStart ? admissionDate : yearStart,
        yearEnd
      );
      
      const thirteenthValue = baseSalary;
      const proportionalValue = (baseSalary / 12) * monthsWorked;
      const totalValue = monthsWorked >= 12 ? thirteenthValue : proportionalValue;

      return {
        employeeId,
        year,
        proportionalMonths: monthsWorked,
        thirteenthValue,
        proportionalValue,
        totalValue
      };

    } catch (error) {
      console.error('Erro ao calcular 13º salário:', error);
      throw error;
    }
  }

  /**
   * Calcula meses trabalhados entre duas datas
   */
  private calculateMonthsWorked(startDate: Date, endDate: Date): number {
    const yearDiff = endDate.getFullYear() - startDate.getFullYear();
    const monthDiff = endDate.getMonth() - startDate.getMonth();
    return yearDiff * 12 + monthDiff + 1;
  }

  /**
   * Calcula impostos (INSS, IRRF, FGTS)
   */
  async calculateTaxes(
    employeeId: string,
    grossSalary: number,
    dependents: number = 0
  ): Promise<TaxCalculation> {
    try {
      // Buscar faixas de INSS
      const { data: inssBrackets, error: inssError } = await rhSupabase
        .from('rh.inss_brackets')
        .select('*')
        .eq('company_id', this.companyId)
        .eq('is_active', true)
        .order('valor_minimo');

      if (inssError) throw inssError;

      // Buscar faixas de IRRF
      const { data: irrfBrackets, error: irrfError } = await rhSupabase
        .from('rh.irrf_brackets')
        .select('*')
        .eq('company_id', this.companyId)
        .eq('is_active', true)
        .order('valor_minimo');

      if (irrfError) throw irrfError;

      // Buscar configuração de FGTS
      const { data: fgtsConfig, error: fgtsError } = await rhSupabase
        .from('rh.fgts_config')
        .select('*')
        .eq('company_id', this.companyId)
        .eq('is_active', true)
        .single();

      if (fgtsError) throw fgtsError;

      // Calcular INSS
      const inssValue = this.calculateINSS(grossSalary, inssBrackets);
      
      // Calcular IRRF
      const irrfValue = this.calculateIRRF(grossSalary, dependents, irrfBrackets);
      
      // Calcular FGTS
      const fgtsValue = grossSalary * (fgtsConfig.aliquota / 100);
      
      // Contribuição sindical (assumindo 1% do salário)
      const unionContribution = grossSalary * 0.01;
      
      const totalTaxes = inssValue + irrfValue + fgtsValue + unionContribution;

      return {
        grossSalary,
        inssValue,
        irrfValue,
        fgtsValue,
        unionContribution,
        totalTaxes
      };

    } catch (error) {
      console.error('Erro ao calcular impostos:', error);
      throw error;
    }
  }

  /**
   * Calcula INSS baseado nas faixas
   */
  private calculateINSS(salary: number, brackets: any[]): number {
    for (const bracket of brackets) {
      if (salary >= bracket.valor_minimo && 
          (bracket.valor_maximo === null || salary <= bracket.valor_maximo)) {
        return (salary * bracket.aliquota / 100) - bracket.valor_deducao;
      }
    }
    return 0;
  }

  /**
   * Calcula IRRF baseado nas faixas
   */
  private calculateIRRF(salary: number, dependents: number, brackets: any[]): number {
    const dependentDeduction = dependents * 189.59; // Valor por dependente 2024
    const taxableSalary = salary - dependentDeduction;

    for (const bracket of brackets) {
      if (taxableSalary >= bracket.valor_minimo && 
          (bracket.valor_maximo === null || taxableSalary <= bracket.valor_maximo)) {
        return (taxableSalary * bracket.aliquota / 100) - bracket.valor_deducao;
      }
    }
    return 0;
  }
}
