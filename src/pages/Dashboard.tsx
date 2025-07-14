
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import StatCard from '@/components/dashboard/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, CheckSquare, AlertTriangle, TrendingUp, Calendar, Filter } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import React, { useState, useEffect } from 'react';

const STATUS_LABELS: Record<string, string> = {
  nao_validado: 'Não Validado',
  validado: 'Validado',
  pendente: 'Pendente',
  cancelado: 'Cancelado',
  em_adequacao: 'Em Adequação',
  adequado: 'Adequado',
  faturado: 'Faturado',
  concluido: 'Concluído',
  sem_pendencia: 'Sem Pendência',
};

const RISK_STATUS_LABELS: Record<string, string> = {
  enviado: 'Enviado',
  direcionado: 'Direcionado',
  concluido: 'Concluído',
  aberto: 'Aberto',
};

const RISK_LEVEL_LABELS: Record<string, string> = {
  alto: 'Alto',
  medio: 'Médio',
  baixo: 'Baixo',
};

const PIE_COLORS = ['#ef4444', '#facc15', '#22c55e', '#3b82f6', '#a21caf', '#f472b6'];

// Cores fixas para cada grau de risco
const RISK_LEVEL_COLORS: Record<string, string> = {
  alto: '#ef4444', // vermelho
  medio: '#facc15', // amarelo
  baixo: '#22c55e', // verde
};

