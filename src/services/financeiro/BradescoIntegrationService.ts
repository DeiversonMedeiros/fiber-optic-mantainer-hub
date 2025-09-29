import { supabase } from '../../integrations/supabase/client';

export interface BradescoConfig {
  id: string;
  company_id: string;
  client_id: string;
  client_secret: string;
  certificate_path: string;
  certificate_password?: string;
  environment: 'sandbox' | 'production';
  api_base_url: string;
  api_version: string;
  bank_code: string;
  bank_name: string;
  agency_number: string;
  account_number: string;
  account_digit: string;
  account_type: 'checking' | 'savings' | 'business';
  cnab_layout: '240' | '400';
  cnab_remessa_path: string;
  cnab_retorno_path: string;
  cnab_sequence: string;
  encryption_key?: string;
  webhook_url?: string;
  webhook_secret?: string;
  notify_success: boolean;
  notify_errors: boolean;
  notification_emails: string[];
  is_active: boolean;
  last_sync_at?: string;
  last_error?: string;
  error_count: number;
}

export interface AuthToken {
  id: string;
  company_id: string;
  config_id: string;
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  issued_at: string;
  expires_at: string;
  is_valid: boolean;
  refresh_token?: string;
  refresh_expires_at?: string;
}

export interface BankTransaction {
  id: string;
  company_id: string;
  config_id: string;
  transaction_id: string;
  external_id?: string;
  transaction_type: 'transfer' | 'pix' | 'payment' | 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  description?: string;
  from_account?: string;
  to_account?: string;
  to_name?: string;
  to_document?: string;
  to_bank_code?: string;
  to_agency?: string;
  to_account_number?: string;
  pix_key?: string;
  pix_key_type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  status_message?: string;
  processed_at?: string;
  completed_at?: string;
  failed_at?: string;
  bank_response?: any;
  error_code?: string;
  error_message?: string;
  reconciled: boolean;
  reconciled_at?: string;
  reconciliation_id?: string;
}

export interface BankStatement {
  id: string;
  company_id: string;
  config_id: string;
  statement_date: string;
  opening_balance: number;
  closing_balance: number;
  total_credits: number;
  total_debits: number;
  sync_type: 'api' | 'cnab' | 'manual';
  sync_status: 'pending' | 'processing' | 'completed' | 'failed';
  sync_started_at?: string;
  sync_completed_at?: string;
  sync_error?: string;
  file_name?: string;
  file_path?: string;
  file_size?: number;
  is_processed: boolean;
  processed_at?: string;
}

export interface StatementItem {
  id: string;
  company_id: string;
  statement_id: string;
  transaction_date: string;
  value_date?: string;
  description: string;
  amount: number;
  balance: number;
  bank_code?: string;
  agency?: string;
  account?: string;
  check_number?: string;
  document_number?: string;
  transaction_type?: string;
  category?: string;
  subcategory?: string;
  reconciled: boolean;
  reconciled_at?: string;
  reconciliation_notes?: string;
  external_id?: string;
  reference_id?: string;
  reference_type?: string;
}

export interface PaymentBatch {
  id: string;
  company_id: string;
  config_id: string;
  batch_number: string;
  batch_type: 'salary' | 'supplier' | 'tax' | 'mixed';
  description: string;
  total_amount: number;
  total_transactions: number;
  processed_amount: number;
  processed_transactions: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  status_message?: string;
  submitted_at?: string;
  processed_at?: string;
  completed_at?: string;
  failed_at?: string;
  bank_batch_id?: string;
  bank_response?: any;
  error_code?: string;
  error_message?: string;
  cnab_file_path?: string;
  cnab_file_name?: string;
  return_file_path?: string;
  return_file_name?: string;
}

export interface PaymentBatchItem {
  id: string;
  company_id: string;
  batch_id: string;
  transaction_id?: string;
  payment_type: 'transfer' | 'pix' | 'ted' | 'doc';
  amount: number;
  description: string;
  beneficiary_name: string;
  beneficiary_document: string;
  beneficiary_bank_code?: string;
  beneficiary_agency?: string;
  beneficiary_account?: string;
  beneficiary_account_digit?: string;
  pix_key?: string;
  pix_key_type?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  status_message?: string;
  processed_at?: string;
  completed_at?: string;
  failed_at?: string;
  bank_transaction_id?: string;
  bank_response?: any;
  error_code?: string;
  error_message?: string;
  reconciled: boolean;
  reconciled_at?: string;
}

