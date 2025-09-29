import { rhSupabase, coreSupabase } from '@/integrations/supabase/client';
import { EventConsolidationService, PayrollEvent } from './EventConsolidationService';

// Interfaces para o motor de cálculo
export interface PayrollRubrica {
  id: string;
  company_id: string;
  codigo: string;
  nome: string;
  tipo: 'provento' | 'desconto' | 'base_calculo';
  categoria: 'salario' | 'hora_extra' | 'beneficio' | 'imposto' | 'desconto' | 'adicional';
  formula_calculo?: Record<string, any>;
  valor_fixo?: number;
  percentual?: number;
  base_calculo?: 'salario_base' | 'salario_bruto' | 'salario_liquido';
  ordem_calculo: number;
  is_obrigatorio: boolean;
  is_visivel: boolean;
  is_ativo: boolean;
}

export interface PayrollCalculation {
  id: string;
  company_id: string;
  employee_id: string;
  period: string;
  calculation_type: 'full' | 'incremental' | 'recalculation';
  calculation_data: Record<string, any>;
  total_proventos: number;
  total_descontos: number;
  salario_bruto: number;
  salario_liquido: number;
  status: 'pending' | 'calculated' | 'approved' | 'processed';
  calculated_at?: string;
  approved_by?: string;
  approved_at?: string;
  processed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface PayrollCalculationItem {
  id: string;
  calculation_id: string;
  rubrica_id: string;
  codigo: string;
  nome: string;
  tipo: 'provento' | 'desconto' | 'base_calculo';
  valor_base: number;
  percentual: number;
  valor_calculado: number;
  quantidade: number;
  unidade: string;
  formula_aplicada?: string;
  ordem_calculo: number;
  is_manual: boolean;
  created_at: string;
  updated_at: string;
}

export interface CalculationResult {
  calculation: PayrollCalculation;
  items: PayrollCalculationItem[];
  total_proventos: number;
  total_descontos: number;
  salario_bruto: number;
  salario_liquido: number;
  validations: ValidationResult[];
}

export interface ValidationResult {
  validation_name: string;
  validation_type: string;
  result: 'passed' | 'failed' | 'warning';
  message: string;
}

export class PayrollCalculationEngine {
  private companyId: string;
  private eventConsolidationService: EventConsolidationService;

  constructor(companyId: string) {
    this.companyId = companyId;
    this.eventConsolidationService = new EventConsolidationService(companyId);
  }

  /**
   * Calcula a folha de pagamento completa para um funcionário
   */
  async calculatePayroll(
    employeeId: string,
    period: string,
    calculationType: 'full' | 'incremental' | 'recalculation' = 'full'
  ): Promise<CalculationResult> {
    try {
      console.log(`🧮 Iniciando cálculo de folha para funcionário ${employeeId} no período ${period}`);

      // 1. Buscar eventos consolidados
      const events = await this.eventConsolidationService.getConsolidatedEvents(
        period,
        employeeId,
        undefined,
        'approved'
      );

      // 2. Buscar rubricas da empresa
      const rubricas = await this.getCompanyRubricas();

      // 3. Buscar dados do funcionário
      const employee = await this.getEmployee(employeeId);

      // 4. Buscar configurações de cálculo
      const configs = await this.getCalculationConfigs();

      // 5. Processar eventos e gerar itens de cálculo
      const calculationItems = await this.processEventsToItems(events, rubricas, employee, configs);

      // 6. Calcular totais
      const totals = this.calculateTotals(calculationItems);

      // 7. Criar registro de cálculo
      const calculation = await this.createCalculation({
        company_id: this.companyId,
        employee_id: employeeId,
        period,
        calculation_type: calculationType,
        calculation_data: {
          events_processed: events.length,
          rubricas_used: rubricas.length,
          calculation_timestamp: new Date().toISOString()
        },
        total_proventos: totals.proventos,
        total_descontos: totals.descontos,
        salario_bruto: totals.salario_bruto,
        salario_liquido: totals.salario_liquido,
        status: 'calculated',
        calculated_at: new Date().toISOString()
      });

      // 8. Salvar itens de cálculo
      const savedItems = await this.saveCalculationItems(calculation.id, calculationItems);

      // 9. Executar validações
      const validations = await this.runValidations(calculation, savedItems);

      // 10. Atualizar status baseado nas validações
      const hasErrors = validations.some(v => v.result === 'failed');
      if (hasErrors) {
        await this.updateCalculationStatus(calculation.id, 'pending');
      }

      console.log(`✅ Cálculo concluído: ${totals.salario_liquido.toFixed(2)} líquido`);

      return {
        calculation,
        items: savedItems,
        total_proventos: totals.proventos,
        total_descontos: totals.descontos,
        salario_bruto: totals.salario_bruto,
        salario_liquido: totals.salario_liquido,
        validations
      };

    } catch (error) {
      console.error('❌ Erro no cálculo de folha:', error);
      throw error;
    }
  }

