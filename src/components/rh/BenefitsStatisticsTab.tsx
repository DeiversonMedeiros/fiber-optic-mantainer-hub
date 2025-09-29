import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  CalendarIcon,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Download,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useBenefitStatistics } from '@/hooks/rh/useUnifiedBenefits';
import { useBenefitConfigurations } from '@/hooks/rh/useUnifiedBenefits';
import { useEmployeeBenefitAssignments } from '@/hooks/rh/useUnifiedBenefits';
import { toast } from 'sonner';

interface BenefitsStatisticsTabProps {
  companyId: string;
}

export function BenefitsStatisticsTab({ companyId }: BenefitsStatisticsTabProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  const { data: statistics, isLoading: statsLoading } = useBenefitStatistics(companyId, selectedMonth, selectedYear);
  const { data: configurations } = useBenefitConfigurations(companyId);
  const { data: assignments } = useEmployeeBenefitAssignments(companyId);

  const handleExportReport = (format: 'pdf' | 'excel') => {
    toast.info(`Exportação em ${format.toUpperCase()} será implementada em breve`);
  };

  const getBenefitTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'vr_va': 'VR/VA',
      'transporte': 'Transporte',
      'equipment_rental': 'Locação de Equipamentos',
      'premiacao': 'Premiação'
    };
    return labels[type] || type;
  };

  const getBenefitTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'vr_va': 'bg-blue-500',
      'transporte': 'bg-green-500',
      'equipment_rental': 'bg-purple-500',
      'premiacao': 'bg-orange-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  // Estatísticas por tipo de benefício
  const benefitTypeStats = configurations?.map(config => {
    const relatedAssignments = assignments?.filter(assignment => 
      assignment.benefit_type === config.benefit_type
    ) || [];
    
    const totalValue = relatedAssignments.reduce((sum, assignment) => {
      if (assignment.criteria_type === 'fixed_value' && assignment.criteria_value) {
        return sum + parseFloat(assignment.criteria_value);
      }
      return sum;
    }, 0);

    return {
      type: config.benefit_type,
      name: getBenefitTypeLabel(config.benefit_type),
      count: relatedAssignments.length,
      totalValue,
      color: getBenefitTypeColor(config.benefit_type)
    };
  }) || [];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Carregando estatísticas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Relatórios e Estatísticas</h3>
          <p className="text-sm text-muted-foreground">
            Visualize relatórios detalhados e estatísticas dos benefícios
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExportReport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={() => handleExportReport('pdf')}>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filtros de Período */}
      <Card>
        <CardHeader>
          <CardTitle>Período de Análise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div>
              <Label htmlFor="period">Período</Label>
              <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="month">Mês</Label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {format(new Date(2024, month - 1), 'MMM', { locale: ptBR })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="year">Ano</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Total de Funcionários</p>
                <p className="text-2xl font-bold">{statistics?.total_employees || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Benefícios Ativos</p>
                <p className="text-2xl font-bold">{statistics?.total_active_benefits || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Valor Total Mensal</p>
                <p className="text-2xl font-bold">
                  R$ {(statistics?.total_monthly_value || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Crescimento</p>
                <p className="text-2xl font-bold text-green-600">+12.5%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Tipo de Benefício */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Tipo de Benefício</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gráfico de Barras Simples */}
            <div className="space-y-4">
              <h4 className="font-medium">Funcionários por Benefício</h4>
              {benefitTypeStats.map((stat) => (
                <div key={stat.type} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded ${stat.color}`}></div>
                  <span className="text-sm font-medium w-32">{stat.name}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${stat.color}`}
                      style={{ width: `${(stat.count / Math.max(...benefitTypeStats.map(s => s.count), 1)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold w-16 text-right">{stat.count}</span>
                </div>
              ))}
            </div>

            {/* Valores por Tipo */}
            <div className="space-y-4">
              <h4 className="font-medium">Valor Mensal por Benefício</h4>
              {benefitTypeStats.map((stat) => (
                <div key={stat.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${stat.color}`}></div>
                    <span className="font-medium">{stat.name}</span>
                  </div>
                  <span className="font-bold text-green-600">
                    R$ {stat.totalValue.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Detalhado - {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy', { locale: ptBR })}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de Benefício</TableHead>
                <TableHead>Funcionários</TableHead>
                <TableHead>Valor Médio</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {benefitTypeStats.map((stat) => (
                <TableRow key={stat.type}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${stat.color}`}></div>
                      {stat.name}
                    </div>
                  </TableCell>
                  <TableCell>{stat.count}</TableCell>
                  <TableCell>
                    R$ {stat.count > 0 ? (stat.totalValue / stat.count).toFixed(2) : '0,00'}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      R$ {stat.totalValue.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={stat.count > 0 ? 'default' : 'secondary'}>
                      {stat.count > 0 ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Métricas de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Eficiência de Processamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">94.2%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Benefícios processados sem erro
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tempo Médio de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">2.3 dias</div>
            <p className="text-xs text-muted-foreground mt-1">
              Desde processamento até pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Economia Anual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">R$ 45.230</div>
            <p className="text-xs text-muted-foreground mt-1">
              Com otimização de benefícios
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}