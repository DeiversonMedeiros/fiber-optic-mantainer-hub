import { rhSupabase, coreSupabase } from '@/integrations/supabase/client';
import { AnalyticsService, AnalyticsFilters } from './AnalyticsService';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export interface ReportData {
  title: string;
  period: string;
  generatedAt: string;
  data: any[];
  summary: {
    totalEmployees: number;
    totalPayroll: number;
    totalDepartments: number;
    averageSalary: number;
  };
  charts: any[];
}

export interface ReportGenerationOptions {
  templateId?: string;
  format: 'pdf' | 'excel' | 'csv';
  filters: AnalyticsFilters;
  includeCharts: boolean;
  includeDetails: boolean;
  emailTo?: string[];
}

export interface ReportHistory {
  id: string;
  reportName: string;
  reportType: string;
  parameters: any;
  filePath?: string;
  fileSize?: number;
  status: 'generating' | 'completed' | 'failed';
  errorMessage?: string;
  generatedAt: string;
  expiresAt?: string;
}

// =====================================================
// SERVIÇO DE GERAÇÃO DE RELATÓRIOS
// =====================================================

export class ReportGeneratorService {
  private companyId: string;
  private analyticsService: AnalyticsService;

  constructor(companyId: string) {
    this.companyId = companyId;
    this.analyticsService = new AnalyticsService(companyId);
  }

  // =====================================================
  // GERAÇÃO DE RELATÓRIOS
  // =====================================================

