import { supabase } from '@/integrations/supabase/client';

export interface FinancialServiceConfig {
  companyId: string;
}

export class FinancialService {
  private companyId: string;

  constructor(config: FinancialServiceConfig) {
    this.companyId = config.companyId;
  }

  // Contas a Pagar
  async getAccountsPayable(filters?: any) {
    let query = supabase
      .from('accounts_payable')
      .select(`
        *,
        cost_centers:cost_center_id(id, nome),
        projects:project_id(id, nome)
      `)
      .eq('company_id', this.companyId)
      .order('data_vencimento', { ascending: true });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'data_inicio') {
            query = query.gte('data_vencimento', value);
          } else if (key === 'data_fim') {
            query = query.lte('data_vencimento', value);
          } else if (key === 'valor_min') {
            query = query.gte('valor', value);
          } else if (key === 'valor_max') {
            query = query.lte('valor', value);
          } else {
            query = query.eq(key, value);
          }
        }
      });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async createAccountsPayable(data: any) {
    const { data: result, error } = await supabase
      .from('accounts_payable')
      .insert([{ ...data, company_id: this.companyId }])
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async updateAccountsPayable(id: string, data: any) {
    const { data: result, error } = await supabase
      .from('accounts_payable')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async deleteAccountsPayable(id: string) {
    const { error } = await supabase
      .from('accounts_payable')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Contas a Receber
  async getAccountsReceivable(filters?: any) {
    let query = supabase
      .from('accounts_receivable')
      .select(`
        *,
        cost_centers:cost_center_id(id, nome),
        projects:project_id(id, nome)
      `)
      .eq('company_id', this.companyId)
      .order('data_vencimento', { ascending: true });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'data_inicio') {
            query = query.gte('data_vencimento', value);
          } else if (key === 'data_fim') {
            query = query.lte('data_vencimento', value);
          } else if (key === 'valor_min') {
            query = query.gte('valor', value);
          } else if (key === 'valor_max') {
            query = query.lte('valor', value);
          } else {
            query = query.eq(key, value);
          }
        }
      });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async createAccountsReceivable(data: any) {
    const { data: result, error } = await supabase
      .from('accounts_receivable')
      .insert([{ ...data, company_id: this.companyId }])
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async updateAccountsReceivable(id: string, data: any) {
    const { data: result, error } = await supabase
      .from('accounts_receivable')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async deleteAccountsReceivable(id: string) {
    const { error } = await supabase
      .from('accounts_receivable')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Contas Bancárias
  async getBankAccounts() {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('company_id', this.companyId)
      .order('banco', { ascending: true });

    if (error) throw error;
    return data;
  }

  async createBankAccount(data: any) {
    const { data: result, error } = await supabase
      .from('bank_accounts')
      .insert([{ ...data, company_id: this.companyId }])
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async updateBankAccount(id: string, data: any) {
    const { data: result, error } = await supabase
      .from('bank_accounts')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async deleteBankAccount(id: string) {
    const { error } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Transações Bancárias
  async getBankTransactions(filters?: any) {
    let query = supabase
      .from('bank_transactions')
      .select(`
        *,
        bank_accounts:bank_account_id(id, banco, conta)
      `)
      .eq('company_id', this.companyId)
      .order('data_movimento', { ascending: false });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'data_inicio') {
            query = query.gte('data_movimento', value);
          } else if (key === 'data_fim') {
            query = query.lte('data_movimento', value);
          } else if (key === 'descricao') {
            query = query.ilike('descricao', `%${value}%`);
          } else {
            query = query.eq(key, value);
          }
        }
      });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async createBankTransaction(data: any) {
    const { data: result, error } = await supabase
      .from('bank_transactions')
      .insert([{ ...data, company_id: this.companyId }])
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async updateBankTransaction(id: string, data: any) {
    const { data: result, error } = await supabase
      .from('bank_transactions')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async deleteBankTransaction(id: string) {
    const { error } = await supabase
      .from('bank_transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Plano de Contas
  async getChartAccounts() {
    const { data, error } = await supabase
      .from('chart_accounts')
      .select('*')
      .eq('company_id', this.companyId)
      .order('codigo', { ascending: true });

    if (error) throw error;
    return data;
  }

  async createChartAccount(data: any) {
    const { data: result, error } = await supabase
      .from('chart_accounts')
      .insert([{ ...data, company_id: this.companyId }])
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async updateChartAccount(id: string, data: any) {
    const { data: result, error } = await supabase
      .from('chart_accounts')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async deleteChartAccount(id: string) {
    const { error } = await supabase
      .from('chart_accounts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Integração SEFAZ
  async getSefazIntegrations() {
    const { data, error } = await supabase
      .from('sefaz_integration')
      .select('*')
      .eq('company_id', this.companyId)
      .order('uf', { ascending: true });

    if (error) throw error;
    return data;
  }

  async createSefazIntegration(data: any) {
    const { data: result, error } = await supabase
      .from('sefaz_integration')
      .insert([{ ...data, company_id: this.companyId }])
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async updateSefazIntegration(id: string, data: any) {
    const { data: result, error } = await supabase
      .from('sefaz_integration')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async deleteSefazIntegration(id: string) {
    const { error } = await supabase
      .from('sefaz_integration')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getSefazStatus() {
    const { data, error } = await supabase
      .from('sefaz_status')
      .select('*')
      .eq('company_id', this.companyId)
      .order('uf', { ascending: true });

    if (error) throw error;
    return data;
  }

  async getInvoices(filters?: any) {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        invoice_items(*)
      `)
      .eq('company_id', this.companyId)
      .order('data_emissao', { ascending: false });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'data_inicio') {
            query = query.gte('data_emissao', value);
          } else if (key === 'data_fim') {
            query = query.lte('data_emissao', value);
          } else {
            query = query.eq(key, value);
          }
        }
      });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Relatórios e KPIs
  async getAccountsPayableAging() {
    const { data, error } = await supabase
      .rpc('get_accounts_payable_aging', { company_id: this.companyId });

    if (error) throw error;
    return data;
  }

  async getAccountsReceivableAging() {
    const { data, error } = await supabase
      .rpc('get_accounts_receivable_aging', { company_id: this.companyId });

    if (error) throw error;
    return data;
  }

  async getAccountsPayableTotals() {
    const { data, error } = await supabase
      .rpc('get_accounts_payable_totals', { company_id: this.companyId });

    if (error) throw error;
    return data;
  }

  async getAccountsReceivableTotals() {
    const { data, error } = await supabase
      .rpc('get_accounts_receivable_totals', { company_id: this.companyId });

    if (error) throw error;
    return data;
  }

  async calculateDSO() {
    const { data, error } = await supabase
      .rpc('calculate_dso', { company_id: this.companyId });

    if (error) throw error;
    return data;
  }

  async getCashFlowProjection(days: number = 90) {
    const { data, error } = await supabase
      .rpc('get_cash_flow_projection', { 
        company_id: this.companyId,
        days_ahead: days 
      });

    if (error) throw error;
    return data;
  }

  async getBankReconciliation(bankAccountId: string, dataInicio: string, dataFim: string) {
    const { data, error } = await supabase
      .rpc('get_bank_reconciliation', { 
        bank_account_id: bankAccountId,
        data_inicio: dataInicio,
        data_fim: dataFim
      });

    if (error) throw error;
    return data;
  }

  // SEFAZ Operations
  async testSefazConnection(integrationId: string) {
    const { data, error } = await supabase
      .rpc('test_sefaz_connection', { integration_id: integrationId });

    if (error) throw error;
    return data;
  }

  async processNfeXml(filePath: string, uf: string) {
    const { data, error } = await supabase
      .rpc('process_nfe_xml', { 
        file_path: filePath,
        company_id: this.companyId,
        uf: uf
      });

    if (error) throw error;
    return data;
  }

  async consultNfeStatus(chaveAcesso: string, uf: string) {
    const { data, error } = await supabase
      .rpc('consult_nfe_status', { 
        chave_acesso: chaveAcesso,
        uf: uf,
        company_id: this.companyId
      });

    if (error) throw error;
    return data;
  }

  async cancelNfe(invoiceId: string, justificativa: string) {
    const { data, error } = await supabase
      .rpc('cancel_nfe', { 
        invoice_id: invoiceId,
        justificativa: justificativa,
        company_id: this.companyId
      });

    if (error) throw error;
    return data;
  }

  async inutilizeNfe(serie: string, numeroInicial: number, numeroFinal: number, justificativa: string, uf: string) {
    const { data, error } = await supabase
      .rpc('inutilize_nfe', { 
        serie: serie,
        numero_inicial: numeroInicial,
        numero_final: numeroFinal,
        justificativa: justificativa,
        uf: uf,
        company_id: this.companyId
      });

    if (error) throw error;
    return data;
  }

  async getNfeXml(invoiceId: string) {
    const { data, error } = await supabase
      .rpc('get_nfe_xml', { 
        invoice_id: invoiceId,
        company_id: this.companyId
      });

    if (error) throw error;
    return data;
  }

  async generateDanfe(invoiceId: string) {
    const { data, error } = await supabase
      .rpc('generate_danfe', { 
        invoice_id: invoiceId,
        company_id: this.companyId
      });

    if (error) throw error;
    return data;
  }
}



