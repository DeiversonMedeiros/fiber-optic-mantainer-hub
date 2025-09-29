import { rhSupabase, coreSupabase } from '@/integrations/supabase/client';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export interface KPIData {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
  format: 'currency' | 'number' | 'percentage';
  icon: string;
  color: string;
}

export interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  title: string;
  data: any[];
  xAxis: string;
  yAxis: string;
  colors?: string[];
  options?: any;
}

export interface DashboardConfig {
  id: string;
  name: string;
  description?: string;
  layoutConfig: any;
  filtersConfig: any;
  isPublic: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'payroll' | 'compliance' | 'performance' | 'cost';
  templateConfig: any;
  queryConfig: any;
  outputFormats: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  id: string;
  preferences: any;
  theme: 'light' | 'dark';
  language: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardAlert {
  id: string;
  alertType: 'deadline' | 'threshold' | 'anomaly' | 'compliance';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  isActive: boolean;
  metadata: any;
  createdAt: string;
  readAt?: string;
}

export interface AnalyticsFilters {
  periodStart: string;
  periodEnd: string;
  departmentIds?: string[];
  employeeIds?: string[];
  payrollStatus?: string[];
  reportType?: string;
}

// =====================================================
// SERVIÇO PRINCIPAL DE ANALYTICS
// =====================================================

export class AnalyticsService {
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  // =====================================================
  // KPIs E MÉTRICAS
  // =====================================================

  async getKPIs(filters: AnalyticsFilters): Promise<KPIData[]> {
    try {
      // Buscar dados de folha de pagamento
      const { data: payrollData, error: payrollError } = await rhSupabase
        .from('payroll_calculations')
        .select(`
          total_proventos,
          total_descontos,
          salario_liquido,
          created_at,
          status
        `)
        .eq('company_id', this.companyId)
        .gte('created_at', filters.periodStart)
        .lte('created_at', filters.periodEnd);

      if (payrollError) throw payrollError;

      // Buscar dados de funcionários
      const { data: employeeData, error: employeeError } = await rhSupabase
        .from('employees')
        .select('id, status, created_at')
        .eq('company_id', this.companyId);

      if (employeeError) throw employeeError;

      // Calcular KPIs
      const totalEmployees = employeeData?.filter(e => e.status === 'ativo').length || 0;
      const totalPayroll = payrollData?.reduce((sum, p) => sum + (p.salario_liquido || 0), 0) || 0;
      const completedPayrolls = payrollData?.filter(p => p.status === 'completed').length || 0;
      const pendingPayrolls = payrollData?.filter(p => p.status === 'pending').length || 0;

      // Dados do período anterior para comparação
      const previousPeriodStart = new Date(filters.periodStart);
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
      const previousPeriodEnd = new Date(filters.periodEnd);
      previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - 1);

      const { data: previousPayrollData } = await rhSupabase
        .from('payroll_calculations')
        .select('salario_liquido')
        .eq('company_id', this.companyId)
        .gte('created_at', previousPeriodStart.toISOString())
        .lte('created_at', previousPeriodEnd.toISOString());

      const previousTotalPayroll = previousPayrollData?.reduce((sum, p) => sum + (p.salario_liquido || 0), 0) || 0;

      const kpis: KPIData[] = [
        {
          id: 'total-employees',
          name: 'Total de Funcionários',
          value: totalEmployees,
          previousValue: totalEmployees, // Simplificado para demo
          change: 0,
          changePercentage: 0,
          trend: 'stable',
          format: 'number',
          icon: 'Users',
          color: 'blue'
        },
        {
          id: 'total-payroll',
          name: 'Total da Folha',
          value: totalPayroll,
          previousValue: previousTotalPayroll,
          change: totalPayroll - previousTotalPayroll,
          changePercentage: previousTotalPayroll > 0 ? ((totalPayroll - previousTotalPayroll) / previousTotalPayroll) * 100 : 0,
          trend: totalPayroll > previousTotalPayroll ? 'up' : totalPayroll < previousTotalPayroll ? 'down' : 'stable',
          format: 'currency',
          icon: 'DollarSign',
          color: 'green'
        },
        {
          id: 'completed-payrolls',
          name: 'Folhas Processadas',
          value: completedPayrolls,
          previousValue: completedPayrolls, // Simplificado para demo
          change: 0,
          changePercentage: 0,
          trend: 'stable',
          format: 'number',
          icon: 'CheckCircle',
          color: 'purple'
        },
        {
          id: 'pending-payrolls',
          name: 'Folhas Pendentes',
          value: pendingPayrolls,
          previousValue: pendingPayrolls, // Simplificado para demo
          change: 0,
          changePercentage: 0,
          trend: 'stable',
          format: 'number',
          icon: 'Clock',
          color: 'orange'
        }
      ];

      return kpis;
    } catch (error) {
      console.error('Erro ao buscar KPIs:', error);
      throw error;
    }
  }

