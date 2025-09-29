import { supabase } from '../../integrations/supabase/client';
import { PayrollCalculation } from '../../integrations/supabase/rh-types';

export interface FinancialConfig {
  id: string;
  company_id: string;
  bank_account_id?: string;
  cost_center_id?: string;
  project_id?: string;
  payment_method: 'cnab' | 'pix' | 'transfer';
  payment_day: number;
  advance_payment_days: number;
  inss_account_id?: string;
  fgts_account_id?: string;
  irrf_account_id?: string;
  union_account_id?: string;
  transport_account_id?: string;
  food_account_id?: string;
  health_account_id?: string;
  cnab_layout: '240' | '400';
  cnab_remessa_path?: string;
  cnab_retorno_path?: string;
  notify_payment: boolean;
  notify_errors: boolean;
  notification_emails: string[];
  is_active: boolean;
}

export interface GeneratedTitle {
  id: string;
  company_id: string;
  payroll_calculation_id: string;
  employee_id?: string;
  title_type: 'salary' | 'benefits' | 'taxes' | 'union' | 'advance';
  title_number: string;
  description: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  accounts_payable_id?: string;
  bank_transaction_id?: string;
  status: 'pending' | 'paid' | 'cancelled' | 'overdue';
  payment_method?: string;
  payment_reference?: string;
  cnab_sequence?: string;
  cnab_batch_id?: string;
}

export interface TaxGuide {
  id: string;
  company_id: string;
  payroll_calculation_id: string;
  guide_type: 'inss' | 'fgts' | 'irrf' | 'union' | 'rat';
  guide_number: string;
  reference_period: string;
  due_date: string;
  payment_date?: string;
  base_amount: number;
  tax_amount: number;
  fine_amount: number;
  interest_amount: number;
  total_amount: number;
  bar_code?: string;
  digitable_line?: string;
  payment_slip?: string;
  status: 'pending' | 'paid' | 'cancelled' | 'overdue';
  payment_reference?: string;
  sefaz_protocol?: string;
  sefaz_status?: string;
}

export interface PaymentBatch {
  id: string;
  company_id: string;
  payroll_calculation_id: string;
  batch_number: string;
  batch_type: 'salary' | 'benefits' | 'taxes' | 'mixed';
  description: string;
  total_amount: number;
  total_titles: number;
  cnab_file_path?: string;
  cnab_file_name?: string;
  cnab_file_size?: number;
  cnab_sequence?: string;
  status: 'pending' | 'generated' | 'sent' | 'processed' | 'error';
  sent_at?: string;
  processed_at?: string;
  return_file_path?: string;
  return_file_name?: string;
  return_processed_at?: string;
  error_message?: string;
  error_details?: any;
}

export interface CNABFile {
  id: string;
  company_id: string;
  payment_batch_id?: string;
  file_type: 'remessa' | 'retorno';
  file_name: string;
  file_path: string;
  file_size: number;
  cnab_layout: string;
  cnab_sequence: string;
  bank_code: string;
  bank_name: string;
  total_records?: number;
  total_amount?: number;
  processed_records: number;
  status: 'pending' | 'processed' | 'error';
  processed_at?: string;
  error_message?: string;
}

export interface AccountingProvision {
  id: string;
  company_id: string;
  payroll_calculation_id: string;
  provision_type: 'inss_patronal' | 'fgts' | 'rat' | 'third_party' | 'benefits';
  account_id: string;
  cost_center_id?: string;
  project_id?: string;
  base_amount: number;
  provision_amount: number;
  rate: number;
  description: string;
  reference_period: string;
  due_date: string;
  status: 'pending' | 'approved' | 'cancelled';
  approved_by?: string;
  approved_at?: string;
}

export class FinancialIntegrationService {
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  // =====================================================
  // CONFIGURAÇÃO FINANCEIRA
  // =====================================================