function groupBy(arr: any[], key: string) {
  return arr.reduce((acc: Record<string, number>, item) => {
    const k = item[key] ?? 'indefinido';
    acc[k] = (acc[k] || 0) + 1;
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

  // Definir datas padrão (últimos 30 dias)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

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

  // --- CORRETIVA ---
  const { data: reports = [], isLoading: loadingReports } = useQuery({
    queryKey: ['dashboard-reports', startDate, endDate, isFilterActive],
    queryFn: async () => {
      let query = supabase
        .from('reports')
        .select('*')
        .neq('template_id', '4b45c601-e5b7-4a33-98f9-1769aad319e9'); // exceto vistoria preventiva
      
      if (isFilterActive && startDate && endDate) {
        query = query
          .gte('created_at', `${startDate}T00:00:00`)
          .lte('created_at', `${endDate}T23:59:59`);
      }
      
      const { data } = await query;
      return data || [];
    }
  });

  // --- PREVENTIVA ---
  const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: ['dashboard-schedules', startDate, endDate, isFilterActive],
    queryFn: async () => {
      let query = supabase.from('preventive_schedule').select('*');
      
      if (isFilterActive && startDate && endDate) {
        query = query
          .gte('created_at', `${startDate}T00:00:00`)
          .lte('created_at', `${endDate}T23:59:59`);
      }
      
      const { data } = await query;
      return data || [];
    }
  });

  // Buscar relatórios de vistoria preventiva (substitui riscos)
  const { data: inspectionReports = [], isLoading: loadingInspectionReports } = useQuery({
    queryKey: ['dashboard-inspection-reports', startDate, endDate, isFilterActive],
    queryFn: async () => {
      let query = supabase.from('inspection_reports').select('*');
      
      if (isFilterActive && startDate && endDate) {
        query = query
          .gte('created_at', `${startDate}T00:00:00`)
          .lte('created_at', `${endDate}T23:59:59`);
      }
      
      const { data } = await query;
      return data || [];
    }
  });

  // --- Agrupamentos Corretiva ---
  const totalReports = reports.length;
  const reportsByStatus = groupBy(reports, 'status');
  const reportsByMonth = groupByMonth(reports, 'created_at');
  const adequacaoReports = reports.filter(
    (r: any) => r.status === 'em_adequacao' || r.status === 'adequado'
  ).length;

  // --- Agrupamentos Preventiva ---
  const schedulesByStatus = groupBy(schedules, 'is_completed');
  const schedulesByMonth = groupByMonth(schedules, 'created_at');

  // Relatórios de vistoria preventiva (riscos)
  const totalInspectionReports = inspectionReports.length;
  const inspectionReportsByStatus = groupBy(inspectionReports, 'status');
  const inspectionReportsByLevel = groupBy(inspectionReports, 'risk_level');
  const inspectionReportsByMonth = groupByMonth(inspectionReports, 'created_at');

  const riscosConcluidos = inspectionReportsByStatus['concluido'] || 0;
  const riscosPendentes = inspectionReportsByStatus['pendente'] || 0;
  const percentualRiscosConcluidos = (riscosConcluidos + riscosPendentes) > 0
    ? ((riscosConcluidos / (riscosConcluidos + riscosPendentes)) * 100).toFixed(1)
    : '0.0';

  // --- Loading ---
  if (loadingReports || loadingSchedules || loadingInspectionReports) {
    return <div className="p-8">Carregando...</div>;
  }

  // --- Dados para gráficos ---
  const reportsByMonthData = Object.entries(reportsByMonth).map(([month, count]) => ({ month: String(month), count: Number(count) }));
  // Gráficos simples: total por mês/ano
  const schedulesTotalByMonth = Object.entries(schedulesByMonth).map(([month, count]) => ({ month: String(month), total: Number(count) }));
  const inspectionReportsTotalByMonth = Object.entries(inspectionReportsByMonth).map(([month, count]) => ({ month: String(month), total: Number(count) }));
  // Gráficos agrupados
  const schedulesByMonthGrouped = Object.entries(schedulesByMonth).map(([month, total]) => {
    const monthSchedules = schedules.filter(s => {
      const scheduleDate = new Date(s.created_at);
      const scheduleMonth = `${String(scheduleDate.getMonth() + 1).padStart(2, '0')}/${scheduleDate.getFullYear()}`;
      return scheduleMonth === month;
    });
    const pendentes = monthSchedules.filter(s => !s.is_completed).length;
    const realizados = monthSchedules.filter(s => s.is_completed).length;
    return { month: String(month), pendentes, realizados };
  });
  const inspectionReportsByMonthGrouped = Object.entries(inspectionReportsByMonth).map(([month, total]) => {
    const monthReports = inspectionReports.filter(r => {
      const reportDate = new Date(r.created_at);
      const reportMonth = `${String(reportDate.getMonth() + 1).padStart(2, '0')}/${reportDate.getFullYear()}`;
      return reportMonth === month;
    });
    const pendentes = monthReports.filter(r => r.status === 'pendente').length;
    const concluidos = monthReports.filter(r => r.status === 'concluido').length;
    const cancelados = monthReports.filter(r => r.status === 'cancelado').length;
    return { month: String(month), pendentes, concluidos, cancelados };
  });
  const inspectionReportsByLevelData = Object.entries(inspectionReportsByLevel).map(([level, count]) => ({
    name: RISK_LEVEL_LABELS[level] || String(level),
    value: Number(count),
  }));

  // Função para limpar filtros
  const clearFilters = () => {
    setIsFilterActive(false);
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  // Função para aplicar filtros
  const applyFilters = () => {
    if (startDate && endDate) {
      setIsFilterActive(true);
    }
  };

  // --- Renderização ---
  return (
    <div className="p-8 space-y-10">
      {/* Filtro de Datas */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtro de Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={applyFilters}
                className="flex-1"
                disabled={!startDate || !endDate}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Aplicar
              </Button>
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="flex-1"
              >
                Limpar
              </Button>
            </div>
            {isFilterActive && (
              <div className="text-sm text-muted-foreground">
                Filtro ativo: {startDate} a {endDate}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Seção Corretiva */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Corretiva</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatCard title="Relatórios Técnicos" value={totalReports} icon={FileText} />
          {Object.entries(reportsByStatus).map(([status, count], idx) => (
            <StatCard
              key={status}
              title={`Status: ${STATUS_LABELS[status] || status}`}
              value={Number(count)}
              icon={TrendingUp}
              color={status === 'pendente' ? 'warning' : status === 'cancelado' ? 'danger' : 'primary'}
            />
          ))}
        </div>
        <Card className="mb-8">
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
      </section>

      {/* Seção Preventiva */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Preventiva</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatCard title="Vistorias" value={schedules.length} icon={FileText} />
          {Object.entries(schedulesByStatus).map(([status, count]) => (
            <StatCard
              key={status}
              title={`Vistorias: ${status === 'true' ? 'Concluídas' : 'Pendentes'}`}
              value={Number(count)}
              icon={TrendingUp}
              color={status === 'true' ? 'primary' : 'warning'}
            />
          ))}
          <StatCard title="Riscos" value={totalInspectionReports} icon={AlertTriangle} />
          {Object.entries(inspectionReportsByStatus).map(([status, count]) => (
            <StatCard
              key={status}
              title={`Riscos: ${RISK_STATUS_LABELS[status] || STATUS_LABELS[status] || status}`}
              value={Number(count)}
              icon={TrendingUp}
              color={status === 'concluido' ? 'primary' : status === 'pendente' ? 'warning' : 'secondary'}
            />
          ))}
          <StatCard
            title="% de Riscos Concluídos"
            value={`${percentualRiscosConcluidos}%`}
            icon={TrendingUp}
            color="primary"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Vistorias por Mês/Ano</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={schedulesTotalByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3b82f6" name="Total de Vistorias" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Riscos por Mês/Ano</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={inspectionReportsTotalByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#ef4444" name="Total de Riscos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Vistorias por Mês/Ano (Agrupado)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={schedulesByMonthGrouped}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="pendentes" fill="#f59e0b" name="Pendentes" />
                  <Bar dataKey="realizados" fill="#10b981" name="Realizados" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Riscos por Mês/Ano (Agrupado)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={inspectionReportsByMonthGrouped}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="pendentes" fill="#f59e0b" name="Pendentes" />
                  <Bar dataKey="concluidos" fill="#10b981" name="Concluídos" />
                  <Bar dataKey="cancelados" fill="#6b7280" name="Cancelados" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Riscos por Grau de Risco</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
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
                      // entry.name pode ser 'Alto', 'Médio', 'Baixo' (label), mas o valor original é o key do objeto
                      // Para garantir, mapeie para minúsculo e sem acento
                      let key = '';
                      if (entry.name.toLowerCase().includes('alto')) key = 'alto';
                      else if (entry.name.toLowerCase().includes('médio') || entry.name.toLowerCase().includes('medio')) key = 'medio';
                      else if (entry.name.toLowerCase().includes('baixo')) key = 'baixo';
                      const color = RISK_LEVEL_COLORS[key] || PIE_COLORS[idx % PIE_COLORS.length];
                      return <Cell key={`cell-${idx}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