  // =====================================================
  // DADOS DE GRÁFICOS
  // =====================================================

  async getPayrollTrendChart(filters: AnalyticsFilters): Promise<ChartData> {
    try {
      const { data, error } = await rhSupabase
        .from('payroll_calculations')
        .select(`
          salario_liquido,
          created_at,
          status
        `)
        .eq('company_id', this.companyId)
        .gte('created_at', filters.periodStart)
        .lte('created_at', filters.periodEnd)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const chartData = data?.map(item => ({
        date: new Date(item.created_at).toLocaleDateString('pt-BR'),
        value: item.salario_liquido || 0,
        status: item.status
      })) || [];

      return {
        id: 'payroll-trend',
        type: 'line',
        title: 'Evolução da Folha de Pagamento',
        data: chartData,
        xAxis: 'date',
        yAxis: 'value',
        colors: ['#3b82f6', '#10b981', '#f59e0b'],
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value: any) => `R$ ${value.toLocaleString('pt-BR')}`
              }
            }
          }
        }
      };
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico de tendência:', error);
      throw error;
    }
  }

  async getDepartmentDistributionChart(filters: AnalyticsFilters): Promise<ChartData> {
    try {
      const { data, error } = await rhSupabase
        .from('employees')
        .select(`
          id,
          cost_center_id
        `)
        .eq('company_id', this.companyId)
        .eq('status', 'ativo');

      if (error) throw error;

      // Buscar cost_centers separadamente
      const { data: costCentersData } = await coreSupabase
        .from('cost_centers')
        .select('id, nome')
        .eq('company_id', this.companyId)
        .eq('is_active', true);

      // Criar mapa de cost_centers
      const costCentersMap = costCentersData?.reduce((acc: any, cc) => {
        acc[cc.id] = cc.nome;
        return acc;
      }, {}) || {};

      // Agrupar por departamento
      const departmentCounts = data?.reduce((acc: any, employee) => {
        const deptName = costCentersMap[employee.cost_center_id] || 'Sem Departamento';
        acc[deptName] = (acc[deptName] || 0) + 1;
        return acc;
      }, {}) || {};

      const chartData = Object.entries(departmentCounts).map(([name, count]) => ({
        name,
        value: count as number
      }));

      return {
        id: 'department-distribution',
        type: 'pie',
        title: 'Distribuição por Departamento',
        data: chartData,
        xAxis: 'name',
        yAxis: 'value',
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      };
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico de departamentos:', error);
      throw error;
    }
  }

  async getCostBreakdownChart(filters: AnalyticsFilters): Promise<ChartData> {
    try {
      const { data, error } = await rhSupabase
        .from('payroll_calculations')
        .select(`
          total_proventos,
          total_descontos,
          salario_bruto,
          salario_liquido,
          created_at
        `)
        .eq('company_id', this.companyId)
        .gte('created_at', filters.periodStart)
        .lte('created_at', filters.periodEnd);

      if (error) throw error;

      // Agrupar por tipo de custo
      const costTotals = data?.reduce((acc: any, item) => {
        acc['Proventos'] = (acc['Proventos'] || 0) + (item.total_proventos || 0);
        acc['Descontos'] = (acc['Descontos'] || 0) + (item.total_descontos || 0);
        acc['Salário Bruto'] = (acc['Salário Bruto'] || 0) + (item.salario_bruto || 0);
        acc['Salário Líquido'] = (acc['Salário Líquido'] || 0) + (item.salario_liquido || 0);
        return acc;
      }, {}) || {};

      const chartData = Object.entries(costTotals)
        .map(([name, value]) => ({ name, value: value as number }))
        .sort((a, b) => b.value - a.value);

      return {
        id: 'cost-breakdown',
        type: 'bar',
        title: 'Breakdown de Custos da Folha',
        data: chartData,
        xAxis: 'name',
        yAxis: 'value',
        colors: ['#3b82f6'],
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value: any) => `R$ ${value.toLocaleString('pt-BR')}`
              }
            }
          }
        }
      };
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico de custos:', error);
      throw error;
    }
  }

  // =====================================================
  // CONFIGURAÇÕES DE DASHBOARD
  // =====================================================

  async getDashboardConfigs(): Promise<DashboardConfig[]> {
    try {
      const { data, error } = await rhSupabase
        .from('dashboard_configs')
        .select('*')
        .eq('company_id', this.companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar configurações de dashboard:', error);
      throw error;
    }
  }

  async saveDashboardConfig(config: Omit<DashboardConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<DashboardConfig> {
    try {
      const { data, error } = await rhSupabase
        .from('dashboard_configs')
        .insert({
          ...config,
          company_id: this.companyId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao salvar configuração de dashboard:', error);
      throw error;
    }
  }

  async updateDashboardConfig(id: string, updates: Partial<DashboardConfig>): Promise<DashboardConfig> {
    try {
      const { data, error } = await rhSupabase
        .from('dashboard_configs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('company_id', this.companyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar configuração de dashboard:', error);
      throw error;
    }
  }

  async deleteDashboardConfig(id: string): Promise<void> {
    try {
      const { error } = await rhSupabase
        .from('dashboard_configs')
        .delete()
        .eq('id', id)
        .eq('company_id', this.companyId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar configuração de dashboard:', error);
      throw error;
    }
  }

  // =====================================================
  // TEMPLATES DE RELATÓRIOS
  // =====================================================

  async getReportTemplates(): Promise<ReportTemplate[]> {
    try {
      const { data, error } = await rhSupabase
        .from('report_templates')
        .select('*')
        .eq('company_id', this.companyId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar templates de relatórios:', error);
      throw error;
    }
  }

  async saveReportTemplate(template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportTemplate> {
    try {
      const { data, error } = await rhSupabase
        .from('report_templates')
        .insert({
          ...template,
          company_id: this.companyId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao salvar template de relatório:', error);
      throw error;
    }
  }

  // =====================================================
  // PREFERÊNCIAS DO USUÁRIO
  // =====================================================

  async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      const { data, error } = await rhSupabase
        .from('user_dashboard_preferences')
        .select('*')
        .eq('company_id', this.companyId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar preferências do usuário:', error);
      throw error;
    }
  }

  async saveUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      const { data, error } = await rhSupabase
        .from('user_dashboard_preferences')
        .upsert({
          ...preferences,
          company_id: this.companyId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao salvar preferências do usuário:', error);
      throw error;
    }
  }

  // =====================================================
  // ALERTAS
  // =====================================================

  async getDashboardAlerts(): Promise<DashboardAlert[]> {
    try {
      const { data, error } = await rhSupabase
        .from('dashboard_alerts')
        .select('*')
        .eq('company_id', this.companyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar alertas do dashboard:', error);
      throw error;
    }
  }

  async markAlertAsRead(alertId: string): Promise<void> {
    try {
      const { error } = await rhSupabase
        .from('dashboard_alerts')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .eq('company_id', this.companyId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao marcar alerta como lido:', error);
      throw error;
    }
  }

  // =====================================================
  // CACHE DE ANALYTICS
  // =====================================================

  async getCachedData(cacheKey: string, periodStart: string, periodEnd: string): Promise<any> {
    try {
      const { data, error } = await rhSupabase
        .from('analytics_cache')
        .select('cached_data')
        .eq('company_id', this.companyId)
        .eq('cache_key', cacheKey)
        .eq('period_start', periodStart)
        .eq('period_end', periodEnd)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.cached_data;
    } catch (error) {
      console.error('Erro ao buscar dados em cache:', error);
      return null;
    }
  }

  async setCachedData(cacheKey: string, periodStart: string, periodEnd: string, data: any, ttlMinutes: number = 60): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

      await rhSupabase
        .from('analytics_cache')
        .upsert({
          company_id: this.companyId,
          cache_key: cacheKey,
          period_start: periodStart,
          period_end: periodEnd,
          cached_data: data,
          expires_at: expiresAt.toISOString()
        });
    } catch (error) {
      console.error('Erro ao salvar dados em cache:', error);
    }
  }
}