  async getFinancialConfig(): Promise<FinancialConfig | null> {
    const { data, error } = await supabase
      .from('payroll_financial_config')
      .select('*')
      .eq('company_id', this.companyId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Erro ao buscar configuração financeira:', error);
      return null;
    }

    return data;
  }

  async createFinancialConfig(config: Omit<FinancialConfig, 'id' | 'created_at' | 'updated_at'>): Promise<FinancialConfig | null> {
    const { data, error } = await supabase
      .from('payroll_financial_config')
      .insert([{ ...config, company_id: this.companyId }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar configuração financeira:', error);
      return null;
    }

    return data;
  }

  async updateFinancialConfig(id: string, updates: Partial<FinancialConfig>): Promise<FinancialConfig | null> {
    const { data, error } = await supabase
      .from('payroll_financial_config')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('company_id', this.companyId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar configuração financeira:', error);
      return null;
    }

    return data;
  }

  // =====================================================
  // GERAÇÃO DE TÍTULOS
  // =====================================================

  async generateTitlesFromPayroll(payrollCalculationId: string): Promise<GeneratedTitle[]> {
    try {
      // Buscar dados da folha
      const { data: payroll, error: payrollError } = await supabase
        .from('payroll_calculations')
        .select(`
          *,
          payroll_calculation_items (
            *,
            employee:employee_id (
              id,
              name,
              cpf,
              bank_account,
              bank_agency,
              bank_account_number
            )
          )
        `)
        .eq('id', payrollCalculationId)
        .eq('company_id', this.companyId)
        .single();

      if (payrollError || !payroll) {
        throw new Error('Folha de pagamento não encontrada');
      }

      const titles: GeneratedTitle[] = [];
      const config = await this.getFinancialConfig();
      if (!config) {
        throw new Error('Configuração financeira não encontrada');
      }

      // Gerar títulos para cada funcionário
      for (const item of payroll.payroll_calculation_items || []) {
        if (item.employee) {
          // Título de salário
          if (item.salary_amount > 0) {
            const salaryTitle = await this.createTitle({
              payroll_calculation_id: payrollCalculationId,
              employee_id: item.employee_id,
              title_type: 'salary',
              title_number: `SAL-${payroll.reference_period}-${item.employee_id}`,
              description: `Salário - ${item.employee.name} - ${payroll.reference_period}`,
              amount: item.salary_amount,
              due_date: this.calculateDueDate(payroll.reference_period, config.payment_day),
              status: 'pending'
            });
            if (salaryTitle) titles.push(salaryTitle);
          }

          // Título de benefícios
          if (item.benefits_amount > 0) {
            const benefitsTitle = await this.createTitle({
              payroll_calculation_id: payrollCalculationId,
              employee_id: item.employee_id,
              title_type: 'benefits',
              title_number: `BEN-${payroll.reference_period}-${item.employee_id}`,
              description: `Benefícios - ${item.employee.name} - ${payroll.reference_period}`,
              amount: item.benefits_amount,
              due_date: this.calculateDueDate(payroll.reference_period, config.payment_day),
              status: 'pending'
            });
            if (benefitsTitle) titles.push(benefitsTitle);
          }
        }
      }

      // Gerar títulos para encargos
      const employerCharges = payroll.employer_charges || {};
      
      if (employerCharges.inss_patronal > 0) {
        const inssTitle = await this.createTitle({
          payroll_calculation_id: payrollCalculationId,
          title_type: 'taxes',
          title_number: `INSS-${payroll.reference_period}`,
          description: `INSS Patronal - ${payroll.reference_period}`,
          amount: employerCharges.inss_patronal,
          due_date: this.calculateDueDate(payroll.reference_period, config.payment_day),
          status: 'pending'
        });
        if (inssTitle) titles.push(inssTitle);
      }

      if (employerCharges.fgts > 0) {
        const fgtsTitle = await this.createTitle({
          payroll_calculation_id: payrollCalculationId,
          title_type: 'taxes',
          title_number: `FGTS-${payroll.reference_period}`,
          description: `FGTS - ${payroll.reference_period}`,
          amount: employerCharges.fgts,
          due_date: this.calculateDueDate(payroll.reference_period, config.payment_day),
          status: 'pending'
        });
        if (fgtsTitle) titles.push(fgtsTitle);
      }

      return titles;
    } catch (error) {
      console.error('Erro ao gerar títulos da folha:', error);
      throw error;
    }
  }

  private async createTitle(titleData: Omit<GeneratedTitle, 'id' | 'company_id' | 'created_at' | 'updated_at'>): Promise<GeneratedTitle | null> {
    const { data, error } = await supabase
      .from('payroll_generated_titles')
      .insert([{ ...titleData, company_id: this.companyId }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar título:', error);
      return null;
    }

    return data;
  }

  private calculateDueDate(referencePeriod: string, paymentDay: number): string {
    const [year, month] = referencePeriod.split('-');
    const dueDate = new Date(parseInt(year), parseInt(month), paymentDay);
    return dueDate.toISOString().split('T')[0];
  }

  // =====================================================
  // GUIAS DE RECOLHIMENTO
  // =====================================================

  async generateTaxGuides(payrollCalculationId: string): Promise<TaxGuide[]> {
    try {
      const { data: payroll, error: payrollError } = await supabase
        .from('payroll_calculations')
        .select('*')
        .eq('id', payrollCalculationId)
        .eq('company_id', this.companyId)
        .single();

      if (payrollError || !payroll) {
        throw new Error('Folha de pagamento não encontrada');
      }

      const guides: TaxGuide[] = [];
      const employerCharges = payroll.employer_charges || {};

      // Guia de INSS
      if (employerCharges.inss_patronal > 0) {
        const inssGuide = await this.createTaxGuide({
          payroll_calculation_id: payrollCalculationId,
          guide_type: 'inss',
          guide_number: `INSS-${payroll.reference_period}`,
          reference_period: payroll.reference_period,
          due_date: this.calculateTaxDueDate(payroll.reference_period, 'inss'),
          base_amount: payroll.total_salary,
          tax_amount: employerCharges.inss_patronal,
          total_amount: employerCharges.inss_patronal,
          status: 'pending'
        });
        if (inssGuide) guides.push(inssGuide);
      }

      // Guia de FGTS
      if (employerCharges.fgts > 0) {
        const fgtsGuide = await this.createTaxGuide({
          payroll_calculation_id: payrollCalculationId,
          guide_type: 'fgts',
          guide_number: `FGTS-${payroll.reference_period}`,
          reference_period: payroll.reference_period,
          due_date: this.calculateTaxDueDate(payroll.reference_period, 'fgts'),
          base_amount: payroll.total_salary,
          tax_amount: employerCharges.fgts,
          total_amount: employerCharges.fgts,
          status: 'pending'
        });
        if (fgtsGuide) guides.push(fgtsGuide);
      }

      // Guia de IRRF (se houver)
      if (employerCharges.irrf > 0) {
        const irrfGuide = await this.createTaxGuide({
          payroll_calculation_id: payrollCalculationId,
          guide_type: 'irrf',
          guide_number: `IRRF-${payroll.reference_period}`,
          reference_period: payroll.reference_period,
          due_date: this.calculateTaxDueDate(payroll.reference_period, 'irrf'),
          base_amount: payroll.total_salary,
          tax_amount: employerCharges.irrf,
          total_amount: employerCharges.irrf,
          status: 'pending'
        });
        if (irrfGuide) guides.push(irrfGuide);
      }

      return guides;
    } catch (error) {
      console.error('Erro ao gerar guias de recolhimento:', error);
      throw error;
    }
  }

  private async createTaxGuide(guideData: Omit<TaxGuide, 'id' | 'company_id' | 'created_at' | 'updated_at'>): Promise<TaxGuide | null> {
    const { data, error } = await supabase
      .from('payroll_tax_guides')
      .insert([{ ...guideData, company_id: this.companyId }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar guia de recolhimento:', error);
      return null;
    }

    return data;
  }

  private calculateTaxDueDate(referencePeriod: string, taxType: string): string {
    const [year, month] = referencePeriod.split('-');
    let dueDay = 7; // Dia padrão

    // Ajustar dia de vencimento por tipo de imposto
    switch (taxType) {
      case 'inss':
        dueDay = 7;
        break;
      case 'fgts':
        dueDay = 7;
        break;
      case 'irrf':
        dueDay = 31;
        break;
    }

    const dueDate = new Date(parseInt(year), parseInt(month), dueDay);
    return dueDate.toISOString().split('T')[0];
  }

  // =====================================================
  // LOTES DE PAGAMENTO
  // =====================================================

  async createPaymentBatch(payrollCalculationId: string, batchType: 'salary' | 'benefits' | 'taxes' | 'mixed'): Promise<PaymentBatch | null> {
    try {
      const { data: payroll, error: payrollError } = await supabase
        .from('payroll_calculations')
        .select('*')
        .eq('id', payrollCalculationId)
        .eq('company_id', this.companyId)
        .single();

      if (payrollError || !payroll) {
        throw new Error('Folha de pagamento não encontrada');
      }

      // Buscar títulos pendentes
      const { data: titles, error: titlesError } = await supabase
        .from('payroll_generated_titles')
        .select('*')
        .eq('payroll_calculation_id', payrollCalculationId)
        .eq('company_id', this.companyId)
        .eq('status', 'pending');

      if (titlesError) {
        throw new Error('Erro ao buscar títulos');
      }

      const batchNumber = `LOTE-${payroll.reference_period}-${Date.now()}`;
      const totalAmount = titles?.reduce((sum, title) => sum + title.amount, 0) || 0;

      const batch = await this.createPaymentBatchRecord({
        payroll_calculation_id: payrollCalculationId,
        batch_number: batchNumber,
        batch_type: batchType,
        description: `Lote de pagamento - ${payroll.reference_period}`,
        total_amount: totalAmount,
        total_titles: titles?.length || 0,
        status: 'pending'
      });

      return batch;
    } catch (error) {
      console.error('Erro ao criar lote de pagamento:', error);
      throw error;
    }
  }

  private async createPaymentBatchRecord(batchData: Omit<PaymentBatch, 'id' | 'company_id' | 'created_at' | 'updated_at'>): Promise<PaymentBatch | null> {
    const { data, error } = await supabase
      .from('payroll_payment_batches')
      .insert([{ ...batchData, company_id: this.companyId }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar lote de pagamento:', error);
      return null;
    }

    return data;
  }

  // =====================================================
  // ARQUIVOS CNAB
  // =====================================================

  async generateCNABFile(paymentBatchId: string): Promise<CNABFile | null> {
    try {
      const { data: batch, error: batchError } = await supabase
        .from('payroll_payment_batches')
        .select(`
          *,
          payroll_calculations (
            *,
            payroll_calculation_items (
              *,
              employee:employee_id (
                id,
                name,
                cpf,
                bank_account,
                bank_agency,
                bank_account_number
              )
            )
          )
        `)
        .eq('id', paymentBatchId)
        .eq('company_id', this.companyId)
        .single();

      if (batchError || !batch) {
        throw new Error('Lote de pagamento não encontrado');
      }

      const config = await this.getFinancialConfig();
      if (!config) {
        throw new Error('Configuração financeira não encontrada');
      }

      // Gerar arquivo CNAB
      const cnabData = this.generateCNABData(batch, config);
      const fileName = `CNAB-${batch.batch_number}-${Date.now()}.txt`;
      const filePath = `${config.cnab_remessa_path}/${fileName}`;

      // Salvar arquivo (simulação)
      const fileSize = cnabData.length;

      const cnabFile = await this.createCNABFile({
        payment_batch_id: paymentBatchId,
        file_type: 'remessa',
        file_name: fileName,
        file_path: filePath,
        file_size: fileSize,
        cnab_layout: config.cnab_layout,
        cnab_sequence: batch.batch_number,
        bank_code: '001', // Código do banco (exemplo)
        bank_name: 'Banco do Brasil',
        total_records: batch.total_titles,
        total_amount: batch.total_amount,
        status: 'pending'
      });

      // Atualizar status do lote
      await this.updatePaymentBatchStatus(paymentBatchId, 'generated');

      return cnabFile;
    } catch (error) {
      console.error('Erro ao gerar arquivo CNAB:', error);
      throw error;
    }
  }

  private generateCNABData(batch: any, config: any): string {
    // Implementação simplificada do CNAB
    // Em produção, usar biblioteca específica para CNAB
    let cnabContent = '';
    
    // Cabeçalho do arquivo
    cnabContent += `01REMESSA01CNAB240001BANCO DO BRASIL${new Date().toISOString().slice(0,10).replace(/-/g, '')}${batch.batch_number.padEnd(20, ' ')}\n`;
    
    // Registros de títulos
    for (const item of batch.payroll_calculations?.payroll_calculation_items || []) {
      if (item.employee) {
        cnabContent += `1${item.employee.cpf.padStart(11, '0')}${item.employee.bank_agency.padStart(5, '0')}${item.employee.bank_account_number.padStart(12, '0')}${item.salary_amount.toFixed(2).replace('.', '').padStart(15, '0')}\n`;
      }
    }
    
    // Rodapé do arquivo
    cnabContent += `9${batch.total_titles.toString().padStart(6, '0')}${batch.total_amount.toFixed(2).replace('.', '').padStart(15, '0')}\n`;
    
    return cnabContent;
  }

  private async createCNABFile(fileData: Omit<CNABFile, 'id' | 'company_id' | 'created_at'>): Promise<CNABFile | null> {
    const { data, error } = await supabase
      .from('payroll_cnab_files')
      .insert([{ ...fileData, company_id: this.companyId }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar arquivo CNAB:', error);
      return null;
    }

    return data;
  }

  private async updatePaymentBatchStatus(batchId: string, status: string): Promise<void> {
    await supabase
      .from('payroll_payment_batches')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
        ...(status === 'generated' && { sent_at: new Date().toISOString() })
      })
      .eq('id', batchId)
      .eq('company_id', this.companyId);
  }

  // =====================================================
  // PROVISÕES CONTÁBEIS
  // =====================================================

  async generateAccountingProvisions(payrollCalculationId: string): Promise<AccountingProvision[]> {
    try {
      const { data: payroll, error: payrollError } = await supabase
        .from('payroll_calculations')
        .select('*')
        .eq('id', payrollCalculationId)
        .eq('company_id', this.companyId)
        .single();

      if (payrollError || !payroll) {
        throw new Error('Folha de pagamento não encontrada');
      }

      const provisions: AccountingProvision[] = [];
      const employerCharges = payroll.employer_charges || {};

      // Provisão de INSS Patronal
      if (employerCharges.inss_patronal > 0) {
        const inssProvision = await this.createAccountingProvision({
          payroll_calculation_id: payrollCalculationId,
          provision_type: 'inss_patronal',
          account_id: 'inss-account-id', // ID da conta contábil
          base_amount: payroll.total_salary,
          provision_amount: employerCharges.inss_patronal,
          rate: 0.20, // Taxa padrão do INSS patronal
          description: `Provisão INSS Patronal - ${payroll.reference_period}`,
          reference_period: payroll.reference_period,
          due_date: this.calculateTaxDueDate(payroll.reference_period, 'inss'),
          status: 'pending'
        });
        if (inssProvision) provisions.push(inssProvision);
      }

      // Provisão de FGTS
      if (employerCharges.fgts > 0) {
        const fgtsProvision = await this.createAccountingProvision({
          payroll_calculation_id: payrollCalculationId,
          provision_type: 'fgts',
          account_id: 'fgts-account-id', // ID da conta contábil
          base_amount: payroll.total_salary,
          provision_amount: employerCharges.fgts,
          rate: 0.08, // Taxa padrão do FGTS
          description: `Provisão FGTS - ${payroll.reference_period}`,
          reference_period: payroll.reference_period,
          due_date: this.calculateTaxDueDate(payroll.reference_period, 'fgts'),
          status: 'pending'
        });
        if (fgtsProvision) provisions.push(fgtsProvision);
      }

      return provisions;
    } catch (error) {
      console.error('Erro ao gerar provisões contábeis:', error);
      throw error;
    }
  }

  private async createAccountingProvision(provisionData: Omit<AccountingProvision, 'id' | 'company_id' | 'created_at' | 'updated_at'>): Promise<AccountingProvision | null> {
    const { data, error } = await supabase
      .from('payroll_accounting_provisions')
      .insert([{ ...provisionData, company_id: this.companyId }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar provisão contábil:', error);
      return null;
    }

    return data;
  }

  // =====================================================
  // MÉTODOS DE CONSULTA
  // =====================================================

  async getGeneratedTitles(filters?: {
    payroll_calculation_id?: string;
    employee_id?: string;
    status?: string;
    title_type?: string;
  }): Promise<GeneratedTitle[]> {
    let query = supabase
      .from('payroll_generated_titles')
      .select('*')
      .eq('company_id', this.companyId);

    if (filters?.payroll_calculation_id) {
      query = query.eq('payroll_calculation_id', filters.payroll_calculation_id);
    }
    if (filters?.employee_id) {
      query = query.eq('employee_id', filters.employee_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.title_type) {
      query = query.eq('title_type', filters.title_type);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar títulos gerados:', error);
      return [];
    }

    return data || [];
  }

  async getTaxGuides(filters?: {
    payroll_calculation_id?: string;
    guide_type?: string;
    status?: string;
  }): Promise<TaxGuide[]> {
    let query = supabase
      .from('payroll_tax_guides')
      .select('*')
      .eq('company_id', this.companyId);

    if (filters?.payroll_calculation_id) {
      query = query.eq('payroll_calculation_id', filters.payroll_calculation_id);
    }
    if (filters?.guide_type) {
      query = query.eq('guide_type', filters.guide_type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar guias de recolhimento:', error);
      return [];
    }

    return data || [];
  }

  async getPaymentBatches(filters?: {
    payroll_calculation_id?: string;
    batch_type?: string;
    status?: string;
  }): Promise<PaymentBatch[]> {
    let query = supabase
      .from('payroll_payment_batches')
      .select('*')
      .eq('company_id', this.companyId);

    if (filters?.payroll_calculation_id) {
      query = query.eq('payroll_calculation_id', filters.payroll_calculation_id);
    }
    if (filters?.batch_type) {
      query = query.eq('batch_type', filters.batch_type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar lotes de pagamento:', error);
      return [];
    }

    return data || [];
  }

  async getCNABFiles(filters?: {
    payment_batch_id?: string;
    file_type?: string;
    status?: string;
  }): Promise<CNABFile[]> {
    let query = supabase
      .from('payroll_cnab_files')
      .select('*')
      .eq('company_id', this.companyId);

    if (filters?.payment_batch_id) {
      query = query.eq('payment_batch_id', filters.payment_batch_id);
    }
    if (filters?.file_type) {
      query = query.eq('file_type', filters.file_type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar arquivos CNAB:', error);
      return [];
    }

    return data || [];
  }

  async getAccountingProvisions(filters?: {
    payroll_calculation_id?: string;
    provision_type?: string;
    status?: string;
  }): Promise<AccountingProvision[]> {
    let query = supabase
      .from('payroll_accounting_provisions')
      .select('*')
      .eq('company_id', this.companyId);

    if (filters?.payroll_calculation_id) {
      query = query.eq('payroll_calculation_id', filters.payroll_calculation_id);
    }
    if (filters?.provision_type) {
      query = query.eq('provision_type', filters.provision_type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar provisões contábeis:', error);
      return [];
    }

    return data || [];
  }
}

