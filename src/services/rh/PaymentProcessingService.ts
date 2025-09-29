import { rhSupabase } from '@/integrations/supabase/client';
import FlashApiService, { FlashPaymentRequest } from '../flash/FlashApiService';
import { PaymentMethod } from '@/components/rh/PaymentMethodModal';

export interface PaymentProcessingRequest {
  employeeId: string;
  benefitType: string;
  amount: number;
  paymentMethod: PaymentMethod;
  companyId: string;
  description?: string;
}

export interface PaymentProcessingResponse {
  success: boolean;
  transactionId?: string;
  message: string;
  error?: string;
}

export class PaymentProcessingService {
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  /**
   * Processa pagamento de benefício
   */
  async processPayment(request: PaymentProcessingRequest): Promise<PaymentProcessingResponse> {
    try {
      // 1. Validar configuração de pagamento
      const config = await this.getPaymentConfig(request.benefitType);
      if (!config) {
        return {
          success: false,
          message: 'Configuração de pagamento não encontrada para este benefício'
        };
      }

      // 2. Verificar se o método de pagamento é permitido
      const allowedMethods = config.allowed_payment_methods as string[];
      if (!allowedMethods.includes(request.paymentMethod.type)) {
        return {
          success: false,
          message: `Método de pagamento ${request.paymentMethod.type} não é permitido para ${request.benefitType}`
        };
      }

      // 3. Criar registro de pagamento
      const paymentRecord = await this.createPaymentRecord(request);
      if (!paymentRecord) {
        return {
          success: false,
          message: 'Erro ao criar registro de pagamento'
        };
      }

      // 4. Processar pagamento conforme o método
      let result: PaymentProcessingResponse;
      
      switch (request.paymentMethod.type) {
        case 'flash':
          result = await this.processFlashPayment(request, paymentRecord.id);
          break;
        case 'transfer':
          result = await this.processBankTransfer(request, paymentRecord.id);
          break;
        case 'pix':
          result = await this.processPixPayment(request, paymentRecord.id);
          break;
        default:
          result = {
            success: false,
            message: 'Método de pagamento não suportado'
          };
      }

      // 5. Atualizar status do pagamento
      await this.updatePaymentStatus(paymentRecord.id, result.success ? 'completed' : 'failed', result.transactionId, result.error);

      return result;
    } catch (error) {
      console.error('Erro no processamento de pagamento:', error);
      return {
        success: false,
        message: 'Erro interno no processamento de pagamento',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Processa pagamento via Flash
   */
  private async processFlashPayment(request: PaymentProcessingRequest, paymentRecordId: string): Promise<PaymentProcessingResponse> {
    try {
      const config = await this.getPaymentConfig(request.benefitType);
      if (!config?.flash_api_key || !config?.flash_company_id) {
        return {
          success: false,
          message: 'Configuração da Flash API não encontrada'
        };
      }

      const flashService = new FlashApiService({
        apiKey: config.flash_api_key,
        companyId: config.flash_company_id,
        baseUrl: 'https://api.flashapp.services' // URL base da API Flash
      });

      const flashRequest: FlashPaymentRequest = {
        employeeId: request.employeeId,
        benefitType: request.benefitType,
        amount: request.amount,
        description: request.description || `Pagamento de ${request.benefitType}`,
        referenceId: paymentRecordId
      };

      const result = await flashService.processPayment(flashRequest);
      
      return {
        success: result.status === 'completed',
        transactionId: result.transactionId,
        message: result.message || 'Pagamento processado via Flash'
      };
    } catch (error) {
      console.error('Erro no pagamento Flash:', error);
      return {
        success: false,
        message: 'Erro no processamento via Flash',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Processa pagamento por transferência bancária
   */
  private async processBankTransfer(request: PaymentProcessingRequest, paymentRecordId: string): Promise<PaymentProcessingResponse> {
    try {
      // Buscar dados bancários do funcionário
      const bankAccount = await this.getEmployeeBankAccount(request.employeeId);
      if (!bankAccount) {
        return {
          success: false,
          message: 'Dados bancários do funcionário não encontrados'
        };
      }

      // Simular processamento de transferência
      // Em produção, aqui seria feita a integração com o sistema bancário
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        transactionId,
        message: `Transferência de ${request.amount} para ${bankAccount.bank_name} - Ag: ${bankAccount.agency} - CC: ${bankAccount.account}`
      };
    } catch (error) {
      console.error('Erro na transferência bancária:', error);
      return {
        success: false,
        message: 'Erro no processamento da transferência',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Processa pagamento via PIX
   */
  private async processPixPayment(request: PaymentProcessingRequest, paymentRecordId: string): Promise<PaymentProcessingResponse> {
    try {
      // Buscar chave PIX do funcionário
      const bankAccount = await this.getEmployeeBankAccount(request.employeeId);
      if (!bankAccount?.pix_key) {
        return {
          success: false,
          message: 'Chave PIX do funcionário não encontrada'
        };
      }

      // Simular processamento de PIX
      // Em produção, aqui seria feita a integração com o sistema PIX
      const transactionId = `PIX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        transactionId,
        message: `PIX de ${request.amount} para chave: ${bankAccount.pix_key}`
      };
    } catch (error) {
      console.error('Erro no PIX:', error);
      return {
        success: false,
        message: 'Erro no processamento do PIX',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Busca configuração de pagamento para um benefício
   */
  private async getPaymentConfig(benefitType: string) {
    const { data, error } = await rhSupabase
      .from('rh.benefit_payment_configs')
      .select('*')
      .eq('company_id', this.companyId)
      .eq('benefit_type', benefitType)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Erro ao buscar configuração de pagamento:', error);
      return null;
    }

    return data;
  }

  /**
   * Cria registro de pagamento
   */
  private async createPaymentRecord(request: PaymentProcessingRequest) {
    const { data, error } = await rhSupabase
      .from('rh.benefit_payments')
      .insert({
        company_id: this.companyId,
        employee_id: request.employeeId,
        benefit_type: request.benefitType,
        amount: request.amount,
        payment_method: request.paymentMethod.type,
        payment_status: 'pending',
        payment_details: {
          method_label: request.paymentMethod.label,
          description: request.description
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar registro de pagamento:', error);
      return null;
    }

    return data;
  }

  /**
   * Atualiza status do pagamento
   */
  private async updatePaymentStatus(
    paymentId: string, 
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled',
    transactionId?: string,
    errorMessage?: string
  ) {
    const updateData: any = {
      payment_status: status,
      processed_at: new Date().toISOString()
    };

    if (transactionId) {
      switch (status) {
        case 'completed':
          updateData.flash_transaction_id = transactionId;
          updateData.bank_transaction_id = transactionId;
          updateData.pix_transaction_id = transactionId;
          break;
      }
    }

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await rhSupabase
      .from('rh.benefit_payments')
      .update(updateData)
      .eq('id', paymentId);

    if (error) {
      console.error('Erro ao atualizar status do pagamento:', error);
    }
  }

  /**
   * Busca dados bancários do funcionário
   */
  private async getEmployeeBankAccount(employeeId: string) {
    const { data, error } = await rhSupabase
      .from('rh.employee_bank_accounts')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Erro ao buscar dados bancários:', error);
      return null;
    }

    return data;
  }

  /**
   * Lista histórico de pagamentos
   */
  async getPaymentHistory(employeeId?: string, limit: number = 50) {
    let query = rhSupabase
      .from('rh.benefit_payments')
      .select(`
        *,
        employee:employees(nome, matricula),
        company:companies(nome)
      `)
      .eq('company_id', this.companyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar histórico de pagamentos:', error);
      return [];
    }

    return data;
  }
}

export default PaymentProcessingService;
