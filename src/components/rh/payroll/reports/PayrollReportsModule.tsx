import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Download, 
  FileText, 
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Filter,
  Search,
  Eye,
  Printer,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'payroll' | 'taxes' | 'benefits' | 'overtime' | 'vacation' | 'thirteenth';
  format: 'pdf' | 'excel' | 'csv' | 'xml';
  lastGenerated?: Date;
  status: 'available' | 'generating' | 'error';
}

interface ReportData {
  id: string;
  templateId: string;
  name: string;
  generatedAt: Date;
  format: string;
  size: string;
  status: 'ready' | 'generating' | 'error';
  downloadUrl?: string;
}

interface PayrollReportsModuleProps {
  companyId: string;
}

export function PayrollReportsModule({ companyId }: PayrollReportsModuleProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState<ReportData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Templates de relatórios disponíveis
  const reportTemplates: ReportTemplate[] = [
    {
      id: 'payroll-summary',
      name: 'Resumo da Folha de Pagamento',
      description: 'Relatório consolidado com totais de salários, descontos e benefícios',
      category: 'payroll',
      format: 'pdf',
      status: 'available'
    },
    {
      id: 'employee-payroll',
      name: 'Folha Individual por Funcionário',
      description: 'Detalhamento completo da folha de pagamento de cada funcionário',
      category: 'payroll',
      format: 'pdf',
      status: 'available'
    },
    {
      id: 'taxes-summary',
      name: 'Resumo de Impostos',
      description: 'Consolidação de INSS, IRRF, FGTS e contribuições',
      category: 'taxes',
      format: 'excel',
      status: 'available'
    },
    {
      id: 'benefits-report',
      name: 'Relatório de Benefícios',
      description: 'Detalhamento de VR, VA, transporte e outros benefícios',
      category: 'benefits',
      format: 'excel',
      status: 'available'
    },
    {
      id: 'overtime-report',
      name: 'Relatório de Horas Extras',
      description: 'Análise de horas extras, DSR e adicional noturno',
      category: 'overtime',
      format: 'pdf',
      status: 'available'
    },
    {
      id: 'vacation-report',
      name: 'Relatório de Férias',
      description: 'Cálculos de férias proporcionais e 1/3 constitucional',
      category: 'vacation',
      format: 'pdf',
      status: 'available'
    },
    {
      id: 'thirteenth-report',
      name: 'Relatório de 13º Salário',
      description: 'Cálculos de 13º salário e parcelas',
      category: 'thirteenth',
      format: 'excel',
      status: 'available'
    },
    {
      id: 'e-social',
      name: 'Arquivo e-Social',
      description: 'Geração do arquivo XML para envio ao e-Social',
      category: 'payroll',
      format: 'xml',
      status: 'available'
    }
  ];

  // Simular relatórios já gerados
  useEffect(() => {
    const mockReports: ReportData[] = [
      {
        id: '1',
        templateId: 'payroll-summary',
        name: 'Resumo da Folha - Dezembro 2024',
        generatedAt: new Date('2024-12-15'),
        format: 'pdf',
        size: '2.3 MB',
        status: 'ready',
        downloadUrl: '#'
      },
      {
        id: '2',
        templateId: 'taxes-summary',
        name: 'Impostos - Dezembro 2024',
        generatedAt: new Date('2024-12-14'),
        format: 'excel',
        size: '1.8 MB',
        status: 'ready',
        downloadUrl: '#'
      },
      {
        id: '3',
        templateId: 'e-social',
        name: 'e-Social - Dezembro 2024',
        generatedAt: new Date('2024-12-13'),
        format: 'xml',
        size: '856 KB',
        status: 'ready',
        downloadUrl: '#'
      }
    ];
    setGeneratedReports(mockReports);
  }, []);

  const generateReport = async () => {
    if (!selectedTemplate || !selectedPeriod) {
      toast({
        title: 'Dados incompletos',
        description: 'Selecione um template e período para gerar o relatório.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const template = reportTemplates.find(t => t.id === selectedTemplate);
      if (!template) throw new Error('Template não encontrado');

      // Simular geração de relatório
      await new Promise(resolve => setTimeout(resolve, 3000));

      const newReport: ReportData = {
        id: `report-${Date.now()}`,
        templateId: selectedTemplate,
        name: `${template.name} - ${selectedPeriod}`,
        generatedAt: new Date(),
        format: selectedFormat,
        size: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`,
        status: 'ready',
        downloadUrl: '#'
      };

      setGeneratedReports(prev => [newReport, ...prev]);

      toast({
        title: 'Relatório gerado',
        description: `${template.name} foi gerado com sucesso.`,
      });

    } catch (error) {
      toast({
        title: 'Erro na geração',
        description: 'Erro ao gerar relatório. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = (report: ReportData) => {
    // Simular download
    toast({
      title: 'Download iniciado',
      description: `Baixando ${report.name}...`,
    });
  };

  const previewReport = (report: ReportData) => {
    toast({
      title: 'Visualização',
      description: `Abrindo preview de ${report.name}...`,
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      payroll: DollarSign,
      taxes: BarChart3,
      benefits: PieChart,
      overtime: Clock,
      vacation: Calendar,
      thirteenth: TrendingUp
    };
    const Icon = icons[category as keyof typeof icons] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      payroll: 'Folha de Pagamento',
      taxes: 'Impostos',
      benefits: 'Benefícios',
      overtime: 'Horas Extras',
      vacation: 'Férias',
      thirteenth: '13º Salário'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getFormatBadge = (format: string) => {
    const formatColors = {
      pdf: 'bg-red-100 text-red-800',
      excel: 'bg-green-100 text-green-800',
      csv: 'bg-blue-100 text-blue-800',
      xml: 'bg-purple-100 text-purple-800'
    };
    return formatColors[format as keyof typeof formatColors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ready: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      generating: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      error: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ready;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status === 'ready' ? 'Pronto' : status === 'generating' ? 'Gerando' : 'Erro'}
      </Badge>
    );
  };

  const filteredReports = generatedReports.filter(report =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Gerador de Relatórios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerador de Relatórios
          </CardTitle>
          <CardDescription>
            Gere relatórios personalizados da folha de pagamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="template">Template do Relatório</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {reportTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(template.category)}
                        {template.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="format">Formato</Label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="period">Período</Label>
              <Input
                id="period"
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="department">Departamento</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  <SelectItem value="rh">Recursos Humanos</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="vendas">Vendas</SelectItem>
                  <SelectItem value="producao">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={generateReport} 
              disabled={isGenerating || !selectedTemplate || !selectedPeriod}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              {isGenerating ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Relatórios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generatedReports.length}</div>
            <p className="text-xs text-muted-foreground">
              Relatórios gerados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {generatedReports.filter(r => 
                r.generatedAt.getMonth() === new Date().getMonth()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Relatórios do mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tamanho Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {generatedReports.reduce((sum, r) => 
                sum + parseFloat(r.size.replace(' MB', '')), 0
              ).toFixed(1)} MB
            </div>
            <p className="text-xs text-muted-foreground">
              Armazenamento usado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportTemplates.length}</div>
            <p className="text-xs text-muted-foreground">
              Disponíveis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Relatórios Gerados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Relatórios Gerados</CardTitle>
              <CardDescription>
                Histórico de relatórios gerados e disponíveis para download
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar relatórios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum relatório encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Relatório</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Gerado em</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => {
                  const template = reportTemplates.find(t => t.id === report.templateId);
                  return (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{report.name}</div>
                          {template && (
                            <div className="text-sm text-muted-foreground">
                              {template.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {template && (
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(template.category)}
                            <span className="text-sm">{getCategoryLabel(template.category)}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getFormatBadge(report.format)}>
                          {report.format.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {report.size}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {report.generatedAt.toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(report.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => previewReport(report)}
                            disabled={report.status !== 'ready'}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadReport(report)}
                            disabled={report.status !== 'ready'}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Templates Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Templates Disponíveis
          </CardTitle>
          <CardDescription>
            Modelos de relatórios pré-configurados para diferentes necessidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTemplates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(template.category)}
                    <CardTitle className="text-sm">{template.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {template.format.toUpperCase()}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        setSelectedFormat(template.format);
                      }}
                    >
                      Selecionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