  /**
   * Processa eventos consolidados e gera itens de cálculo
   */
  private async processEventsToItems(
    events: PayrollEvent[],
    rubricas: PayrollRubrica[],
    employee: any,
    configs: any[]
  ): Promise<PayrollCalculationItem[]> {
    const items: PayrollCalculationItem[] = [];

    // Agrupar eventos por tipo
    const eventsByType = this.groupEventsByType(events);

    // Processar cada tipo de evento
    for (const [eventType, typeEvents] of Object.entries(eventsByType)) {
      const rubrica = rubricas.find(r => r.categoria === this.mapEventTypeToCategory(eventType));
      
      if (rubrica) {
        const item = await this.createCalculationItemFromEvents(
          rubrica,
          typeEvents,
          employee,
          configs
        );
        if (item) {
          items.push(item);
        }
      }
    }

    // Adicionar rubricas obrigatórias que não foram processadas
    const processedRubricas = items.map(item => item.rubrica_id);
    const missingRubricas = rubricas.filter(r => 
      r.is_obrigatorio && 
      !processedRubricas.includes(r.id)
    );

    for (const rubrica of missingRubricas) {
      const item = await this.createCalculationItemFromRubrica(rubrica, employee, configs);
      if (item) {
        items.push(item);
      }
    }

    // Ordenar por ordem de cálculo
    return items.sort((a, b) => a.ordem_calculo - b.ordem_calculo);
  }

  /**
   * Cria item de cálculo a partir de eventos
   */
  private async createCalculationItemFromEvents(
    rubrica: PayrollRubrica,
    events: PayrollEvent[],
    employee: any,
    configs: any[]
  ): Promise<PayrollCalculationItem | null> {
    try {
      let valorCalculado = 0;
      let quantidade = 0;
      let formulaAplicada = '';

      // Calcular valor baseado no tipo de rubrica
      switch (rubrica.categoria) {
        case 'salario':
          valorCalculado = employee.salario_base || 0;
          quantidade = 1;
          formulaAplicada = 'Salário base';
          break;

        case 'hora_extra':
          const overtimeEvents = events.filter(e => e.event_type === 'overtime');
          quantidade = overtimeEvents.reduce((sum, e) => sum + e.calculated_value, 0);
          valorCalculado = quantidade * (employee.salario_base || 0) / 220 * 1.5; // 1.5x para horas extras
          formulaAplicada = `Horas extras: ${quantidade}h × (Salário ÷ 220) × 1.5`;
          break;

        case 'beneficio':
          const benefitEvents = events.filter(e => e.event_type === 'benefit');
          valorCalculado = benefitEvents.reduce((sum, e) => sum + e.calculated_value, 0);
          quantidade = benefitEvents.length;
          formulaAplicada = 'Benefícios consolidados';
          break;

        case 'imposto':
          const salarioBruto = this.calculateSalarioBruto(events, employee);
          valorCalculado = await this.calculateTaxes(salarioBruto, rubrica, employee);
          quantidade = 1;
          formulaAplicada = `Imposto: ${rubrica.nome}`;
          break;

        case 'desconto':
          const discountEvents = events.filter(e => e.event_type === 'absence');
          valorCalculado = Math.abs(discountEvents.reduce((sum, e) => sum + e.calculated_value, 0));
          quantidade = discountEvents.length;
          formulaAplicada = 'Descontos por ausência';
          break;

        default:
          valorCalculado = rubrica.valor_fixo || 0;
          quantidade = 1;
          formulaAplicada = 'Valor fixo';
      }

      return {
        id: '', // Será preenchido ao salvar
        calculation_id: '', // Será preenchido ao salvar
        rubrica_id: rubrica.id,
        codigo: rubrica.codigo,
        nome: rubrica.nome,
        tipo: rubrica.tipo,
        valor_base: employee.salario_base || 0,
        percentual: rubrica.percentual || 0,
        valor_calculado: valorCalculado,
        quantidade,
        unidade: this.getUnidadeForRubrica(rubrica),
        formula_aplicada: formulaAplicada,
        ordem_calculo: rubrica.ordem_calculo,
        is_manual: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Erro ao criar item de cálculo para rubrica ${rubrica.codigo}:`, error);
      return null;
    }
  }

  /**
   * Cria item de cálculo a partir de rubrica obrigatória
   */
  private async createCalculationItemFromRubrica(
    rubrica: PayrollRubrica,
    employee: any,
    configs: any[]
  ): Promise<PayrollCalculationItem | null> {
    try {
      let valorCalculado = 0;
      let quantidade = 1;
      let formulaAplicada = '';

      if (rubrica.valor_fixo) {
        valorCalculado = rubrica.valor_fixo;
        formulaAplicada = 'Valor fixo';
      } else if (rubrica.percentual) {
        const baseValue = this.getBaseValueForRubrica(rubrica, employee);
        valorCalculado = baseValue * rubrica.percentual;
        formulaAplicada = `${baseValue} × ${(rubrica.percentual * 100).toFixed(2)}%`;
      }

      return {
        id: '',
        calculation_id: '',
        rubrica_id: rubrica.id,
        codigo: rubrica.codigo,
        nome: rubrica.nome,
        tipo: rubrica.tipo,
        valor_base: employee.salario_base || 0,
        percentual: rubrica.percentual || 0,
        valor_calculado: valorCalculado,
        quantidade,
        unidade: this.getUnidadeForRubrica(rubrica),
        formula_aplicada: formulaAplicada,
        ordem_calculo: rubrica.ordem_calculo,
        is_manual: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Erro ao criar item de cálculo para rubrica ${rubrica.codigo}:`, error);
      return null;
    }
  }

