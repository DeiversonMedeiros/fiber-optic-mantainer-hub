import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import StatCard from '@/components/dashboard/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, CheckSquare, AlertTriangle, TrendingUp, Calendar, Filter, BarChart3, Users, Clock, ShieldCheck, Minus } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import React, { useState, useEffect, useMemo } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Tipos para as views materializadas
interface DashboardStats {
  total_reports: number;
  validated_reports: number;
  pending_reports: number;
  adequacy_reports: number;
  adequate_reports: number;
  invoiced_reports: number;
  not_validated_reports: number;
  no_pending_reports: number;
  month_year: string;
}

interface PreventiveStats {
  total_schedules: number;
  completed_schedules: number;
  pending_schedules: number;
  month_year: string;
}

interface SlaValidationStats {
  avg_sla_hours: number;
  total_validated_reports: number;
  month_year: string;
}

interface ReportsByStatusStats {
  status: string;
  total_reports: number;
  month_year: string;
}

interface ReportsByManagerStats {
  manager_id: string;
  manager_name: string;
  total_reports: number;
  validated_reports: number;
  pending_reports: number;
  not_validated_reports: number;
  month_year: string;
}

interface ReportsByPendingReasonStats {
  pending_reason: string;
  total_reports: number;
  month_year: string;
}

interface TopPendingManagersStats {
  manager_id: string;
  manager_name: string;
  total_pending_reports: number;
  pending_reasons: string[];
  month_year: string;
}

interface InspectionStats {
  total_inspections: number;
  completed_inspections: number;
  pending_inspections: number;
  cancelled_inspections: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  month_year: string;
}

interface SlaValidationByManagerStats {
  manager_id: string;
  manager_name: string;
  total_reports: number;
  validated_reports: number;
  avg_sla_hours: number;
  min_sla_hours: number;
  max_sla_hours: number;
  month_year: string;
}

interface BillingStats {
  month_year: string;
  total_reports: number;
  invoiced_reports: number;
  validatable_reports: number;
  avg_billing_sla_hours: number;
  min_billing_sla_hours: number;
  max_billing_sla_hours: number;
}

// Nova interface para dados de materiais
interface MaterialsDashboardStats {
  checklist_item_id: string;
  material_name: string;
  category: string;
  carga: number;
  baixados: number;
  saldo: number;
  faturado: number;
  percentual_utilizacao: number;
  percentual_faturado: number;
  first_charge_date: string | null;
  last_charge_date: string | null;
  first_usage_date: string | null;
  last_usage_date: string | null;
  first_invoice_date: string | null;
  last_invoice_date: string | null;
  last_activity_date: string | null;
}

// Cores para os gráficos
const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7c7c'];

const STATUS_LABELS: Record<string, string> = {
  'pending': 'Pendente',
  'validated': 'Validado',
  'adequacy': 'Em Adequação',
  'adequate': 'Adequado',
  'invoiced': 'Faturado',
  'not_validated': 'Não Validado',
  'no_pending': 'Sem Pendência',
  'concluded': 'Concluído',
  'cancelled': 'Cancelado'
};

const RISK_LEVEL_COLORS: Record<string, string> = {
  'baixo': '#10b981',    // Verde
  'médio': '#f59e0b',    // Amarelo
  'alto': '#ef4444',     // Vermelho
  'crítico': '#991b1b'   // Vermelho escuro
};

// Cores para os status dos gráficos de pizza
const STATUS_COLORS: Record<string, string> = {
  'pending': '#f59e0b',     // Amarelo
  'validated': '#10b981',   // Verde
  'adequacy': '#3b82f6',    // Azul
  'adequate': '#22c55e',    // Verde claro
  'invoiced': '#6366f1',    // Índigo
  'not_validated': '#ef4444', // Vermelho
  'no_pending': '#10b981',  // Verde
  'concluded': '#059669',   // Verde escuro
  'cancelled': '#6b7280'    // Cinza
};

// Mapeamento de meses em português
const MONTH_NAMES = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
};

// Função auxiliar para agrupar por mês (MANTIDA para compatibilidade com outros gráficos)
function groupDataByMonth(data: any[], dateField: string, valueField: string) {
  return data.reduce((acc: Record<string, any>, item) => {
    if (!item[dateField]) return acc;
    const date = new Date(item[dateField]);
    const monthKey = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthKey, count: 0 };
    }
    acc[monthKey].count += item[valueField] || 1;
    return acc;
  }, {});
}

