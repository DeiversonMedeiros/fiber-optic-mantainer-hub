import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUserCompany } from '@/hooks/useUserCompany';
import { PayrollCalculationService } from '@/services/rh/calculations/PayrollCalculationService';
import type {
  OvertimeCalculation,
  VacationCalculation,
  ThirteenthSalaryCalculation,
  TaxCalculation,
  AllowanceCalculation,
  PLRCalculation,
  AbsenceCalculation,
  TerminationCalculation
} from '@/services/rh/calculations/PayrollCalculationService';

export function usePayrollCalculations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { data: userCompany, isLoading: loadingCompany } = useUserCompany();

  if (loadingCompany) {
    return {
      loading: true,
      error: null,
      calculateOvertime: async () => null,
      calculateVacation: async () => null,
      calculateThirteenthSalary: async () => null,
      calculateTaxes: async () => null,
      calculateAllowances: async () => null,
      calculatePLR: async () => null,
      calculateAbsences: async () => null,
      calculateTermination: async () => null,
      calculateUnhealthyAllowance: () => 0
    };
  }

  if (!userCompany) {
    throw new Error('Usuário não está associado a uma empresa');
  }

  const companyId = userCompany.id;
  const calculationService = new PayrollCalculationService(companyId);

  /**
   * Calcula horas extras de um funcionário
   */
  const calculateOvertime = useCallback(async (
    employeeId: string,
    period: string
  ): Promise<OvertimeCalculation | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await calculationService.calculateOvertime(employeeId, period);
      
      toast({
        title: "Sucesso",
        description: "Cálculo de horas extras realizado com sucesso!",
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao calcular horas extras';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [calculationService, toast]);

  /**
   * Calcula férias de um funcionário
   */
  const calculateVacation = useCallback(async (
    employeeId: string,
    period: string
  ): Promise<VacationCalculation | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await calculationService.calculateVacation(employeeId, period);
      
      toast({
        title: "Sucesso",
        description: "Cálculo de férias realizado com sucesso!",
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao calcular férias';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [calculationService, toast]);

  /**
   * Calcula 13º salário de um funcionário
   */
  const calculateThirteenthSalary = useCallback(async (
    employeeId: string,
    year: number
  ): Promise<ThirteenthSalaryCalculation | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await calculationService.calculateThirteenthSalary(employeeId, year);
      
      toast({
        title: "Sucesso",
        description: "Cálculo de 13º salário realizado com sucesso!",
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao calcular 13º salário';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [calculationService, toast]);

  /**
   * Calcula impostos de um funcionário
   */
  const calculateTaxes = useCallback(async (
    employeeId: string,
    grossSalary: number,
    dependents: number = 0
  ): Promise<TaxCalculation | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await calculationService.calculateTaxes(employeeId, grossSalary, dependents);
      
      toast({
        title: "Sucesso",
        description: "Cálculo de impostos realizado com sucesso!",
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao calcular impostos';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [calculationService, toast]);

  /**
   * Calcula adicionais de um funcionário
   */
  const calculateAllowances = useCallback(async (
    employeeId: string,
    period: string,
    baseSalary: number,
    allowances: {
      dangerRate?: number;
      unhealthyDegree?: string;
      onCallHours?: number;
      functionRate?: number;
    }
  ): Promise<AllowanceCalculation | null> => {
    try {
      setLoading(true);
      setError(null);

      // Implementar cálculo de adicionais
      const dangerAllowance = allowances.dangerRate ? baseSalary * (allowances.dangerRate / 100) : 0;
      const unhealthyAllowance = this.calculateUnhealthyAllowance(baseSalary, allowances.unhealthyDegree);
      const onCallAllowance = allowances.onCallHours ? allowances.onCallHours * (baseSalary / 220) * 0.2 : 0;
      const functionAllowance = allowances.functionRate ? baseSalary * (allowances.functionRate / 100) : 0;
      
      const totalAllowances = dangerAllowance + unhealthyAllowance + onCallAllowance + functionAllowance;

      const result: AllowanceCalculation = {
        employeeId,
        period,
        dangerAllowance,
        unhealthyAllowance,
        onCallAllowance,
        functionAllowance,
        totalAllowances
      };
      
      toast({
        title: "Sucesso",
        description: "Cálculo de adicionais realizado com sucesso!",
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao calcular adicionais';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Calcula insalubridade baseada no grau
   */
  const calculateUnhealthyAllowance = (baseSalary: number, degree?: string): number => {
    if (!degree) return 0;
    
    const rates = {
      'minimo': 0.1,    // 10%
      'medio': 0.2,     // 20%
      'maximo': 0.4     // 40%
    };
    
    return baseSalary * (rates[degree as keyof typeof rates] || 0);
  };

  /**
   * Calcula PLR de um funcionário
   */
  const calculatePLR = useCallback(async (
    employeeId: string,
    period: string,
    companyProfit: number,
    criteria: {
      baseValue: number;
      performanceMultiplier?: number;
      seniorityMultiplier?: number;
    }
  ): Promise<PLRCalculation | null> => {
    try {
      setLoading(true);
      setError(null);

      const baseValue = criteria.baseValue;
      const performanceMultiplier = criteria.performanceMultiplier || 1;
      const seniorityMultiplier = criteria.seniorityMultiplier || 1;
      
      const criteriaValue = baseValue * performanceMultiplier * seniorityMultiplier;
      const totalValue = Math.min(criteriaValue, companyProfit * 0.1); // Máximo 10% do lucro

      const result: PLRCalculation = {
        employeeId,
        period,
        baseValue,
        criteriaValue,
        totalValue
      };
      
      toast({
        title: "Sucesso",
        description: "Cálculo de PLR realizado com sucesso!",
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao calcular PLR';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Calcula ausências de um funcionário
   */
  const calculateAbsences = useCallback(async (
    employeeId: string,
    period: string
  ): Promise<AbsenceCalculation | null> => {
    try {
      setLoading(true);
      setError(null);

      // Buscar registros de ausências do período
      const { data: absences, error: absencesError } = await rhSupabase
        .from('employee_absences')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('company_id', companyId)
        .gte('data_inicio', `${period}-01`)
        .lte('data_fim', `${period}-31`);

      if (absencesError) throw absencesError;

      // Buscar registros de atrasos
      const { data: delays, error: delaysError } = await rhSupabase
        .from('employee_delay_records')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('company_id', companyId)
        .gte('data', `${period}-01`)
        .lte('data', `${period}-31`);

      if (delaysError) throw delaysError;

      // Calcular totais
      const absenceDays = absences?.reduce((sum, absence) => {
        const start = new Date(absence.data_inicio);
        const end = new Date(absence.data_fim);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return sum + days;
      }, 0) || 0;

      const delayMinutes = delays?.reduce((sum, delay) => sum + (delay.minutos_atraso || 0), 0) || 0;
      const earlyLeaveMinutes = delays?.reduce((sum, delay) => sum + (delay.minutos_saida_antecipada || 0), 0) || 0;

      // Calcular descontos (implementar lógica específica)
      const totalDiscounts = (absenceDays * 8 * 50) + (delayMinutes * 2) + (earlyLeaveMinutes * 2); // Valores exemplo

      const result: AbsenceCalculation = {
        employeeId,
        period,
        absenceDays,
        delayMinutes,
        earlyLeaveMinutes,
        totalDiscounts
      };
      
      toast({
        title: "Sucesso",
        description: "Cálculo de ausências realizado com sucesso!",
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao calcular ausências';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [companyId, toast]);

  /**
   * Calcula rescisão de um funcionário
   */
  const calculateTermination = useCallback(async (
    employeeId: string,
    terminationDate: string,
    terminationType: 'sem_justa_causa' | 'com_justa_causa' | 'aposentadoria'
  ): Promise<TerminationCalculation | null> => {
    try {
      setLoading(true);
      setError(null);

      // Buscar salário base
      const { data: contract, error: contractError } = await rhSupabase
        .from('employment_contracts')
        .select('salario_base')
        .eq('employee_id', employeeId)
        .eq('company_id', companyId)
        .eq('is_active', true)
        .single();

      if (contractError) throw contractError;

      const baseSalary = contract.salario_base || 0;
      const dailyRate = baseSalary / 30;

      // Calcular valores baseados no tipo de rescisão
      let noticeValue = 0;
      let vacationValue = 0;
      let thirteenthValue = 0;
      let fgtsValue = 0;

      if (terminationType === 'sem_justa_causa') {
        noticeValue = baseSalary; // Aviso prévio
        vacationValue = dailyRate * 30; // Férias proporcionais
        thirteenthValue = baseSalary; // 13º proporcional
        fgtsValue = baseSalary * 0.08; // FGTS + 40% multa
      } else if (terminationType === 'com_justa_causa') {
        // Sem aviso prévio, sem multa FGTS
        fgtsValue = baseSalary * 0.08;
      } else if (terminationType === 'aposentadoria') {
        vacationValue = dailyRate * 30;
        thirteenthValue = baseSalary;
        fgtsValue = baseSalary * 0.08;
      }

      const totalValue = noticeValue + vacationValue + thirteenthValue + fgtsValue;

      const result: TerminationCalculation = {
        employeeId,
        terminationDate,
        terminationType,
        noticeValue,
        vacationValue,
        thirteenthValue,
        fgtsValue,
        totalValue
      };
      
      toast({
        title: "Sucesso",
        description: "Cálculo de rescisão realizado com sucesso!",
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao calcular rescisão';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [companyId, toast]);

  return {
    loading,
    error,
    calculateOvertime,
    calculateVacation,
    calculateThirteenthSalary,
    calculateTaxes,
    calculateAllowances,
    calculatePLR,
    calculateAbsences,
    calculateTermination,
    calculateUnhealthyAllowance
  };
}
