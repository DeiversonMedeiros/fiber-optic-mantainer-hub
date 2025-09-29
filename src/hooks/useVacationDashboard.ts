import { useQuery } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';

// Tipos para o dashboard de férias
export interface VacationAlert {
  funcionario: string;
  email: string;
  company_id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date: string;
  days_remaining: number;
  created_at: string;
}

export interface VacationDashboardStats {
  total_funcionarios: number;
  funcionarios_com_direito: number;
  notificacoes_ativas: number;
  notificacoes_criticas: number;
  notificacoes_altas: number;
  notificacoes_medias: number;
  ultima_execucao: string | null;
  proxima_verificacao: string | null;
}

export interface VacationComplianceReport {
  employee_id: string;
  employee_name: string;
  hire_date: string;
  ultima_feria: string | null;
  dias_sem_ferias: number;
  data_vencimento: string | null;
  status_ferias: 'vencida' | 'vencendo' | 'atencao' | 'ok' | 'inativo';
  dias_restantes: number;
  nivel_criticidade: 'low' | 'medium' | 'high' | 'critical';
  tem_direito: boolean;
}

export interface VacationDashboardMetrics {
  company_id: string;
  total_funcionarios: number;
  ferias_vencidas: number;
  ferias_vencendo: number;
  ferias_atencao: number;
  ferias_ok: number;
  com_direito_ferias: number;
  media_dias_restantes: number | null;
}

// Hook para buscar alertas críticos de férias
export function useVacationAlerts(companyId?: string) {
  const { data: company } = useCompany();

  return useQuery({
    queryKey: ['vacation-alerts', companyId || company?.id],
    queryFn: async (): Promise<VacationAlert[]> => {
      const targetCompanyId = companyId || company?.id;
      if (!targetCompanyId) return [];

      const { data, error } = await rhSupabase
        .from('rh.alertas_ferias_criticos')
        .select('*')
        .eq('company_id', targetCompanyId);

      if (error) {
        console.error('Erro ao buscar alertas críticos:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!(companyId || company?.id),
    refetchInterval: 60000, // Refetch a cada 1 minuto
  });
}

// Hook para buscar estatísticas do sistema de notificações
export function useVacationSystemStats() {
  return useQuery({
    queryKey: ['vacation-system-stats'],
    queryFn: async (): Promise<VacationDashboardStats | null> => {
      const { data, error } = await rhSupabase
        .rpc('status_sistema_notificacoes');

      if (error) {
        console.error('Erro ao buscar estatísticas do sistema:', error);
        return null;
      }

      return data?.[0] || null;
    },
    refetchInterval: 120000, // Refetch a cada 2 minutos
  });
}

// Hook para buscar relatório de conformidade da empresa
export function useVacationComplianceReport(companyId?: string) {
  const { data: company } = useCompany();

  return useQuery({
    queryKey: ['vacation-compliance-report', companyId || company?.id],
    queryFn: async (): Promise<VacationComplianceReport[]> => {
      const targetCompanyId = companyId || company?.id;
      if (!targetCompanyId) return [];

      const { data, error } = await rhSupabase
        .rpc('relatorio_ferias_empresa', {
          company_id_param: targetCompanyId
        });

      if (error) {
        console.error('Erro ao buscar relatório de conformidade:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!(companyId || company?.id),
    refetchInterval: 120000,
  });
}

// Hook para buscar métricas do dashboard de férias
export function useVacationDashboardMetrics(companyId?: string) {
  const { data: company } = useCompany();

  return useQuery({
    queryKey: ['vacation-dashboard-metrics', companyId || company?.id],
    queryFn: async (): Promise<VacationDashboardMetrics | null> => {
      const targetCompanyId = companyId || company?.id;
      if (!targetCompanyId) return null;

      const { data, error } = await rhSupabase
        .from('rh.dashboard_ferias')
        .select('*')
        .eq('company_id', targetCompanyId)
        .single();

      if (error) {
        console.error('Erro ao buscar métricas do dashboard:', error);
        return null;
      }

      return data || null;
    },
    enabled: !!(companyId || company?.id),
    refetchInterval: 120000,
  });
}

// Hook para buscar funcionários com férias vencidas
export function useEmployeesWithOverdueVacations(companyId?: string) {
  const { data: company } = useCompany();

  return useQuery({
    queryKey: ['employees-overdue-vacations', companyId || company?.id],
    queryFn: async (): Promise<VacationComplianceReport[]> => {
      const targetCompanyId = companyId || company?.id;
      if (!targetCompanyId) return [];

      // Buscar funcionários com férias vencidas usando a view
      const { data, error } = await rhSupabase
        .from('rh.alertas_ferias_criticos')
        .select('*')
        .eq('company_id', targetCompanyId)
        .eq('priority', 'critical');

      if (error) {
        console.error('Erro ao buscar funcionários com férias vencidas:', error);
        return [];
      }

      // Converter para o formato do relatório
      const complianceData = await rhSupabase
        .rpc('relatorio_ferias_empresa', {
          company_id_param: targetCompanyId
        });

      if (complianceData.error) {
        console.error('Erro ao buscar dados de conformidade:', complianceData.error);
        return [];
      }

      // Filtrar apenas funcionários com férias vencidas
      return complianceData.data?.filter(emp => emp.status_ferias === 'vencida') || [];
    },
    enabled: !!(companyId || company?.id),
    refetchInterval: 60000,
  });
}

// Hook para buscar funcionários próximos do vencimento (3 meses)
export function useEmployeesNearVacationExpiry(companyId?: string) {
  const { data: company } = useCompany();

  return useQuery({
    queryKey: ['employees-near-expiry', companyId || company?.id],
    queryFn: async (): Promise<VacationComplianceReport[]> => {
      const targetCompanyId = companyId || company?.id;
      if (!targetCompanyId) return [];

      const { data, error } = await rhSupabase
        .rpc('relatorio_ferias_empresa', {
          company_id_param: targetCompanyId
        });

      if (error) {
        console.error('Erro ao buscar funcionários próximos do vencimento:', error);
        return [];
      }

      // Filtrar funcionários próximos do vencimento (até 90 dias)
      return data?.filter(emp => 
        emp.status_ferias === 'vencendo' || 
        emp.status_ferias === 'atencao'
      ) || [];
    },
    enabled: !!(companyId || company?.id),
    refetchInterval: 60000,
  });
}

// Hook para executar verificação completa do sistema
export function useVacationSystemCheck() {
  return useQuery({
    queryKey: ['vacation-system-check'],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .rpc('executar_verificacoes_ferias_completa');

      if (error) {
        console.error('Erro ao executar verificação do sistema:', error);
        throw error;
      }

      return data;
    },
    enabled: false, // Só executa quando chamado manualmente
    retry: false,
  });
}

// Hook para testar o sistema de notificações
export function useVacationSystemTest() {
  return useQuery({
    queryKey: ['vacation-system-test'],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .rpc('testar_sistema_notificacoes');

      if (error) {
        console.error('Erro ao testar sistema:', error);
        throw error;
      }

      return data;
    },
    enabled: false, // Só executa quando chamado manualmente
    retry: false,
  });
}
