import { rhSupabase } from '@/integrations/supabase/client';
import { getFlashCategory } from './FlashCategoryMapping';

export interface FlashApiConfig {
  apiKey: string;
  companyId: string;
  baseUrl: string;
}

export interface FlashEmployee {
  id: string;
  name: string;
  email: string;
  document: string;
  phone?: string;
}

export interface FlashBenefit {
  id: string;
  name: string;
  type: string;
  value: number;
  employeeId: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface FlashPaymentRequest {
  employeeId: string;
  benefitType: string;
  amount: number;
  description: string;
  referenceId: string;
}

export interface FlashPaymentResponse {
  transactionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
}

export class FlashApiService {
  private config: FlashApiConfig;

  constructor(config: FlashApiConfig) {
    this.config = config;
  }

  /**
   * Autentica na API Flash
   */
  private async authenticate(): Promise<string> {
    try {
      const response = await fetch(`${this.config.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          company_id: this.config.companyId
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na autenticação: ${response.statusText}`);
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Erro na autenticação Flash:', error);
      throw error;
    }
  }

  /**
   * Sincroniza colaboradores com a Flash
   */
  async syncEmployees(employees: any[]): Promise<FlashEmployee[]> {
    try {
      const token = await this.authenticate();
      
      const response = await fetch(`${this.config.baseUrl}/colaboradores/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employees: employees.map(emp => ({
            name: emp.nome,
            email: emp.email,
            document: emp.cpf,
            phone: emp.telefone
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na sincronização: ${response.statusText}`);
      }

      const data = await response.json();
      return data.employees;
    } catch (error) {
      console.error('Erro na sincronização de colaboradores:', error);
      throw error;
    }
  }

  /**
   * Processa pagamento via Flash
   */
  async processPayment(paymentRequest: FlashPaymentRequest): Promise<FlashPaymentResponse> {
    try {
      const token = await this.authenticate();
      
      // Mapear tipo de benefício para categoria Flash
      const flashCategory = getFlashCategory(paymentRequest.benefitType);
      if (!flashCategory) {
        throw new Error(`Tipo de benefício ${paymentRequest.benefitType} não tem mapeamento Flash`);
      }
      
      const response = await fetch(`${this.config.baseUrl}/beneficios/pagamento`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: paymentRequest.employeeId,
          benefit_type: flashCategory, // Usar categoria Flash mapeada
          amount: paymentRequest.amount,
          description: paymentRequest.description,
          reference_id: paymentRequest.referenceId
        })
      });

      if (!response.ok) {
        throw new Error(`Erro no pagamento: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        transactionId: data.transaction_id,
        status: data.status,
        message: data.message
      };
    } catch (error) {
      console.error('Erro no processamento de pagamento Flash:', error);
      throw error;
    }
  }

  /**
   * Consulta status de um pagamento
   */
  async getPaymentStatus(transactionId: string): Promise<FlashPaymentResponse> {
    try {
      const token = await this.authenticate();
      
      const response = await fetch(`${this.config.baseUrl}/beneficios/status/${transactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na consulta: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        transactionId: data.transaction_id,
        status: data.status,
        message: data.message
      };
    } catch (error) {
      console.error('Erro na consulta de status:', error);
      throw error;
    }
  }

  /**
   * Lista benefícios de um colaborador
   */
  async getEmployeeBenefits(employeeId: string): Promise<FlashBenefit[]> {
    try {
      const token = await this.authenticate();
      
      const response = await fetch(`${this.config.baseUrl}/colaboradores/${employeeId}/beneficios`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na consulta: ${response.statusText}`);
      }

      const data = await response.json();
      return data.benefits;
    } catch (error) {
      console.error('Erro na consulta de benefícios:', error);
      throw error;
    }
  }

  /**
   * Testa a conectividade com a API
   */
  async testConnection(): Promise<boolean> {
    try {
      const token = await this.authenticate();
      return !!token;
    } catch (error) {
      console.error('Erro no teste de conexão:', error);
      return false;
    }
  }
}

export default FlashApiService;