  async generatePayrollReport(options: ReportGenerationOptions): Promise<ReportHistory> {
    try {
      // Criar entrada no histórico
      const { data: historyEntry, error: historyError } = await rhSupabase
        .from('report_history')
        .insert({
          company_id: this.companyId,
          report_name: `Relatório de Folha - ${options.filters.periodStart} a ${options.filters.periodEnd}`,
          report_type: 'payroll',
          parameters: options.filters,
          status: 'generating'
        })
        .select()
        .single();

      if (historyError) throw historyError;

      try {
        // Coletar dados
        const reportData = await this.collectPayrollData(options.filters);
        
        // Gerar arquivo baseado no formato
        let filePath: string;
        let fileSize: number;

        switch (options.format) {
          case 'pdf':
            const pdfResult = await this.generatePDF(reportData, options);
            filePath = pdfResult.filePath;
            fileSize = pdfResult.fileSize;
            break;
          case 'excel':
            const excelResult = await this.generateExcel(reportData, options);
            filePath = excelResult.filePath;
            fileSize = excelResult.fileSize;
            break;
          case 'csv':
            const csvResult = await this.generateCSV(reportData, options);
            filePath = csvResult.filePath;
            fileSize = csvResult.fileSize;
            break;
          default:
            throw new Error(`Formato não suportado: ${options.format}`);
        }

        // Atualizar histórico com sucesso
        const { data: updatedHistory, error: updateError } = await rhSupabase
          .from('report_history')
          .update({
            file_path: filePath,
            file_size: fileSize,
            status: 'completed'
          })
          .eq('id', historyEntry.id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Enviar por email se solicitado
        if (options.emailTo && options.emailTo.length > 0) {
          await this.sendReportByEmail(updatedHistory, options.emailTo);
        }

        return updatedHistory;
      } catch (error) {
        // Atualizar histórico com erro
        await rhSupabase
          .from('report_history')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Erro desconhecido'
          })
          .eq('id', historyEntry.id);

        throw error;
      }
    } catch (error) {
      console.error('Erro ao gerar relatório de folha:', error);
      throw error;
    }
  }

  async generateComplianceReport(options: ReportGenerationOptions): Promise<ReportHistory> {
    try {
      const { data: historyEntry, error: historyError } = await rhSupabase
        .from('report_history')
        .insert({
          company_id: this.companyId,
          report_name: `Relatório de Conformidade - ${options.filters.periodStart} a ${options.filters.periodEnd}`,
          report_type: 'compliance',
          parameters: options.filters,
          status: 'generating'
        })
        .select()
        .single();

      if (historyError) throw historyError;

      try {
        const reportData = await this.collectComplianceData(options.filters);
        
        let filePath: string;
        let fileSize: number;

        switch (options.format) {
          case 'pdf':
            const result = await this.generatePDF(reportData, options);
            filePath = result.filePath;
            fileSize = result.fileSize;
            break;
          default:
            throw new Error(`Formato não suportado para relatório de conformidade: ${options.format}`);
        }

        const { data: updatedHistory, error: updateError } = await rhSupabase
          .from('report_history')
          .update({
            file_path: filePath,
            file_size: fileSize,
            status: 'completed'
          })
          .eq('id', historyEntry.id)
          .select()
          .single();

        if (updateError) throw updateError;

        return updatedHistory;
      } catch (error) {
        await rhSupabase
          .from('report_history')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Erro desconhecido'
          })
          .eq('id', historyEntry.id);

        throw error;
      }
    } catch (error) {
      console.error('Erro ao gerar relatório de conformidade:', error);
      throw error;
    }
  }

  // =====================================================
  // COLETA DE DADOS
  // =====================================================

  private async collectPayrollData(filters: AnalyticsFilters): Promise<ReportData> {
    try {
      // Buscar dados de folha de pagamento
      const { data: payrollData, error: payrollError } = await rhSupabase
        .from('payroll_calculations')
        .select(`
          *
        `)
        .eq('company_id', this.companyId)
        .gte('created_at', filters.periodStart)
        .lte('created_at', filters.periodEnd);

      if (payrollError) throw payrollError;

      // Buscar dados de funcionários
      const { data: employeeData, error: employeeError } = await rhSupabase
        .from('employees')
        .select(`
          id,
          nome,
          cpf,
          status,
          cost_center_id
        `)
        .eq('company_id', this.companyId)
        .eq('status', 'ativo');

      if (employeeError) throw employeeError;

      // Calcular resumo
      const totalEmployees = employeeData?.length || 0;
      const totalPayroll = payrollData?.reduce((sum, p) => sum + (p.salario_liquido || 0), 0) || 0;
      const totalDepartments = new Set(employeeData?.map(e => e.cost_center_id).filter(Boolean)).size;
      const averageSalary = totalEmployees > 0 ? totalPayroll / totalEmployees : 0;

      // Buscar dados de gráficos
      const charts = [];
      if (filters.periodStart && filters.periodEnd) {
        try {
          const trendChart = await this.analyticsService.getPayrollTrendChart(filters);
          const departmentChart = await this.analyticsService.getDepartmentDistributionChart(filters);
          const costChart = await this.analyticsService.getCostBreakdownChart(filters);
          
          charts.push(trendChart, departmentChart, costChart);
        } catch (chartError) {
          console.warn('Erro ao gerar gráficos para relatório:', chartError);
        }
      }

      return {
        title: 'Relatório de Folha de Pagamento',
        period: `${filters.periodStart} a ${filters.periodEnd}`,
        generatedAt: new Date().toISOString(),
        data: payrollData || [],
        summary: {
          totalEmployees,
          totalPayroll,
          totalDepartments,
          averageSalary
        },
        charts
      };
    } catch (error) {
      console.error('Erro ao coletar dados de folha:', error);
      throw error;
    }
  }

  private async collectComplianceData(filters: AnalyticsFilters): Promise<ReportData> {
    try {
      // Buscar dados de eSocial
      const { data: esocialData, error: esocialError } = await rhSupabase
        .from('esocial_processed_events')
        .select(`
          *,
          esocial_batches(status, created_at)
        `)
        .eq('company_id', this.companyId)
        .gte('created_at', filters.periodStart)
        .lte('created_at', filters.periodEnd);

      if (esocialError) throw esocialError;

      // Buscar dados de validações
      const { data: validationData, error: validationError } = await rhSupabase
        .from('payroll_validations')
        .select('*')
        .eq('company_id', this.companyId)
        .gte('created_at', filters.periodStart)
        .lte('created_at', filters.periodEnd);

      if (validationError) throw validationError;

      // Calcular resumo de conformidade
      const totalEvents = esocialData?.length || 0;
      const successfulEvents = esocialData?.filter(e => e.status === 'processed').length || 0;
      const failedEvents = esocialData?.filter(e => e.status === 'error').length || 0;
      const totalValidations = validationData?.length || 0;
      const passedValidations = validationData?.filter(v => v.status === 'passed').length || 0;

      return {
        title: 'Relatório de Conformidade',
        period: `${filters.periodStart} a ${filters.periodEnd}`,
        generatedAt: new Date().toISOString(),
        data: esocialData || [],
        summary: {
          totalEmployees: 0, // Não aplicável para conformidade
          totalPayroll: 0, // Não aplicável para conformidade
          totalDepartments: 0, // Não aplicável para conformidade
          averageSalary: 0 // Não aplicável para conformidade
        },
        charts: []
      };
    } catch (error) {
      console.error('Erro ao coletar dados de conformidade:', error);
      throw error;
    }
  }

  // =====================================================
  // GERAÇÃO DE ARQUIVOS
  // =====================================================

  private async generatePDF(reportData: ReportData, options: ReportGenerationOptions): Promise<{ filePath: string; fileSize: number }> {
    // Simulação de geração de PDF
    // Em produção, usar biblioteca como jsPDF ou Puppeteer
    const fileName = `relatorio_${Date.now()}.pdf`;
    const filePath = `/reports/${fileName}`;
    const fileSize = 1024 * 1024; // 1MB simulado

    // TODO: Implementar geração real de PDF
    console.log('Gerando PDF:', { reportData, options, filePath });

    return { filePath, fileSize };
  }

  private async generateExcel(reportData: ReportData, options: ReportGenerationOptions): Promise<{ filePath: string; fileSize: number }> {
    // Simulação de geração de Excel
    // Em produção, usar biblioteca como xlsx
    const fileName = `relatorio_${Date.now()}.xlsx`;
    const filePath = `/reports/${fileName}`;
    const fileSize = 512 * 1024; // 512KB simulado

    // TODO: Implementar geração real de Excel
    console.log('Gerando Excel:', { reportData, options, filePath });

    return { filePath, fileSize };
  }

  private async generateCSV(reportData: ReportData, options: ReportGenerationOptions): Promise<{ filePath: string; fileSize: number }> {
    // Simulação de geração de CSV
    const fileName = `relatorio_${Date.now()}.csv`;
    const filePath = `/reports/${fileName}`;
    const fileSize = 256 * 1024; // 256KB simulado

    // TODO: Implementar geração real de CSV
    console.log('Gerando CSV:', { reportData, options, filePath });

    return { filePath, fileSize };
  }

  // =====================================================
  // ENVIO POR EMAIL
  // =====================================================

  private async sendReportByEmail(reportHistory: ReportHistory, emailTo: string[]): Promise<void> {
    try {
      // TODO: Implementar envio real de email
      console.log('Enviando relatório por email:', { reportHistory, emailTo });
    } catch (error) {
      console.error('Erro ao enviar relatório por email:', error);
    }
  }

  // =====================================================
  // HISTÓRICO DE RELATÓRIOS
  // =====================================================

  async getReportHistory(): Promise<ReportHistory[]> {
    try {
      const { data, error } = await rhSupabase
        .from('report_history')
        .select('*')
        .eq('company_id', this.companyId)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar histórico de relatórios:', error);
      throw error;
    }
  }

  async downloadReport(reportId: string): Promise<Blob> {
    try {
      const { data: report, error } = await rhSupabase
        .from('report_history')
        .select('file_path')
        .eq('id', reportId)
        .eq('company_id', this.companyId)
        .single();

      if (error) throw error;
      if (!report?.file_path) throw new Error('Arquivo não encontrado');

      // TODO: Implementar download real do arquivo
      // Por enquanto, retornar um blob vazio
      return new Blob(['Relatório em desenvolvimento'], { type: 'text/plain' });
    } catch (error) {
      console.error('Erro ao baixar relatório:', error);
      throw error;
    }
  }

  async deleteReport(reportId: string): Promise<void> {
    try {
      const { error } = await rhSupabase
        .from('report_history')
        .delete()
        .eq('id', reportId)
        .eq('company_id', this.companyId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar relatório:', error);
      throw error;
    }
  }
}