  /**
   * Calcula impostos (INSS, IRRF, FGTS)
   */
  private async calculateTaxes(salarioBruto: number, rubrica: PayrollRubrica, employee: any): Promise<number> {
    try {
      switch (rubrica.codigo) {
        case 'INSS':
          return await this.calculateINSS(salarioBruto);
        case 'IRRF':
          return await this.calculateIRRF(salarioBruto, employee);
        case 'FGTS':
          return await this.calculateFGTS(salarioBruto);
        default:
          return 0;
      }
    } catch (error) {
      console.error(`❌ Erro ao calcular imposto ${rubrica.codigo}:`, error);
      return 0;
    }
  }

  /**
   * Calcula INSS
   */
  private async calculateINSS(salarioBruto: number): Promise<number> {
    const { data: brackets, error } = await rhSupabase
      .from('inss_brackets')
      .select('*')
      .eq('company_id', this.companyId)
      .order('salario_inicio');

    if (error || !brackets) return 0;

    for (const bracket of brackets) {
      if (salarioBruto >= bracket.salario_inicio && salarioBruto <= bracket.salario_fim) {
        return salarioBruto * bracket.aliquota;
      }
    }

    return 0;
  }

  /**
   * Calcula IRRF
   */
  private async calculateIRRF(salarioBruto: number, employee: any): Promise<number> {
    const { data: brackets, error } = await rhSupabase
      .from('irrf_brackets')
      .select('*')
      .eq('company_id', this.companyId)
      .order('salario_inicio');

    if (error || !brackets) return 0;

    // Calcular dependentes (simplificado)
    const dependentes = employee.dependentes || 0;
    const descontoDependentes = dependentes * 189.59; // Valor 2024
    const baseCalculo = salarioBruto - descontoDependentes;

    for (const bracket of brackets) {
      if (baseCalculo >= bracket.salario_inicio && baseCalculo <= bracket.salario_fim) {
        return (baseCalculo * bracket.aliquota) - bracket.parcela_dedutivel;
      }
    }

    return 0;
  }

  /**
   * Calcula FGTS
   */
  private async calculateFGTS(salarioBruto: number): Promise<number> {
    const { data: config, error } = await rhSupabase
      .from('fgts_config')
      .select('*')
      .eq('company_id', this.companyId)
      .single();

    if (error || !config) return 0;

    return salarioBruto * config.aliquota;
  }

  /**
   * Calcula salário bruto
   */
  private calculateSalarioBruto(events: PayrollEvent[], employee: any): number {
    const salarioBase = employee.salario_base || 0;
    const proventos = events
      .filter(e => e.event_type !== 'absence' && e.calculated_value > 0)
      .reduce((sum, e) => sum + e.calculated_value, 0);
    
    return salarioBase + proventos;
  }