export class BradescoIntegrationService {
  private companyId: string;
  private config: BradescoConfig | null = null;
  private authToken: AuthToken | null = null;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  // =====================================================
  // CONFIGURAÇÃO
  // =====================================================

  async getConfig(): Promise<BradescoConfig | null> {
    if (this.config) return this.config;

    const { data, error } = await supabase
      .from('bradesco_integration_config')
      .select('*')
      .eq('company_id', this.companyId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Erro ao buscar configuração do Bradesco:', error);
      return null;
    }

    this.config = data;
    return data;
  }

  async createConfig(config: Omit<BradescoConfig, 'id' | 'created_at' | 'updated_at'>): Promise<BradescoConfig | null> {
    const { data, error } = await supabase
      .from('bradesco_integration_config')
      .insert([{ ...config, company_id: this.companyId }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar configuração do Bradesco:', error);
      return null;
    }

    this.config = data;
    return data;
  }

  async updateConfig(id: string, updates: Partial<BradescoConfig>): Promise<BradescoConfig | null> {
    const { data, error } = await supabase
      .from('bradesco_integration_config')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('company_id', this.companyId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar configuração do Bradesco:', error);
      return null;
    }

    this.config = data;
    return data;
  }

  // =====================================================
  // AUTENTICAÇÃO
  // =====================================================

  async authenticate(): Promise<AuthToken | null> {
    const config = await this.getConfig();
    if (!config) {
      throw new Error('Configuração do Bradesco não encontrada');
    }

    // Verificar se há token válido
    const validToken = await this.getValidToken(config.id);
    if (validToken) {
      this.authToken = validToken;
      return validToken;
    }

    // Gerar novo token
    const newToken = await this.generateAuthToken(config);
    if (newToken) {
      this.authToken = newToken;
      return newToken;
    }

    return null;
  }

  private async getValidToken(configId: string): Promise<AuthToken | null> {
    const { data, error } = await supabase
      .from('bradesco_auth_tokens')
      .select('*')
      .eq('config_id', configId)
      .eq('is_valid', true)
      .gt('expires_at', new Date().toISOString())
      .order('issued_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data;
  }

  private async generateAuthToken(config: BradescoConfig): Promise<AuthToken | null> {
    try {
      // Simular chamada para API do Bradesco
      // Em produção, usar a API real com certificado digital
      const tokenData = {
        access_token: `bradesco_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'payments transfers statements',
        refresh_token: `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      const { data, error } = await supabase
        .from('bradesco_auth_tokens')
        .insert([{
          company_id: this.companyId,
          config_id: config.id,
          access_token: tokenData.access_token,
          token_type: tokenData.token_type,
          expires_in: tokenData.expires_in,
          scope: tokenData.scope,
          expires_at: expiresAt.toISOString(),
          is_valid: true,
          refresh_token: tokenData.refresh_token,
          refresh_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar token de autenticação:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao gerar token de autenticação:', error);
      return null;
    }
  }

  // =====================================================
  // TRANSAÇÕES
  // =====================================================

  async createTransaction(transactionData: Omit<BankTransaction, 'id' | 'company_id' | 'config_id' | 'created_at' | 'updated_at'>): Promise<BankTransaction | null> {
    const config = await this.getConfig();
    if (!config) {
      throw new Error('Configuração do Bradesco não encontrada');
    }

    const { data, error } = await supabase
      .from('bradesco_transactions')
      .insert([{
        ...transactionData,
        company_id: this.companyId,
        config_id: config.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar transação:', error);
      return null;
    }

    return data;
  }

  async processTransaction(transactionId: string): Promise<BankTransaction | null> {
    const config = await this.getConfig();
    if (!config) {
      throw new Error('Configuração do Bradesco não encontrada');
    }

    // Buscar transação
    const { data: transaction, error: fetchError } = await supabase
      .from('bradesco_transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('company_id', this.companyId)
      .single();

    if (fetchError || !transaction) {
      throw new Error('Transação não encontrada');
    }

    try {
      // Simular processamento via API do Bradesco
      const result = await this.callBradescoAPI('POST', '/transactions', {
        transaction_id: transaction.transaction_id,
        amount: transaction.amount,
        to_account: transaction.to_account,
        description: transaction.description
      });

      // Atualizar status da transação
      const { data, error } = await supabase
        .from('bradesco_transactions')
        .update({
          status: 'completed',
          status_message: 'Transação processada com sucesso',
          processed_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          bank_response: result,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        .eq('company_id', this.companyId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar transação:', error);
        return null;
      }

      return data;
    } catch (error) {
      // Atualizar status de erro
      await supabase
        .from('bradesco_transactions')
        .update({
          status: 'failed',
          status_message: error instanceof Error ? error.message : 'Erro desconhecido',
          failed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Erro desconhecido',
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        .eq('company_id', this.companyId);

      throw error;
    }
  }

  // =====================================================
  // EXTRATOS BANCÁRIOS
  // =====================================================

  async syncBankStatement(startDate: string, endDate: string): Promise<BankStatement | null> {
    const config = await this.getConfig();
    if (!config) {
      throw new Error('Configuração do Bradesco não encontrada');
    }

    try {
      // Criar registro de extrato
      const { data: statement, error: createError } = await supabase
        .from('bradesco_bank_statements')
        .insert([{
          company_id: this.companyId,
          config_id: config.id,
          statement_date: endDate,
          opening_balance: 0, // Será atualizado pela API
          closing_balance: 0, // Será atualizado pela API
          sync_type: 'api',
          sync_status: 'processing',
          sync_started_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) {
        throw new Error('Erro ao criar extrato bancário');
      }

      // Simular chamada para API do Bradesco
      const statementData = await this.callBradescoAPI('GET', '/statements', {
        start_date: startDate,
        end_date: endDate,
        account_number: config.account_number
      });

      // Atualizar extrato com dados da API
      const { data: updatedStatement, error: updateError } = await supabase
        .from('bradesco_bank_statements')
        .update({
          opening_balance: statementData.opening_balance,
          closing_balance: statementData.closing_balance,
          total_credits: statementData.total_credits,
          total_debits: statementData.total_debits,
          sync_status: 'completed',
          sync_completed_at: new Date().toISOString(),
          is_processed: true,
          processed_at: new Date().toISOString()
        })
        .eq('id', statement.id)
        .eq('company_id', this.companyId)
        .select()
        .single();

      if (updateError) {
        throw new Error('Erro ao atualizar extrato bancário');
      }

      // Processar itens do extrato
      if (statementData.items && statementData.items.length > 0) {
        await this.processStatementItems(statement.id, statementData.items);
      }

      return updatedStatement;
    } catch (error) {
      console.error('Erro ao sincronizar extrato bancário:', error);
      throw error;
    }
  }

  private async processStatementItems(statementId: string, items: any[]): Promise<void> {
    const itemsToInsert = items.map(item => ({
      company_id: this.companyId,
      statement_id: statementId,
      transaction_date: item.transaction_date,
      value_date: item.value_date,
      description: item.description,
      amount: item.amount,
      balance: item.balance,
      bank_code: item.bank_code,
      agency: item.agency,
      account: item.account,
      check_number: item.check_number,
      document_number: item.document_number,
      transaction_type: item.transaction_type,
      category: item.category,
      subcategory: item.subcategory,
      external_id: item.external_id
    }));

    const { error } = await supabase
      .from('bradesco_statement_items')
      .insert(itemsToInsert);

    if (error) {
      console.error('Erro ao processar itens do extrato:', error);
      throw error;
    }
  }

  // =====================================================
  // LOTES DE PAGAMENTO
  // =====================================================

  async createPaymentBatch(batchData: Omit<PaymentBatch, 'id' | 'company_id' | 'config_id' | 'created_at' | 'updated_at'>): Promise<PaymentBatch | null> {
    const config = await this.getConfig();
    if (!config) {
      throw new Error('Configuração do Bradesco não encontrada');
    }

    const { data, error } = await supabase
      .from('bradesco_payment_batches')
      .insert([{
        ...batchData,
        company_id: this.companyId,
        config_id: config.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar lote de pagamento:', error);
      return null;
    }

    return data;
  }

  async addPaymentToBatch(batchId: string, paymentData: Omit<PaymentBatchItem, 'id' | 'company_id' | 'batch_id' | 'created_at' | 'updated_at'>): Promise<PaymentBatchItem | null> {
    const { data, error } = await supabase
      .from('bradesco_payment_batch_items')
      .insert([{
        ...paymentData,
        company_id: this.companyId,
        batch_id: batchId
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar pagamento ao lote:', error);
      return null;
    }

    return data;
  }

  async submitPaymentBatch(batchId: string): Promise<PaymentBatch | null> {
    const config = await this.getConfig();
    if (!config) {
      throw new Error('Configuração do Bradesco não encontrada');
    }

    try {
      // Buscar lote
      const { data: batch, error: fetchError } = await supabase
        .from('bradesco_payment_batches')
        .select('*')
        .eq('id', batchId)
        .eq('company_id', this.companyId)
        .single();

      if (fetchError || !batch) {
        throw new Error('Lote de pagamento não encontrado');
      }

      // Buscar itens do lote
      const { data: items, error: itemsError } = await supabase
        .from('bradesco_payment_batch_items')
        .select('*')
        .eq('batch_id', batchId)
        .eq('company_id', this.companyId);

      if (itemsError) {
        throw new Error('Erro ao buscar itens do lote');
      }

      // Simular envio para API do Bradesco
      const result = await this.callBradescoAPI('POST', '/payment-batches', {
        batch_number: batch.batch_number,
        total_amount: batch.total_amount,
        total_transactions: batch.total_transactions,
        items: items?.map(item => ({
          payment_type: item.payment_type,
          amount: item.amount,
          beneficiary_name: item.beneficiary_name,
          beneficiary_document: item.beneficiary_document,
          beneficiary_account: item.beneficiary_account,
          pix_key: item.pix_key
        }))
      });

      // Atualizar lote
      const { data: updatedBatch, error: updateError } = await supabase
        .from('bradesco_payment_batches')
        .update({
          status: 'processing',
          status_message: 'Lote enviado para processamento',
          submitted_at: new Date().toISOString(),
          bank_batch_id: result.batch_id,
          bank_response: result,
          updated_at: new Date().toISOString()
        })
        .eq('id', batchId)
        .eq('company_id', this.companyId)
        .select()
        .single();

      if (updateError) {
        throw new Error('Erro ao atualizar lote de pagamento');
      }

      return updatedBatch;
    } catch (error) {
      console.error('Erro ao enviar lote de pagamento:', error);
      throw error;
    }
  }

  // =====================================================
  // CNAB
  // =====================================================

  async generateCNABFile(batchId: string): Promise<string | null> {
    const config = await this.getConfig();
    if (!config) {
      throw new Error('Configuração do Bradesco não encontrada');
    }

    try {
      // Buscar lote e itens
      const { data: batch, error: batchError } = await supabase
        .from('bradesco_payment_batches')
        .select('*')
        .eq('id', batchId)
        .eq('company_id', this.companyId)
        .single();

      if (batchError || !batch) {
        throw new Error('Lote não encontrado');
      }

      const { data: items, error: itemsError } = await supabase
        .from('bradesco_payment_batch_items')
        .select('*')
        .eq('batch_id', batchId)
        .eq('company_id', this.companyId);

      if (itemsError) {
        throw new Error('Erro ao buscar itens do lote');
      }

      // Gerar arquivo CNAB
      const cnabContent = this.generateCNABContent(config, batch, items || []);
      const fileName = `CNAB_${config.bank_code}_${batch.batch_number}_${Date.now()}.txt`;
      const filePath = `${config.cnab_remessa_path}/${fileName}`;

      // Simular salvamento do arquivo
      console.log(`Arquivo CNAB gerado: ${filePath}`);
      console.log(`Conteúdo: ${cnabContent}`);

      // Atualizar lote com dados do arquivo
      await supabase
        .from('bradesco_payment_batches')
        .update({
          cnab_file_path: filePath,
          cnab_file_name: fileName,
          updated_at: new Date().toISOString()
        })
        .eq('id', batchId)
        .eq('company_id', this.companyId);

      return filePath;
    } catch (error) {
      console.error('Erro ao gerar arquivo CNAB:', error);
      throw error;
    }
  }

  private generateCNABContent(config: BradescoConfig, batch: PaymentBatch, items: PaymentBatchItem[]): string {
    let content = '';
    
    // Cabeçalho do arquivo (CNAB 240)
    const header = this.generateCNABHeader(config, batch);
    content += header + '\n';
    
    // Registros de transação
    items.forEach(item => {
      const transaction = this.generateCNABTransaction(config, item);
      content += transaction + '\n';
    });
    
    // Rodapé do arquivo
    const footer = this.generateCNABFooter(config, batch, items.length);
    content += footer + '\n';
    
    return content;
  }

  private generateCNABHeader(config: BradescoConfig, batch: PaymentBatch): string {
    // Implementação simplificada do cabeçalho CNAB 240
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '');
    
    return `23700000          ${config.agency_number.padStart(5, '0')}${config.account_number.padStart(12, '0')}${config.account_digit}${dateStr}${timeStr}${batch.batch_number.padEnd(20, ' ')}`;
  }

  private generateCNABTransaction(config: BradescoConfig, item: PaymentBatchItem): string {
    // Implementação simplificada do registro de transação CNAB 240
    const amount = Math.round(item.amount * 100).toString().padStart(15, '0');
    const document = item.beneficiary_document.replace(/\D/g, '').padStart(14, '0');
    
    return `23700010${item.payment_type === 'pix' ? 'PIX' : 'TED'}${document}${item.beneficiary_name.padEnd(30, ' ')}${amount}${item.description.padEnd(25, ' ')}`;
  }

  private generateCNABFooter(config: BradescoConfig, batch: PaymentBatch, itemCount: number): string {
    // Implementação simplificada do rodapé CNAB 240
    const totalAmount = Math.round(batch.total_amount * 100).toString().padStart(15, '0');
    const count = itemCount.toString().padStart(6, '0');
    
    return `23799999${count}${totalAmount}`;
  }

  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================

  private async callBradescoAPI(method: string, endpoint: string, data?: any): Promise<any> {
    const config = await this.getConfig();
    if (!config) {
      throw new Error('Configuração do Bradesco não encontrada');
    }

    // Simular chamada para API do Bradesco
    // Em produção, implementar chamada real com certificado digital
    console.log(`Chamada para API do Bradesco: ${method} ${endpoint}`, data);
    
    // Simular resposta da API
    return {
      success: true,
      data: {
        transaction_id: `bradesco_${Date.now()}`,
        status: 'completed',
        amount: data?.amount || 0,
        opening_balance: 10000.00,
        closing_balance: 10000.00 - (data?.amount || 0),
        total_credits: data?.amount || 0,
        total_debits: 0,
        items: data?.items || []
      }
    };
  }

  async logIntegration(logData: {
    log_level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    log_type: 'auth' | 'api' | 'cnab' | 'webhook' | 'sync' | 'payment' | 'error';
    message: string;
    request_id?: string;
    endpoint?: string;
    method?: string;
    request_data?: any;
    response_data?: any;
    error_code?: string;
    error_message?: string;
    stack_trace?: string;
    duration_ms?: number;
  }): Promise<void> {
    const config = await this.getConfig();
    
    await supabase
      .from('bradesco_integration_logs')
      .insert([{
        company_id: this.companyId,
        config_id: config?.id,
        ...logData
      }]);
  }

  // =====================================================
  // MÉTODOS DE CONSULTA
  // =====================================================

  async getTransactions(filters?: {
    transaction_type?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<BankTransaction[]> {
    let query = supabase
      .from('bradesco_transactions')
      .select('*')
      .eq('company_id', this.companyId);

    if (filters?.transaction_type) {
      query = query.eq('transaction_type', filters.transaction_type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar transações:', error);
      return [];
    }

    return data || [];
  }

  async getBankStatements(filters?: {
    start_date?: string;
    end_date?: string;
    sync_status?: string;
  }): Promise<BankStatement[]> {
    let query = supabase
      .from('bradesco_bank_statements')
      .select('*')
      .eq('company_id', this.companyId);

    if (filters?.start_date) {
      query = query.gte('statement_date', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('statement_date', filters.end_date);
    }
    if (filters?.sync_status) {
      query = query.eq('sync_status', filters.sync_status);
    }

    const { data, error } = await query.order('statement_date', { ascending: false });

    if (error) {
      console.error('Erro ao buscar extratos bancários:', error);
      return [];
    }

    return data || [];
  }

  async getPaymentBatches(filters?: {
    batch_type?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<PaymentBatch[]> {
    let query = supabase
      .from('bradesco_payment_batches')
      .select('*')
      .eq('company_id', this.companyId);

    if (filters?.batch_type) {
      query = query.eq('batch_type', filters.batch_type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar lotes de pagamento:', error);
      return [];
    }

    return data || [];
  }

  async getIntegrationLogs(filters?: {
    log_level?: string;
    log_type?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any[]> {
    let query = supabase
      .from('bradesco_integration_logs')
      .select('*')
      .eq('company_id', this.companyId);

    if (filters?.log_level) {
      query = query.eq('log_level', filters.log_level);
    }
    if (filters?.log_type) {
      query = query.eq('log_type', filters.log_type);
    }
    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(1000);

    if (error) {
      console.error('Erro ao buscar logs de integração:', error);
      return [];
    }

    return data || [];
  }
}