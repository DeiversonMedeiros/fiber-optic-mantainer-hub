import { rhSupabase, coreSupabase } from '@/integrations/supabase/client';
import { PayrollCalculationEngine, PayrollCalculation, PayrollCalculationItem } from './PayrollCalculationEngine';
import { EventConsolidationService, PayrollEvent } from './EventConsolidationService';

// Interfaces para integração eSocial
export interface ESocialEvent {
  id: string;
  company_id: string;
  employee_id: string;
  event_type: string;
  period: string;
  event_data: Record<string, any>;
  status: 'pending' | 'sent' | 'accepted' | 'rejected' | 'error';
  sent_at?: string;
  response_data?: Record<string, any>;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface ESocialBatch {
  id: string;
  company_id: string;
  batch_number: string;
  period: string;
  total_events: number;
  sent_events: number;
  accepted_events: number;
  rejected_events: number;
  error_events: number;
  status: 'pending' | 'sending' | 'sent' | 'accepted' | 'rejected' | 'error';
  sent_at?: string;
  response_data?: Record<string, any>;
  error_message?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface ESocialValidation {
  id: string;
  company_id: string;
  validation_name: string;
  event_type: string;
  validation_rule: Record<string, any>;
  error_message: string;
  warning_message?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface ESocialIntegrationResult {
  success: boolean;
  events_processed: number;
  events_sent: number;
  events_accepted: number;
  events_rejected: number;
  events_error: number;
  batch_id?: string;
  errors: string[];
  warnings: string[];
}

export class ESocialIntegrationService {
  private companyId: string;
  private calculationEngine: PayrollCalculationEngine;
  private eventConsolidationService: EventConsolidationService;

  constructor(companyId: string) {
    this.companyId = companyId;
    this.calculationEngine = new PayrollCalculationEngine(companyId);
    this.eventConsolidationService = new EventConsolidationService(companyId);
  }

  /**
   * Processa e envia eventos eSocial para um período
   */
  async processESocialEvents(
    period: string,
    employeeIds?: string[]
  ): Promise<ESocialIntegrationResult> {
    try {
      console.log(`📤 Iniciando processamento de eventos eSocial para período ${period}`);

      const result: ESocialIntegrationResult = {
        success: true,
        events_processed: 0,
        events_sent: 0,
        events_accepted: 0,
        events_rejected: 0,
        events_error: 0,
        errors: [],
        warnings: []
      };

      // 1. Buscar funcionários
      const employees = await this.getEmployees(employeeIds);
      if (employees.length === 0) {
        result.errors.push('Nenhum funcionário encontrado para o período');
        return result;
      }

      // 2. Criar lote de envio
      const batch = await this.createBatch(period);

      // 3. Processar eventos para cada funcionário
      for (const employee of employees) {
        try {
          const employeeEvents = await this.processEmployeeESocialEvents(
            employee.id,
            period,
            batch.id
          );
          result.events_processed += employeeEvents.length;
        } catch (error) {
          const errorMsg = `Erro ao processar funcionário ${employee.nome}: ${error}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      // 4. Enviar lote para eSocial
      if (result.events_processed > 0) {
        const sendResult = await this.sendBatchToESocial(batch.id);
        result.events_sent = sendResult.events_sent;
        result.events_accepted = sendResult.events_accepted;
        result.events_rejected = sendResult.events_rejected;
        result.events_error = sendResult.events_error;
        result.batch_id = batch.id;
      }

      console.log(`✅ Processamento concluído: ${result.events_processed} eventos processados`);

      return result;

    } catch (error) {
      console.error('❌ Erro no processamento de eventos eSocial:', error);
      throw error;
    }
  }

  /**
   * Processa eventos eSocial para um funcionário específico
   */
  private async processEmployeeESocialEvents(
    employeeId: string,
    period: string,
    batchId: string
  ): Promise<ESocialEvent[]> {
    const events: ESocialEvent[] = [];

    try {
      // 1. Evento S-1000 - Informações do Empregador/Contribuinte
      const s1000Event = await this.createS1000Event(employeeId, period, batchId);
      if (s1000Event) events.push(s1000Event);

      // 2. Evento S-1005 - Tabela de Estabelecimentos
      const s1005Event = await this.createS1005Event(employeeId, period, batchId);
      if (s1005Event) events.push(s1005Event);

      // 3. Evento S-1010 - Tabela de Rubricas
      const s1010Event = await this.createS1010Event(employeeId, period, batchId);
      if (s1010Event) events.push(s1010Event);

      // 4. Evento S-1020 - Tabela de Lotações
      const s1020Event = await this.createS1020Event(employeeId, period, batchId);
      if (s1020Event) events.push(s1020Event);

      // 5. Evento S-1030 - Tabela de Cargos/Empregos Públicos
      const s1030Event = await this.createS1030Event(employeeId, period, batchId);
      if (s1030Event) events.push(s1030Event);

      // 6. Evento S-1200 - Remuneração de Trabalhador Vinculado ao Regime Geral de Previdência Social
      const s1200Event = await this.createS1200Event(employeeId, period, batchId);
      if (s1200Event) events.push(s1200Event);

      // 7. Evento S-1202 - Remuneração de Servidor Vinculado ao Regime Próprio de Previdência Social
      const s1202Event = await this.createS1202Event(employeeId, period, batchId);
      if (s1202Event) events.push(s1202Event);

      // 8. Evento S-1207 - Benefícios Previdenciários - RPPS
      const s1207Event = await this.createS1207Event(employeeId, period, batchId);
      if (s1207Event) events.push(s1207Event);

      // 9. Evento S-1210 - Pagamentos de Rendimentos do Trabalho
      const s1210Event = await this.createS1210Event(employeeId, period, batchId);
      if (s1210Event) events.push(s1210Event);

      // 10. Evento S-1250 - Aquisição de Produção Rural
      const s1250Event = await this.createS1250Event(employeeId, period, batchId);
      if (s1250Event) events.push(s1250Event);

      // 11. Evento S-1260 - Comercialização da Produção Rural Pessoa Física
      const s1260Event = await this.createS1260Event(employeeId, period, batchId);
      if (s1260Event) events.push(s1260Event);

      // 12. Evento S-1270 - Contratação de Trabalhadores Avulsos Não Portuários
      const s1270Event = await this.createS1270Event(employeeId, period, batchId);
      if (s1270Event) events.push(s1270Event);

      // 13. Evento S-1280 - Contribuições Consolidadas para Outras Entidades e Fundos
      const s1280Event = await this.createS1280Event(employeeId, period, batchId);
      if (s1280Event) events.push(s1280Event);

      // 14. Evento S-1295 - Solicitação de Totalização para Pagamento em Cota Única do FGTS
      const s1295Event = await this.createS1295Event(employeeId, period, batchId);
      if (s1295Event) events.push(s1295Event);

      // 15. Evento S-1298 - Reabertura dos Eventos Periódicos
      const s1298Event = await this.createS1298Event(employeeId, period, batchId);
      if (s1298Event) events.push(s1298Event);

      // 16. Evento S-1299 - Fechamento dos Eventos Periódicos
      const s1299Event = await this.createS1299Event(employeeId, period, batchId);
      if (s1299Event) events.push(s1299Event);

      // 17. Evento S-1300 - Contribuição Sindical Patronal
      const s1300Event = await this.createS1300Event(employeeId, period, batchId);
      if (s1300Event) events.push(s1300Event);

      // 18. Evento S-2190 - Admissão de Trabalhador - Registro Preliminar
      const s2190Event = await this.createS2190Event(employeeId, period, batchId);
      if (s2190Event) events.push(s2190Event);

      // 19. Evento S-2200 - Cadastramento Inicial do Vínculo e Admissão/Ingresso de Trabalhador
      const s2200Event = await this.createS2200Event(employeeId, period, batchId);
      if (s2200Event) events.push(s2200Event);

      // 20. Evento S-2205 - Alteração de Dados Cadastrais do Trabalhador
      const s2205Event = await this.createS2205Event(employeeId, period, batchId);
      if (s2205Event) events.push(s2205Event);

      // 21. Evento S-2206 - Alteração de Contrato de Trabalho
      const s2206Event = await this.createS2206Event(employeeId, period, batchId);
      if (s2206Event) events.push(s2206Event);

      // 22. Evento S-2210 - Comunicação de Acidente de Trabalho
      const s2210Event = await this.createS2210Event(employeeId, period, batchId);
      if (s2210Event) events.push(s2210Event);

      // 23. Evento S-2220 - Monitoramento da Saúde do Trabalhador
      const s2220Event = await this.createS2220Event(employeeId, period, batchId);
      if (s2220Event) events.push(s2220Event);

      // 24. Evento S-2230 - Afastamento Temporário
      const s2230Event = await this.createS2230Event(employeeId, period, batchId);
      if (s2230Event) events.push(s2230Event);

      // 25. Evento S-2240 - Condições Ambientais do Trabalho - Fatores de Risco
      const s2240Event = await this.createS2240Event(employeeId, period, batchId);
      if (s2240Event) events.push(s2240Event);

      // 26. Evento S-2241 - Insalubridade, Periculosidade e Aposentadoria Especial
      const s2241Event = await this.createS2241Event(employeeId, period, batchId);
      if (s2241Event) events.push(s2241Event);

      // 27. Evento S-2250 - Aviso Prévio
      const s2250Event = await this.createS2250Event(employeeId, period, batchId);
      if (s2250Event) events.push(s2250Event);

      // 28. Evento S-2260 - Convocação para Trabalho em Regime de Tempo Parcial
      const s2260Event = await this.createS2260Event(employeeId, period, batchId);
      if (s2260Event) events.push(s2260Event);

      // 29. Evento S-2298 - Reintegração
      const s2298Event = await this.createS2298Event(employeeId, period, batchId);
      if (s2298Event) events.push(s2298Event);

      // 30. Evento S-2299 - Desligamento
      const s2299Event = await this.createS2299Event(employeeId, period, batchId);
      if (s2299Event) events.push(s2299Event);

      // 31. Evento S-2300 - Trabalhador Sem Vínculo de Emprego/Estatutário - Início
      const s2300Event = await this.createS2300Event(employeeId, period, batchId);
      if (s2300Event) events.push(s2300Event);

      // 32. Evento S-2306 - Trabalhador Sem Vínculo de Emprego/Estatutário - Término
      const s2306Event = await this.createS2306Event(employeeId, period, batchId);
      if (s2306Event) events.push(s2306Event);

      // 33. Evento S-2399 - Trabalhador Sem Vínculo de Emprego/Estatutário - Alteração Contratual
      const s2399Event = await this.createS2399Event(employeeId, period, batchId);
      if (s2399Event) events.push(s2399Event);

      // 34. Evento S-2400 - Cadastro de Benefícios Previdenciários - RPPS
      const s2400Event = await this.createS2400Event(employeeId, period, batchId);
      if (s2400Event) events.push(s2400Event);

      // 35. Evento S-3000 - Exclusão de Eventos
      const s3000Event = await this.createS3000Event(employeeId, period, batchId);
      if (s3000Event) events.push(s3000Event);

      // 36. Evento S-3500 - Informações de Processos Judiciais
      const s3500Event = await this.createS3500Event(employeeId, period, batchId);
      if (s3500Event) events.push(s3500Event);

      // 37. Evento S-5001 - Informações das Contribuições Sociais por Trabalhador
      const s5001Event = await this.createS5001Event(employeeId, period, batchId);
      if (s5001Event) events.push(s5001Event);

      // 38. Evento S-5002 - Informações das Contribuições Sociais por Trabalhador - PIS/PASEP
      const s5002Event = await this.createS5002Event(employeeId, period, batchId);
      if (s5002Event) events.push(s5002Event);

      // 39. Evento S-5003 - Informações das Contribuições Sociais por Trabalhador - FGTS
      const s5003Event = await this.createS5003Event(employeeId, period, batchId);
      if (s5003Event) events.push(s5003Event);

      // 40. Evento S-5011 - Informações das Contribuições Sociais por Trabalhador - PIS/PASEP
      const s5011Event = await this.createS5011Event(employeeId, period, batchId);
      if (s5011Event) events.push(s5011Event);

      // 41. Evento S-5012 - Informações das Contribuições Sociais por Trabalhador - FGTS
      const s5012Event = await this.createS5012Event(employeeId, period, batchId);
      if (s5012Event) events.push(s5012Event);

      // 42. Evento S-5013 - Informações das Contribuições Sociais por Trabalhador - FGTS
      const s5013Event = await this.createS5013Event(employeeId, period, batchId);
      if (s5013Event) events.push(s5013Event);

      return events;

    } catch (error) {
      console.error(`❌ Erro ao processar eventos eSocial para funcionário ${employeeId}:`, error);
      return [];
    }
  }

  /**
   * Cria evento S-1000 - Informações do Empregador/Contribuinte
   */
  private async createS1000Event(
    employeeId: string,
    period: string,
    batchId: string
  ): Promise<ESocialEvent | null> {
    try {
      const company = await this.getCompany();
      const employee = await this.getEmployee(employeeId);

      const eventData = {
        ideEvento: {
          tpAmb: 1, // 1-Produção, 2-Produção restrita, 3-Teste
          procEmi: 1, // 1-Aplicativo do empregador, 2-Aplicativo governamental
          verProc: "1.0.0"
        },
        ideEmpregador: {
          tpInsc: 1, // 1-CNPJ, 2-CPF
          nrInsc: company.cnpj,
          nmRazao: company.razao_social
        },
        infoEmpregador: {
          classTrib: "01", // 01-Empresa enquadrada no regime de tributação Simples Nacional
          indCoop: 0, // 0-Não é cooperativa, 1-Cooperativa de trabalho, 2-Cooperativa de produção, 3-Outras cooperativas
          indConstr: 0, // 0-Não é construtora, 1-Empresa construtora
          indDesFolha: 0, // 0-Não aplica, 1-Aplica
          indOpcCP: 0, // 0-Não optante, 1-Optante
          indPorte: 1, // 1-Microempresa, 2-Empresa de pequeno porte, 3-Demais
          indOptRegEletron: 1 // 0-Não optante, 1-Optante
        }
      };

      return await this.createESocialEvent(
        employeeId,
        'S-1000',
        period,
        eventData,
        batchId
      );

    } catch (error) {
      console.error('❌ Erro ao criar evento S-1000:', error);
      return null;
    }
  }

  /**
   * Cria evento S-1200 - Remuneração de Trabalhador Vinculado ao Regime Geral de Previdência Social
   */
  private async createS1200Event(
    employeeId: string,
    period: string,
    batchId: string
  ): Promise<ESocialEvent | null> {
    try {
      // Buscar cálculo de folha do funcionário
      const calculation = await this.getPayrollCalculation(employeeId, period);
      if (!calculation) return null;

      const employee = await this.getEmployee(employeeId);
      const company = await this.getCompany();

      const eventData = {
        ideEvento: {
          tpAmb: 1,
          procEmi: 1,
          verProc: "1.0.0"
        },
        ideEmpregador: {
          tpInsc: 1,
          nrInsc: company.cnpj,
          nmRazao: company.razao_social
        },
        ideTrabalhador: {
          cpfTrab: employee.cpf,
          nmTrab: employee.nome,
          dtNascto: employee.data_nascimento,
          sexo: employee.sexo,
          racaCor: employee.raca_cor || 1,
          estCiv: employee.estado_civil || 1,
          grauInstr: employee.grau_instrucao || 1,
          nmSoc: employee.nome_social
        },
        infoMV: {
          indMV: 0 // 0-Não declarado, 1-Dispensado, 2-Obrigatório
        },
        remuneracao: {
          dtRemun: `${period}-01`,
          vrSalFx: calculation.salario_bruto,
          undSalFixo: 1, // 1-Por mês, 2-Por semana, 3-Por dia, 4-Por hora
          dscSalVar: "Remuneração variável"
        },
        infoComplem: {
          natAtividade: 1, // 1-Trabalhador urbano, 2-Trabalhador rural
          infoComplementares: {
            infoInterm: {
              qtdDiasInterm: 0
            }
          }
        }
      };

      return await this.createESocialEvent(
        employeeId,
        'S-1200',
        period,
        eventData,
        batchId
      );

    } catch (error) {
      console.error('❌ Erro ao criar evento S-1200:', error);
      return null;
    }
  }

  /**
   * Cria evento S-5001 - Informações das Contribuições Sociais por Trabalhador
   */
  private async createS5001Event(
    employeeId: string,
    period: string,
    batchId: string
  ): Promise<ESocialEvent | null> {
    try {
      const calculation = await this.getPayrollCalculation(employeeId, period);
      if (!calculation) return null;

      const employee = await this.getEmployee(employeeId);
      const company = await this.getCompany();

      // Buscar itens de cálculo relacionados a contribuições
      const contributionItems = calculation.items.filter(item => 
        item.codigo === 'INSS' || item.codigo === 'IRRF' || item.codigo === 'FGTS'
      );

      const eventData = {
        ideEvento: {
          tpAmb: 1,
          procEmi: 1,
          verProc: "1.0.0"
        },
        ideEmpregador: {
          tpInsc: 1,
          nrInsc: company.cnpj,
          nmRazao: company.razao_social
        },
        ideTrabalhador: {
          cpfTrab: employee.cpf,
          nmTrab: employee.nome
        },
        infoCpCalc: {
          tpCR: 1, // 1-CR básico, 2-CR especial
          vrCpSeg: calculation.salario_bruto,
          vrDescSeg: contributionItems.find(item => item.codigo === 'INSS')?.valor_calculado || 0
        },
        infoCp: {
          classTrib: "01",
          codCateg: 101, // 101-Empregado - Geral
          vrsSalFx: calculation.salario_bruto,
          undSalFixo: 1,
          dscSalVar: "Remuneração variável"
        }
      };

      return await this.createESocialEvent(
        employeeId,
        'S-5001',
        period,
        eventData,
        batchId
      );

    } catch (error) {
      console.error('❌ Erro ao criar evento S-5001:', error);
      return null;
    }
  }

  // Métodos auxiliares para criar outros eventos eSocial
  private async createS1005Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS1010Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS1020Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS1030Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS1202Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS1207Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS1210Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS1250Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS1260Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS1270Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS1280Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS1295Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS1298Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS1299Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS1300Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS2190Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS2200Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS2205Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS2206Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS2210Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS2220Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS2230Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS2240Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS2241Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS2250Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS2260Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS2298Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS2299Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS2300Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS2306Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS2399Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS2400Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS3000Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS3500Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS5002Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS5003Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS5011Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS5012Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }
  private async createS5013Event(employeeId: string, period: string, batchId: string): Promise<ESocialEvent | null> { return null; }

  /**
   * Cria evento eSocial genérico
   */
  private async createESocialEvent(
    employeeId: string,
    eventType: string,
    period: string,
    eventData: Record<string, any>,
    batchId: string
  ): Promise<ESocialEvent | null> {
    try {
      const { data, error } = await rhSupabase
        .from('esocial_processed_events')
        .insert({
          company_id: this.companyId,
          employee_id: employeeId,
          event_type: eventType,
          period,
          event_data: eventData,
          status: 'pending',
          retry_count: 0,
          max_retries: 3
        })
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error(`❌ Erro ao criar evento ${eventType}:`, error);
      return null;
    }
  }

  /**
   * Cria lote de envio eSocial
   */
  private async createBatch(period: string): Promise<ESocialBatch> {
    const batchNumber = `BATCH-${period}-${Date.now()}`;
    
    const { data, error } = await rhSupabase
      .from('esocial_batches')
      .insert({
        company_id: this.companyId,
        batch_number: batchNumber,
        period,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Envia lote para eSocial
   */
  private async sendBatchToESocial(batchId: string): Promise<{
    events_sent: number;
    events_accepted: number;
    events_rejected: number;
    events_error: number;
  }> {
    try {
      // Simular envio para eSocial
      // Em implementação real, aqui seria feita a integração com a API do eSocial
      
      const { data: events, error } = await rhSupabase
        .from('esocial_processed_events')
        .select('*')
        .eq('company_id', this.companyId)
        .eq('status', 'pending');

      if (error) throw error;

      let events_sent = 0;
      let events_accepted = 0;
      let events_rejected = 0;
      let events_error = 0;

      for (const event of events || []) {
        try {
          // Simular envio e resposta
          const success = Math.random() > 0.1; // 90% de sucesso simulado
          
          if (success) {
            await rhSupabase
              .from('esocial_processed_events')
              .update({
                status: 'accepted',
                sent_at: new Date().toISOString(),
                response_data: { success: true, message: 'Evento aceito' }
              })
              .eq('id', event.id);
            
            events_accepted++;
          } else {
            await rhSupabase
              .from('esocial_processed_events')
              .update({
                status: 'rejected',
                sent_at: new Date().toISOString(),
                response_data: { success: false, message: 'Evento rejeitado' }
              })
              .eq('id', event.id);
            
            events_rejected++;
          }
          
          events_sent++;
        } catch (error) {
          await rhSupabase
            .from('esocial_processed_events')
            .update({
              status: 'error',
              error_message: error instanceof Error ? error.message : 'Erro desconhecido'
            })
            .eq('id', event.id);
          
          events_error++;
        }
      }

      // Atualizar status do lote
      await rhSupabase
        .from('esocial_batches')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_events: events_sent,
          accepted_events: events_accepted,
          rejected_events: events_rejected,
          error_events: events_error
        })
        .eq('id', batchId);

      return {
        events_sent,
        events_accepted,
        events_rejected,
        events_error
      };

    } catch (error) {
      console.error('❌ Erro ao enviar lote para eSocial:', error);
      throw error;
    }
  }

  // Métodos de banco de dados
  private async getEmployees(employeeIds?: string[]): Promise<any[]> {
    let query = rhSupabase
      .from('employees')
      .select('*')
      .eq('company_id', this.companyId);

    if (employeeIds && employeeIds.length > 0) {
      query = query.in('id', employeeIds);
    }

    const { data, error } = await query;
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

  private async getCompany(): Promise<any> {
    const { data, error } = await coreSupabase
      .from('companies')
      .select('*')
      .eq('id', this.companyId)
      .single();

    if (error) throw error;
    return data;
  }

  private async getPayrollCalculation(employeeId: string, period: string): Promise<PayrollCalculation | null> {
    const { data, error } = await rhSupabase
      .from('payroll_calculations')
      .select(`
        *,
        items:payroll_calculation_items(*)
      `)
      .eq('company_id', this.companyId)
      .eq('employee_id', employeeId)
      .eq('period', period)
      .single();

    if (error) return null;
    return data;
  }
}