  /**
   * Calcula totais da folha
   */
  private calculateTotals(items: PayrollCalculationItem[]): {
    proventos: number;
    descontos: number;
    salario_bruto: number;
    salario_liquido: number;
  } {
    const proventos = items
      .filter(item => item.tipo === 'provento')
      .reduce((sum, item) => sum + item.valor_calculado, 0);

    const descontos = items
      .filter(item => item.tipo === 'desconto')
      .reduce((sum, item) => sum + item.valor_calculado, 0);

    const salario_bruto = proventos;
    const salario_liquido = salario_bruto - descontos;

    return {
      proventos,
      descontos,
      salario_bruto,
      salario_liquido
    };
  }

  /**
   * Executa validações de folha
   */
  private async runValidations(
    calculation: PayrollCalculation,
    items: PayrollCalculationItem[]
  ): Promise<ValidationResult[]> {
    const validations: ValidationResult[] = [];

    // Validação 1: Salário líquido não pode ser negativo
    if (calculation.salario_liquido < 0) {
      validations.push({
        validation_name: 'Salário Líquido Negativo',
        validation_type: 'consistency',
        result: 'failed',
        message: 'Salário líquido não pode ser negativo'
      });
    }

    // Validação 2: INSS deve estar presente
    const hasINSS = items.some(item => item.codigo === 'INSS');
    if (!hasINSS) {
      validations.push({
        validation_name: 'INSS Obrigatório',
        validation_type: 'legal',
        result: 'failed',
        message: 'INSS é obrigatório para todos os funcionários'
      });
    }

    // Validação 3: FGTS deve estar presente
    const hasFGTS = items.some(item => item.codigo === 'FGTS');
    if (!hasFGTS) {
      validations.push({
        validation_name: 'FGTS Obrigatório',
        validation_type: 'legal',
        result: 'failed',
        message: 'FGTS é obrigatório para todos os funcionários'
      });
    }

    return validations;
  }

  // Métodos auxiliares
  private groupEventsByType(events: PayrollEvent[]): Record<string, PayrollEvent[]> {
    return events.reduce((groups, event) => {
      if (!groups[event.event_type]) {
        groups[event.event_type] = [];
      }
      groups[event.event_type].push(event);
      return groups;
    }, {} as Record<string, PayrollEvent[]>);
  }

  private mapEventTypeToCategory(eventType: string): string {
    const mapping: Record<string, string> = {
      'time_record': 'salario',
      'overtime': 'hora_extra',
      'benefit': 'beneficio',
      'absence': 'desconto',
      'allowance': 'adicional'
    };
    return mapping[eventType] || 'beneficio';
  }

  private getUnidadeForRubrica(rubrica: PayrollRubrica): string {
    const unidades: Record<string, string> = {
      'salario': 'mês',
      'hora_extra': 'hora',
      'beneficio': 'unidade',
      'imposto': 'valor',
      'desconto': 'valor'
    };
    return unidades[rubrica.categoria] || 'unidade';
  }

  private getBaseValueForRubrica(rubrica: PayrollRubrica, employee: any): number {
    switch (rubrica.base_calculo) {
      case 'salario_base':
        return employee.salario_base || 0;
      case 'salario_bruto':
        return this.calculateSalarioBruto([], employee);
      default:
        return employee.salario_base || 0;
    }
  }

  // Métodos de banco de dados
  private async getCompanyRubricas(): Promise<PayrollRubrica[]> {
    const { data, error } = await rhSupabase
      .from('payroll_rubricas')
      .select('*')
      .eq('company_id', this.companyId)
      .eq('is_ativo', true)
      .order('ordem_calculo');

    if (error) throw error;
    return data || [];
  }

  private async getEmployee(employeeId: string): Promise<any> {
    const { data, error } = await rhSupabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single();

    if (error) throw error;
    return data;
  }

  private async getCalculationConfigs(): Promise<any[]> {
    const { data, error } = await rhSupabase
      .from('payroll_calculation_config')
      .select('*')
      .eq('company_id', this.companyId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }

  private async createCalculation(calculation: Partial<PayrollCalculation>): Promise<PayrollCalculation> {
    const { data, error } = await rhSupabase
      .from('payroll_calculations')
      .insert(calculation)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async saveCalculationItems(
    calculationId: string,
    items: PayrollCalculationItem[]
  ): Promise<PayrollCalculationItem[]> {
    const itemsToSave = items.map(item => ({
      ...item,
      calculation_id: calculationId
    }));

    const { data, error } = await rhSupabase
      .from('payroll_calculation_items')
      .insert(itemsToSave)
      .select();

    if (error) throw error;
    return data || [];
  }

  private async updateCalculationStatus(calculationId: string, status: string): Promise<void> {
    const { error } = await rhSupabase
      .from('payroll_calculations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', calculationId);

    if (error) throw error;
  }
}