function groupByMonth(arr: any[], dateKey: string) {
  return arr.reduce((acc: Record<string, number>, item) => {
    if (!item[dateKey]) return acc;
    const date = new Date(item[dateKey]);
    const label = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
}



const Dashboard = () => {
  // Estados para filtros de data
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isFilterActive, setIsFilterActive] = useState(false);

  // REMOVIDO: Filtro de data padrão de 30 dias que limitava os dados
  // Agora as views mostrarão todos os dados disponíveis por padrão

  // Função para aplicar filtros de data
  const applyDateFilter = (data: any[], dateField: string) => {
    if (!isFilterActive || !startDate || !endDate) return data;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Incluir o dia inteiro
    
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= start && itemDate <= end;
    });
  };

  // --- DASHBOARD STATS (VIEW MATERIALIZADA) ---
  const { data: dashboardStats = [], isLoading: loadingStats } = useQuery<DashboardStats[]>({
    queryKey: ['dashboard-stats', startDate, endDate, isFilterActive],
    queryFn: async () => {
      let query = (supabase as any)
        .from('dashboard_stats')
        .select('*');
      
      // CORREÇÃO: Só aplicar filtros de data se isFilterActive = true
      if (isFilterActive && startDate && endDate) {
        query = query
          .gte('month_year', `${startDate}T00:00:00`)
          .lte('month_year', `${endDate}T23:59:59`);
      }
      
      const { data } = await query;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,   // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // --- PREVENTIVE STATS (VIEW MATERIALIZADA) ---
  const { data: preventiveStats = [], isLoading: loadingPreventive, error: preventiveError } = useQuery<PreventiveStats[]>({
    queryKey: ['preventive-stats', startDate, endDate, isFilterActive],
    queryFn: async () => {
      try {
        let query = (supabase as any)
          .from('preventive_stats')
          .select('*');
        
        // CORREÇÃO: Só aplicar filtros de data se isFilterActive = true
        if (isFilterActive && startDate && endDate) {
          query = query
            .gte('month_year', `${startDate}T00:00:00`)
            .lte('month_year', `${endDate}T23:59:59`);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Erro ao buscar dados preventivos:', error);
          return [];
        }
        
        return data || [];
      } catch (error) {
        console.error('Erro inesperado ao buscar dados preventivos:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // SLA de Validação
  const { data: slaValidationStats = [], isLoading: loadingSlaValidation } = useQuery<SlaValidationStats[]>({
    queryKey: ['sla-validation-stats', startDate, endDate, isFilterActive],
    queryFn: async () => {
      let query = (supabase as any)
        .from('sla_validation_stats')
        .select('*');
      
      // CORREÇÃO: Só aplicar filtros de data se isFilterActive = true
      if (isFilterActive && startDate && endDate) {
        query = query
          .gte('month_year', `${startDate}T00:00:00`)
          .lte('month_year', `${endDate}T23:59:59`);
      }
      
      const { data } = await query;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Relatórios por Status
  const { data: reportsByStatusStats = [], isLoading: loadingReportsByStatus } = useQuery<ReportsByStatusStats[]>({
    queryKey: ['reports-by-status-stats', startDate, endDate, isFilterActive],
    queryFn: async () => {
      let query = (supabase as any)
        .from('reports_by_status_stats')
        .select('*');
      
      // CORREÇÃO: Só aplicar filtros de data se isFilterActive = true
      if (isFilterActive && startDate && endDate) {
        query = query
          .gte('month_year', `${startDate}T00:00:00`)
          .lte('month_year', `${endDate}T23:59:59`);
      }
      
      const { data } = await query;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Relatórios por Gestor
  const { data: reportsByManagerStats = [], isLoading: loadingReportsByManager } = useQuery<ReportsByManagerStats[]>({
    queryKey: ['reports-by-manager-stats', startDate, endDate, isFilterActive],
    queryFn: async () => {
      let query = (supabase as any)
        .from('reports_by_manager_stats')
        .select('*');
      
      // CORREÇÃO: Só aplicar filtros de data se isFilterActive = true
      if (isFilterActive && startDate && endDate) {
        query = query
          .gte('month_year', `${startDate}T00:00:00`)
          .lte('month_year', `${endDate}T23:59:59`);
      }
      
      const { data, error } = await query;

      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Relatórios por Pendência
  const { data: reportsByPendingReasonStats = [], isLoading: loadingReportsByPendingReason } = useQuery<ReportsByPendingReasonStats[]>({
    queryKey: ['reports-by-pending-reason-stats', startDate, endDate, isFilterActive],
    queryFn: async () => {
      let query = (supabase as any)
        .from('reports_by_pending_reason_stats')
        .select('*');
      
      // CORREÇÃO: Só aplicar filtros de data se isFilterActive = true
      if (isFilterActive && startDate && endDate) {
        query = query
          .gte('month_year', `${startDate}T00:00:00`)
          .lte('month_year', `${endDate}T23:59:59`);
      }
      
      console.log('🚀 QUERY - Pending Reason - isFilterActive:', isFilterActive, 'startDate:', startDate, 'endDate:', endDate);
      const { data, error } = await query;
      console.log('🚀 QUERY - Pending Reason - result:', { data, error });
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Top 10 Gestores com Pendências
  const { data: topPendingManagersStats = [], isLoading: loadingTopPendingManagers } = useQuery<TopPendingManagersStats[]>({
    queryKey: ['top-pending-managers-stats', startDate, endDate, isFilterActive],
    queryFn: async () => {
      let query = (supabase as any)
        .from('top_pending_managers_stats')
        .select('*')
        .limit(10);
      
      // CORREÇÃO: Só aplicar filtros de data se isFilterActive = true
      if (isFilterActive && startDate && endDate) {
        query = query
          .gte('month_year', `${startDate}T00:00:00`)
          .lte('month_year', `${endDate}T23:59:59`);
      }
      
      const { data } = await query;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Relatórios de Inspeção por Nível de Risco - CORREÇÃO
  const { data: inspectionStats = [], isLoading: loadingInspectionStats, error: inspectionError } = useQuery<InspectionStats[]>({
    queryKey: ['inspection-stats', startDate, endDate, isFilterActive],
    queryFn: async () => {
      try {
        let query = (supabase as any)
          .from('inspection_stats')
          .select('*');
        
        // CORREÇÃO: Só aplicar filtros de data se isFilterActive = true
        if (isFilterActive && startDate && endDate) {
          query = query
            .gte('month_year', `${startDate}T00:00:00`)
            .lte('month_year', `${endDate}T23:59:59`);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Erro ao buscar dados de inspeção:', error);
          return [];
        }
        
        // Log para debug da estrutura dos dados
        if (data && data.length > 0) {
          console.log('Dados de inspeção recebidos:', data[0]);
        }
        
        return data || [];
      } catch (error) {
        console.error('Erro inesperado ao buscar dados de inspeção:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // SLA de Validação por Gestor
  const { data: slaValidationByManagerStats = [], isLoading: loadingSlaValidationByManager } = useQuery<SlaValidationByManagerStats[]>({
    queryKey: ['sla-validation-by-manager-stats', startDate, endDate, isFilterActive],
    queryFn: async () => {
      let query = (supabase as any)
        .from('sla_validation_by_manager_stats')
        .select('*');
      
      // CORREÇÃO: Só aplicar filtros de data se isFilterActive = true
      if (isFilterActive && startDate && endDate) {
        query = query
          .gte('month_year', `${startDate}T00:00:00`)
          .lte('month_year', `${endDate}T23:59:59`);
      }
      
      const { data } = await query;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Estatísticas de Faturamento
  const { data: billingStats = [], isLoading: loadingBillingStats } = useQuery<BillingStats[]>({
    queryKey: ['billing-stats', startDate, endDate, isFilterActive],
    queryFn: async () => {
      let query = (supabase as any)
        .from('billing_stats')
        .select('*');
      
      // CORREÇÃO: Só aplicar filtros de data se isFilterActive = true
      if (isFilterActive && startDate && endDate) {
        query = query
          .gte('month_year', `${startDate}T00:00:00`)
          .lte('month_year', `${endDate}T23:59:59`);
      }
      
      const { data } = await query;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Nova query para dados de materiais
  const [materialsDateFilterType, setMaterialsDateFilterType] = useState<'activity' | 'charge' | 'usage' | 'invoice'>('activity');
  
  const { data: materialsStats = [], isLoading: loadingMaterials } = useQuery<MaterialsDashboardStats[]>({
    queryKey: ['materials-dashboard-stats', startDate, endDate, isFilterActive, materialsDateFilterType],
    queryFn: async () => {
      if (isFilterActive && startDate && endDate) {
        // Usar função RPC com filtros
        const { data, error } = await (supabase as any).rpc('get_materials_dashboard_stats_filtered', {
          start_date: startDate,
          end_date: endDate,
          filter_type: materialsDateFilterType
        });
        
        if (error) throw error;
        return data || [];
      } else {
        // Buscar dados sem filtro da view materializada
        const { data, error } = await (supabase as any)
          .from('materials_dashboard_stats')
          .select('*');
        
        if (error) throw error;
        return data || [];
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // --- PROCESSAMENTO DE DADOS OTIMIZADO ---
  // Dashboard Stats (Corretiva)
  const totalReports = dashboardStats.reduce((sum, stat) => sum + stat.total_reports, 0);
  const validatedReports = dashboardStats.reduce((sum, stat) => sum + stat.validated_reports, 0);
  const pendingReports = dashboardStats.reduce((sum, stat) => sum + stat.pending_reports, 0);
  const adequacyReports = dashboardStats.reduce((sum, stat) => sum + stat.adequacy_reports, 0);
  const adequateReports = dashboardStats.reduce((sum, stat) => sum + stat.adequate_reports, 0);
  const invoicedReports = dashboardStats.reduce((sum, stat) => sum + stat.invoiced_reports, 0);
  const notValidatedReports = dashboardStats.reduce((sum, stat) => sum + stat.not_validated_reports, 0);
  const noPendingReports = dashboardStats.reduce((sum, stat) => sum + stat.no_pending_reports, 0);

  // Preventive Stats
  const totalSchedules = preventiveStats.reduce((sum, stat) => sum + (stat.total_schedules || 0), 0);
  const completedSchedules = preventiveStats.reduce((sum, stat) => sum + (stat.completed_schedules || 0), 0);
  const pendingSchedules = preventiveStats.reduce((sum, stat) => sum + (stat.pending_schedules || 0), 0);

  // Inspection Stats
  const totalInspections = inspectionStats.reduce((sum, stat) => sum + (stat.total_inspections || 0), 0);
  const completedInspections = inspectionStats.reduce((sum, stat) => sum + (stat.completed_inspections || 0), 0);
  const pendingInspections = inspectionStats.reduce((sum, stat) => sum + (stat.pending_inspections || 0), 0);

  // --- PROCESSAMENTO DE DADOS DAS ESTATÍSTICAS ---
  // SLA de Validação
  const avgSlaHours = slaValidationStats.reduce((sum, stat) => sum + stat.avg_sla_hours, 0) / (slaValidationStats.length || 1);
  const totalValidatedReportsForSla = slaValidationStats.reduce((sum, stat) => sum + stat.total_validated_reports, 0);

  // Relatórios por Gestor - Totais agregados (SEM micro-incrementos)

  const totalReportsByManager = reportsByManagerStats
    .filter(stat => stat.manager_name && stat.total_reports > 0) // Filtrar dados válidos
    .reduce((acc, stat) => {
      const existing = acc.find(item => item.manager_id === stat.manager_id);
      if (existing) {
        existing.total_reports += stat.total_reports;
        existing.validated_reports += stat.validated_reports;
        existing.pending_reports += stat.pending_reports;
        existing.not_validated_reports += stat.not_validated_reports;
      } else {
        acc.push({
          manager_id: stat.manager_id,
          manager_name: stat.manager_name,
          total_reports: stat.total_reports,
          validated_reports: stat.validated_reports,
          pending_reports: stat.pending_reports,
          not_validated_reports: stat.not_validated_reports,
        });
      }
      return acc;
    }, [] as any[])
    .sort((a, b) => b.total_reports - a.total_reports);





  // Top 10 Gestores com Pendências - Totais agregados
  const topPendingManagersAggregated = topPendingManagersStats.reduce((acc, stat) => {
    const existing = acc.find(item => item.manager_id === stat.manager_id);
    if (existing) {
      existing.total_pending_reports += stat.total_pending_reports;
      existing.pending_reasons = [...new Set([...existing.pending_reasons, ...stat.pending_reasons])];
    } else {
      acc.push({
        manager_id: stat.manager_id,
        manager_name: stat.manager_name,
        total_pending_reports: stat.total_pending_reports,
        pending_reasons: stat.pending_reasons,
      });
    }
    return acc;
  }, [] as any[]).sort((a, b) => b.total_pending_reports - a.total_pending_reports);

  // Gráficos de Barras - Dados mensais (CORRIGIDO: usar diretamente os dados das views)
  const reportsByMonthData = dashboardStats.map(stat => ({
    month: new Date(stat.month_year).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }),
    count: stat.total_reports
  })).sort((a, b) => {
    const [monthA, yearA] = a.month.split('/');
    const [monthB, yearB] = b.month.split('/');
    return new Date(Number(yearA), Number(monthA) - 1).getTime() - new Date(Number(yearB), Number(monthB) - 1).getTime();
  });

  const preventiveByMonthData = preventiveStats.map(stat => ({
    month: new Date(stat.month_year).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }),
    count: stat.total_schedules || 0
  })).sort((a, b) => {
    const [monthA, yearA] = a.month.split('/');
    const [monthB, yearB] = b.month.split('/');
    return new Date(Number(yearA), Number(monthA) - 1).getTime() - new Date(Number(yearB), Number(monthB) - 1).getTime();
  });

  const completedPreventiveByMonthData = preventiveStats.map(stat => ({
    month: new Date(stat.month_year).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }),
    count: stat.completed_schedules || 0
  })).sort((a, b) => {
    const [monthA, yearA] = a.month.split('/');
    const [monthB, yearB] = b.month.split('/');
    return new Date(Number(yearB), Number(monthB) - 1).getTime() - new Date(Number(yearA), Number(monthA) - 1).getTime();
  });

  // Dados para gráfico de Total de Vistorias por mês/ano
  const totalVistoriasByMonthData = preventiveStats.map(stat => {
    const month = new Date(stat.month_year).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
    return {
      month,
      total: stat.total_schedules || 0
    };
  }).sort((a, b) => {
    const [monthA, yearA] = a.month.split('/');
    const [monthB, yearB] = b.month.split('/');
    return new Date(Number(yearA), Number(monthA) - 1).getTime() - new Date(Number(yearB), Number(monthB) - 1).getTime();
  });

  // Dados para gráfico de Total de Riscos por mês/ano
  const totalRiscosByMonthData = inspectionStats.map(stat => {
    const month = new Date(stat.month_year).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
    return {
      month,
      total: stat.total_inspections || 0
    };
  }).sort((a, b) => {
    const [monthA, yearA] = a.month.split('/');
    const [monthB, yearB] = b.month.split('/');
    return new Date(Number(yearA), Number(monthA) - 1).getTime() - new Date(Number(yearB), Number(monthB) - 1).getTime();
  });

  // Dados para gráfico de Vistorias Concluídas e Pendentes por mês/ano
  const vistoriasStatusByMonthData = preventiveStats.map(stat => {
    const month = new Date(stat.month_year).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
    return {
      month,
      concluidas: stat.completed_schedules || 0,
      pendentes: stat.pending_schedules || 0
    };
  }).sort((a, b) => {
    const [monthA, yearA] = a.month.split('/');
    const [monthB, yearB] = b.month.split('/');
    return new Date(Number(yearA), Number(monthA) - 1).getTime() - new Date(Number(yearB), Number(monthB) - 1).getTime();
  });

  // Dados para gráfico de Riscos por Status por mês/ano
  const riscosStatusByMonthData = inspectionStats.map(stat => {
    const month = new Date(stat.month_year).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
    return {
      month,
      tratados: stat.completed_inspections || 0,
      pendentes: stat.pending_inspections || 0,
      cancelados: stat.cancelled_inspections || 0
    };
  }).sort((a, b) => {
    const [monthA, yearA] = a.month.split('/');
    const [monthB, yearB] = b.month.split('/');
    return new Date(Number(yearA), Number(monthA) - 1).getTime() - new Date(Number(yearB), Number(monthB) - 1).getTime();
  });

  // Processamento de gráficos por status
  const reportsByStatusAggregated = reportsByStatusStats.reduce((acc, stat) => {
    const statusLabel = STATUS_LABELS[stat.status] || stat.status;
    const existing = acc.find(item => item.name === statusLabel);
    if (existing) {
      existing.value += stat.total_reports;
    } else {
      acc.push({ 
        name: statusLabel, 
        value: stat.total_reports,
        color: STATUS_COLORS[stat.status] || PIE_COLORS[acc.length % PIE_COLORS.length]
      });
    }
    return acc;
  }, [] as any[]).filter(item => item.value > 0).sort((a, b) => b.value - a.value);

  // Relatórios por Pendência - agregado com valores únicos forçados (APENAS PARA RENDERIZAÇÃO)
  const reportsByPendingReasonAggregated = reportsByPendingReasonStats.reduce((acc, stat) => {
    const pendingReason = stat.pending_reason || 'Sem Pendência';
    const existing = acc.find(item => item.name === pendingReason);
    if (existing) {
      existing.value += stat.total_reports;
    } else {
      acc.push({ 
        name: pendingReason, 
        value: stat.total_reports,
        id: `pending-${acc.length}` // Adicionar ID único
      });
    }
    return acc;
  }, [] as any[])
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);



  // Relatórios por Status - mensal
  const reportsByStatusMonthlyData = reportsByStatusStats.map(stat => ({
    month: new Date(stat.month_year).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }),
    status: STATUS_LABELS[stat.status] || stat.status,
    count: stat.total_reports
  }));

  // SLA de Validação por Mês (CORRIGIDO: conversão para números)
  const slaValidationByMonthData = slaValidationStats.map(stat => ({
    month: new Date(stat.month_year).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }),
    avg_sla_hours: stat.avg_sla_hours
  })).sort((a, b) => {
    const [monthA, yearA] = a.month.split('/');
    const [monthB, yearB] = b.month.split('/');
    return new Date(Number(yearA), Number(monthA) - 1).getTime() - new Date(Number(yearB), Number(monthB) - 1).getTime();
  });

  // Relatórios de Inspeção por Nível de Risco - CORREÇÃO
  const inspectionReportsByLevelData = inspectionStats.length > 0 
    ? [
        { name: 'Alto Risco', value: inspectionStats.reduce((sum, stat) => sum + (stat.high_risk_count || 0), 0) },
        { name: 'Médio Risco', value: inspectionStats.reduce((sum, stat) => sum + (stat.medium_risk_count || 0), 0) },
        { name: 'Baixo Risco', value: inspectionStats.reduce((sum, stat) => sum + (stat.low_risk_count || 0), 0) }
      ].filter(item => item.value > 0).sort((a, b) => b.value - a.value)
    : []; // Retornar array vazio se não houver dados
  
  // Log para debug dos dados processados
  if (inspectionReportsByLevelData.length > 0) {
    console.log('Dados processados para o gráfico:', inspectionReportsByLevelData);
  }

  // SLA de Validação por Gestor - Totais agregados
  const slaValidationByManagerAggregated = slaValidationByManagerStats.reduce((acc, stat) => {
    const existing = acc.find(item => item.manager_id === stat.manager_id);
    if (existing) {
      // Média ponderada do SLA baseada no número de relatórios
      const totalWeight = existing.total_reports + stat.total_reports;
      existing.avg_sla_hours = (existing.avg_sla_hours * existing.total_reports + stat.avg_sla_hours * stat.total_reports) / totalWeight;
      existing.total_reports += stat.total_reports;
      existing.validated_reports += stat.validated_reports;
      existing.min_sla_hours = Math.min(existing.min_sla_hours || Infinity, stat.min_sla_hours || Infinity);
      existing.max_sla_hours = Math.max(existing.max_sla_hours || 0, stat.max_sla_hours || 0);
    } else {
      acc.push({
        manager_id: stat.manager_id,
        manager_name: stat.manager_name,
        total_reports: stat.total_reports,
        validated_reports: stat.validated_reports,
        avg_sla_hours: stat.avg_sla_hours || 0,
        min_sla_hours: stat.min_sla_hours || 0,
        max_sla_hours: stat.max_sla_hours || 0,
      });
    }
    return acc;
  }, [] as any[]).sort((a, b) => (a.avg_sla_hours || 0) - (b.avg_sla_hours || 0)); // Ordenar por SLA crescente

  // Processar dados de faturamento para a tabela
  const billingStatsTableData = useMemo(() => {
    if (!billingStats.length) return [];
    
    return billingStats
      .filter(stat => stat.total_reports > 0)
      .map(stat => {
        const nonInvoicedReports = stat.validatable_reports - stat.invoiced_reports;
        const invoicedPercentage = ((stat.invoiced_reports / stat.total_reports) * 100);
        
        return {
          month_year: stat.month_year,
          total_reports: stat.total_reports,
          invoiced_reports: stat.invoiced_reports,
          non_invoiced_reports: nonInvoicedReports,
          invoiced_percentage: invoicedPercentage,
          avg_billing_sla: stat.avg_billing_sla_hours,
          min_billing_sla: stat.min_billing_sla_hours,
          max_billing_sla: stat.max_billing_sla_hours,
        };
      })
      .sort((a, b) => new Date(b.month_year).getTime() - new Date(a.month_year).getTime()); // Ordenar por data decrescente
  }, [billingStats]);

  // Aplicar filtros de data se estiver ativo
  const filteredReportsByMonthData = isFilterActive ? reportsByMonthData : reportsByMonthData;
  const filteredPreventiveByMonthData = isFilterActive ? preventiveByMonthData : preventiveByMonthData;

  // Função para aplicar filtros
  const applyFilters = () => {
    if (!startDate || !endDate) {
      alert('Por favor, selecione as datas de início e fim.');
      return;
    }
    setIsFilterActive(true);
  };

  const clearFilters = () => {
    setIsFilterActive(false);
  };

  if (loadingStats || loadingPreventive || loadingSlaValidation || loadingReportsByStatus || loadingReportsByManager || loadingReportsByPendingReason || loadingTopPendingManagers || loadingInspectionStats || loadingSlaValidationByManager || loadingBillingStats || loadingMaterials) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Filtros de Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="endDate">Data de Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={applyFilters} className="whitespace-nowrap">
                <Calendar className="h-4 w-4 mr-2" />
                Aplicar Filtros
              </Button>
              <Button variant="outline" onClick={clearFilters} className="whitespace-nowrap">
                Limpar Filtros
              </Button>
            </div>
          </div>
          {isFilterActive && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Filtros ativos:</strong> {startDate} até {endDate}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Abas Dashboard */}
      <Tabs defaultValue="corretiva" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="corretiva">Corretiva</TabsTrigger>
          <TabsTrigger value="preventiva">Preventiva</TabsTrigger>
          <TabsTrigger value="materiais">Materiais</TabsTrigger>
          <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
        </TabsList>

        {/* Aba Corretiva */}
        <TabsContent value="corretiva" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard title="Relatórios Técnicos" value={totalReports} icon={FileText} />
            <StatCard title="Validados" value={validatedReports} icon={CheckSquare} color="primary" />
            <StatCard title="Pendentes" value={pendingReports} icon={AlertTriangle} color="warning" />
            <StatCard title="Em Adequação" value={adequacyReports} icon={TrendingUp} color="secondary" />
            <StatCard title="Adequados" value={adequateReports} icon={CheckSquare} color="primary" />
            <StatCard title="Faturados" value={invoicedReports} icon={FileText} color="primary" />
            <StatCard title="Não Validados" value={notValidatedReports} icon={AlertTriangle} color="danger" />
            <StatCard title="Sem Pendência" value={noPendingReports} icon={CheckSquare} color="primary" />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Técnicos por Mês/Ano</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportsByMonthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1a9446" name="Relatórios" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Preventiva */}
        <TabsContent value="preventiva" className="space-y-6">
          {preventiveError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">
                Erro ao carregar dados preventivos. Verifique se a view 'preventive_stats' existe no banco de dados.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Métricas de Vistorias */}
            <StatCard title="Total de Vistorias" value={totalSchedules} icon={Calendar} />
            <StatCard title="Vistorias Concluídas" value={completedSchedules} icon={CheckSquare} color="primary" />
            <StatCard title="Vistorias Pendentes" value={pendingSchedules} icon={AlertTriangle} color="warning" />
            <StatCard 
              title="% Vistorias Concluídas" 
              value={totalSchedules > 0 && completedSchedules >= 0 ? `${((completedSchedules / totalSchedules) * 100).toFixed(1)}%` : '0%'} 
              icon={TrendingUp} 
              color="secondary" 
            />
            
            {/* Métricas de Riscos */}
            <StatCard title="Total de Riscos" value={totalInspections} icon={AlertTriangle} />
            <StatCard title="Riscos Tratados" value={completedInspections} icon={CheckSquare} color="primary" />
            <StatCard title="Riscos Pendentes" value={pendingInspections} icon={AlertTriangle} color="warning" />
            <StatCard 
              title="% Riscos Tratados" 
              value={totalInspections > 0 && completedInspections >= 0 ? `${((completedInspections / totalInspections) * 100).toFixed(1)}%` : '0%'} 
              icon={TrendingUp} 
              color="secondary" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Total de Vistorias por Mês/Ano</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={totalVistoriasByMonthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#10b981" name="Total de Vistorias" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total de Riscos por Mês/Ano</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={totalRiscosByMonthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#3b82f6" name="Total de Riscos" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos de Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Vistorias Concluídas e Pendentes por Mês/Ano</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={vistoriasStatusByMonthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="concluidas" fill="#10b981" name="Concluídas" />
                    <Bar dataKey="pendentes" fill="#f59e0b" name="Pendentes" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Riscos Cancelados, Tratados e Pendentes por Mês/Ano</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={riscosStatusByMonthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="tratados" fill="#10b981" name="Tratados" />
                    <Bar dataKey="pendentes" fill="#f59e0b" name="Pendentes" />
                    <Bar dataKey="cancelados" fill="#ef4444" name="Cancelados" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Relatórios de Inspeção por Nível de Risco</CardTitle>
            </CardHeader>
            <CardContent>
              {inspectionReportsByLevelData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={inspectionReportsByLevelData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {inspectionReportsByLevelData.map((entry, idx) => {
                        const color = RISK_LEVEL_COLORS[entry.name.toLowerCase()] || PIE_COLORS[idx % PIE_COLORS.length];
                        return <Cell key={`cell-${idx}`} fill={color} />;
                      })}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p>Dados de inspeção não disponíveis no momento.</p>
                  {inspectionError ? (
                    <p className="text-sm text-red-500">Erro ao carregar dados da view 'inspection_stats'</p>
                  ) : (
                    <p className="text-sm">Carregando dados da view 'inspection_stats'...</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Nova Aba Materiais */}
        <TabsContent value="materiais" className="space-y-6">
          {/* Filtros específicos para materiais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros de Materiais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="materialsStartDate">Data de Início</Label>
                  <Input
                    id="materialsStartDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="materialsEndDate">Data de Fim</Label>
                  <Input
                    id="materialsEndDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="materialsDateFilterType">Tipo de Filtro</Label>
                  <Select value={materialsDateFilterType} onValueChange={(value: any) => setMaterialsDateFilterType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activity">Qualquer Atividade</SelectItem>
                      <SelectItem value="charge">Data da Carga</SelectItem>
                      <SelectItem value="usage">Data da Baixa</SelectItem>
                      <SelectItem value="invoice">Data do Faturamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={applyFilters} className="whitespace-nowrap">
                    <Calendar className="h-4 w-4 mr-2" />
                    Aplicar Filtros
                  </Button>
                  <Button variant="outline" onClick={clearFilters} className="whitespace-nowrap">
                    Limpar Filtros
                  </Button>
                </div>
              </div>
              
              {isFilterActive && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Filtros ativos:</strong> {startDate} até {endDate} | 
                    <strong>Tipo:</strong> {
                      materialsDateFilterType === 'activity' ? 'Qualquer Atividade' :
                      materialsDateFilterType === 'charge' ? 'Data da Carga' :
                      materialsDateFilterType === 'usage' ? 'Data da Baixa' :
                      'Data do Faturamento'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cards de estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard 
              title="Total de Materiais" 
              value={materialsStats.length} 
              icon={BarChart3} 
              color="primary" 
            />
            <StatCard 
              title="Total Carga" 
              value={materialsStats.reduce((sum, item) => sum + item.carga, 0)} 
              icon={TrendingUp} 
              color="secondary" 
            />
            <StatCard 
              title="Total Baixados" 
              value={materialsStats.reduce((sum, item) => sum + item.baixados, 0)} 
              icon={Minus} 
              color="warning" 
            />
            <StatCard 
              title="Total Faturado" 
              value={materialsStats.reduce((sum, item) => sum + item.faturado, 0)} 
              icon={FileText} 
              color="primary" 
            />
          </div>

          {/* Tabela de materiais */}
          <Card>
            <CardHeader>
              <CardTitle>Controle de Materiais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-gray-700">Material</th>
                      <th className="text-center p-3 font-medium text-gray-700">Carga</th>
                      <th className="text-center p-3 font-medium text-gray-700">Baixados</th>
                      <th className="text-center p-3 font-medium text-gray-700">Saldo</th>
                      <th className="text-center p-3 font-medium text-gray-700">Faturado</th>
                      <th className="text-center p-3 font-medium text-gray-700">% Utilização</th>
                      <th className="text-center p-3 font-medium text-gray-700">% Faturado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialsStats.map((item) => (
                      <tr key={item.checklist_item_id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900">
                          {item.material_name}
                        </td>
                        <td className="p-3 text-center text-blue-600 font-semibold">
                          {item.carga.toLocaleString('pt-BR')}
                        </td>
                        <td className="p-3 text-center text-red-600 font-semibold">
                          {item.baixados.toLocaleString('pt-BR')}
                        </td>
                        <td className={`p-3 text-center font-semibold ${
                          item.saldo >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.saldo.toLocaleString('pt-BR')}
                        </td>
                        <td className="p-3 text-center text-indigo-600 font-semibold">
                          {item.faturado.toLocaleString('pt-BR')}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.percentual_utilizacao >= 80 ? 'bg-green-100 text-green-800' :
                            item.percentual_utilizacao >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {item.percentual_utilizacao.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.percentual_faturado >= 80 ? 'bg-green-100 text-green-800' :
                            item.percentual_faturado >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {item.percentual_faturado.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Barras - Top 10 Materiais por Carga */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Materiais por Carga</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={materialsStats
                    .sort((a, b) => b.carga - a.carga)
                    .slice(0, 10)
                    .map(item => ({
                      name: item.material_name.length > 20 ? item.material_name.substring(0, 20) + '...' : item.material_name,
                      carga: item.carga,
                      baixados: item.baixados,
                      saldo: item.saldo
                    }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="carga" fill="#3b82f6" name="Carga" />
                  <Bar dataKey="baixados" fill="#ef4444" name="Baixados" />
                  <Bar dataKey="saldo" fill="#10b981" name="Saldo" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Estatísticas */}
        <TabsContent value="estatisticas" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard 
              title="SLA Médio de Validação" 
              value={`${avgSlaHours.toFixed(1)}h`} 
              icon={Clock} 
              color="primary" 
            />
            <StatCard 
              title="Relatórios Validados (SLA)" 
              value={totalValidatedReportsForSla} 
              icon={CheckSquare} 
              color="primary" 
            />
            <StatCard 
              title="Gestores Ativos" 
              value={totalReportsByManager.length} 
              icon={Users} 
              color="secondary" 
            />
            <StatCard 
              title="Gestores com Pendências" 
              value={topPendingManagersAggregated.length} 
              icon={AlertTriangle} 
              color="warning" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>SLA de Validação por Mês (Horas)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={slaValidationByMonthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="avg_sla_hours" fill="#3b82f6" name="SLA Médio (horas)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Relatórios por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportsByStatusAggregated}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {reportsByStatusAggregated.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios por Pendência</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  {reportsByPendingReasonAggregated.length > 0 ? (
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium text-gray-700">Tipo de Pendência</th>
                          <th className="text-center p-3 font-medium text-gray-700">Quantidade</th>
                          <th className="text-center p-3 font-medium text-gray-700">Percentual</th>
                          <th className="text-center p-3 font-medium text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportsByPendingReasonAggregated.slice(0, 8).map((item, index) => {
                          const total = reportsByPendingReasonAggregated.reduce((sum, i) => sum + i.value, 0);
                          const percentage = ((item.value / total) * 100).toFixed(1);
                          const isNoPending = item.name === 'Sem Pendência';
                          
                          return (
                            <tr key={item.id || index} className="border-b hover:bg-gray-50">
                              <td className="p-3 font-medium text-gray-900">
                                {item.name}
                              </td>
                              <td className="p-3 text-center font-semibold text-gray-800">
                                {item.value.toLocaleString('pt-BR')}
                              </td>
                              <td className="p-3 text-center text-gray-600">
                                {percentage}%
                              </td>
                              <td className="p-3 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  isNoPending 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {isNoPending ? 'Sem Pendência' : 'Pendente'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-gray-500">
                      Nenhum dado de pendência disponível
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Relatórios por Gestor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  {totalReportsByManager.length > 0 ? (
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium text-gray-700">Gestor</th>
                          <th className="text-center p-3 font-medium text-gray-700">Total</th>
                          <th className="text-center p-3 font-medium text-gray-700">Validados</th>
                          <th className="text-center p-3 font-medium text-gray-700">Pendentes</th>
                          <th className="text-center p-3 font-medium text-gray-700">Não Validados</th>
                          <th className="text-center p-3 font-medium text-gray-700">Percentual</th>
                        </tr>
                      </thead>
                      <tbody>
                        {totalReportsByManager.slice(0, 8).map((item, index) => {
                          const total = totalReportsByManager.reduce((sum, i) => sum + i.total_reports, 0);
                          const percentage = ((item.total_reports / total) * 100).toFixed(1);
                          
                          return (
                            <tr key={item.manager_id} className="border-b hover:bg-gray-50">
                              <td className="p-3 font-medium text-gray-900">
                                {item.manager_name}
                              </td>
                              <td className="p-3 text-center font-semibold text-gray-800">
                                {item.total_reports.toLocaleString('pt-BR')}
                              </td>
                              <td className="p-3 text-center">
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                  {item.validated_reports.toLocaleString('pt-BR')}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                                  {item.pending_reports.toLocaleString('pt-BR')}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                                  {item.not_validated_reports.toLocaleString('pt-BR')}
                                </span>
                              </td>
                              <td className="p-3 text-center text-gray-600">
                                {percentage}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-gray-500">
                      Nenhum dado de gestor disponível
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top 10 Gestores com Pendências</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Posição</th>
                      <th className="text-left p-2">Gestor</th>
                      <th className="text-center p-2">Total de Pendências</th>
                      <th className="text-left p-2">Tipos de Pendência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPendingManagersAggregated.map((manager, index) => (
                      <tr key={manager.manager_id} className="border-b">
                        <td className="p-2 font-semibold">#{index + 1}</td>
                        <td className="p-2">{manager.manager_name}</td>
                        <td className="p-2 text-center">
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
                            {manager.total_pending_reports}
                          </span>
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1">
                            {manager.pending_reasons.map((reason, idx) => (
                              <span 
                                key={idx} 
                                className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs"
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* SLA de Validação por Gestor */}
          <Card>
            <CardHeader>
              <CardTitle>SLA de Validação por Gestor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {slaValidationByManagerAggregated.length > 0 ? (
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium text-gray-700">Gestor</th>
                        <th className="text-center p-3 font-medium text-gray-700">Total</th>
                        <th className="text-center p-3 font-medium text-gray-700">Validados</th>
                        <th className="text-center p-3 font-medium text-gray-700">SLA Médio</th>
                        <th className="text-center p-3 font-medium text-gray-700">SLA Mín</th>
                        <th className="text-center p-3 font-medium text-gray-700">SLA Máx</th>
                        <th className="text-center p-3 font-medium text-gray-700">Taxa Validação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slaValidationByManagerAggregated.map((item, index) => (
                        <tr key={item.manager_id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium text-gray-900">
                            {item.manager_name}
                          </td>
                          <td className="p-3 text-center">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              {item.total_reports.toLocaleString('pt-BR')}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              {item.validated_reports.toLocaleString('pt-BR')}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.avg_sla_hours <= 24 ? 'bg-green-100 text-green-800' :
                              item.avg_sla_hours <= 48 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.avg_sla_hours ? `${item.avg_sla_hours.toFixed(1)}h` : 'N/A'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                              {item.min_sla_hours ? `${item.min_sla_hours.toFixed(1)}h` : 'N/A'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                              {item.max_sla_hours ? `${item.max_sla_hours.toFixed(1)}h` : 'N/A'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              (item.validated_reports / item.total_reports) >= 0.8 ? 'bg-green-100 text-green-800' :
                              (item.validated_reports / item.total_reports) >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {((item.validated_reports / item.total_reports) * 100).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex items-center justify-center h-32 text-gray-500">
                    Nenhum dado de SLA por gestor disponível para o período selecionado.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas de Faturamento */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas de Faturamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {billingStatsTableData.length > 0 ? (
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium text-gray-700">Mês/Ano</th>
                        <th className="text-center p-3 font-medium text-gray-700">Total de Relatórios</th>
                        <th className="text-center p-3 font-medium text-gray-700">Relatórios Faturados</th>
                        <th className="text-center p-3 font-medium text-gray-700">Relatórios Não Faturados</th>
                        <th className="text-center p-3 font-medium text-gray-700">Percentual Faturado</th>
                        <th className="text-center p-3 font-medium text-gray-700">SLA de Faturamento</th>
                        <th className="text-center p-3 font-medium text-gray-700">SLA Mín de Faturamento</th>
                        <th className="text-center p-3 font-medium text-gray-700">SLA Máx de Faturamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingStatsTableData.map((item, index) => (
                        <tr key={item.month_year} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium text-gray-900">
                            {item.month_year}
                          </td>
                          <td className="p-3 text-center font-semibold text-gray-800">
                            {item.total_reports.toLocaleString('pt-BR')}
                          </td>
                          <td className="p-3 text-center">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              {item.invoiced_reports.toLocaleString('pt-BR')}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                              {item.non_invoiced_reports.toLocaleString('pt-BR')}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.invoiced_percentage >= 80 ? 'bg-green-100 text-green-800' :
                              item.invoiced_percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.invoiced_percentage.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.avg_billing_sla <= 24 ? 'bg-green-100 text-green-800' :
                              item.avg_billing_sla <= 48 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.avg_billing_sla ? `${item.avg_billing_sla.toFixed(1)}h` : 'N/A'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                              {item.min_billing_sla ? `${item.min_billing_sla.toFixed(1)}h` : 'N/A'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                              {item.max_billing_sla ? `${item.max_billing_sla.toFixed(1)}h` : 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex items-center justify-center h-32 text-gray-500">
                    Nenhum dado de faturamento disponível para o período selecionado.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;