import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFinancialIntegration } from '@/hooks/rh/useFinancialIntegration';
import { 
  DollarSign, 
  FileText, 
  CreditCard, 
  Upload, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Plus,
  Settings,
  BarChart3
} from 'lucide-react';

interface FinancialIntegrationDashboardProps {
  payrollCalculationId?: string;
}

export const FinancialIntegrationDashboard: React.FC<FinancialIntegrationDashboardProps> = ({
  payrollCalculationId
}) => {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    period: 'all'
  });

  const {
    financialConfig,
    generatedTitles,
    taxGuides,
    paymentBatches,
    cnabFiles,
    accountingProvisions,
    isLoading,
    error,
    isGenerating,
    generateTitles,
    generateTaxGuides,
    createPaymentBatch,
    generateCNABFile,
    generateAccountingProvisions,
    generateAllFinancialDocuments,
    createCompletePaymentBatch
  } = useFinancialIntegration();

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleGenerateAll = async () => {
    if (!payrollCalculationId) {
      toast({
        title: 'Erro',
        description: 'ID da folha de pagamento não encontrado',
        variant: 'destructive'
      });
      return;
    }

    try {
      await generateAllFinancialDocuments(payrollCalculationId);
      toast({
        title: 'Sucesso',
        description: 'Todos os documentos financeiros foram gerados com sucesso!'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao gerar documentos financeiros',
        variant: 'destructive'
      });
    }
  };

  const handleCreatePaymentBatch = async () => {
    if (!payrollCalculationId) {
      toast({
        title: 'Erro',
        description: 'ID da folha de pagamento não encontrado',
        variant: 'destructive'
      });
      return;
    }

    try {
      await createCompletePaymentBatch(payrollCalculationId);
      toast({
        title: 'Sucesso',
        description: 'Lote de pagamento criado e arquivo CNAB gerado!'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar lote de pagamento',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadCNAB = (fileId: string, fileName: string) => {
    // Implementar download do arquivo CNAB
    toast({
      title: 'Download',
      description: `Iniciando download do arquivo ${fileName}`
    });
  };

  // =====================================================
  // RENDER HELPERS
  // =====================================================

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      generated: { color: 'bg-blue-100 text-blue-800', icon: Upload },
      processed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      error: { color: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      overdue: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // =====================================================
  // RENDER
  // =====================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando integração financeira...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar dados</h3>
        <p className="text-gray-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integração Financeira</h2>
          <p className="text-gray-600">Gerencie títulos, guias e arquivos bancários da folha de pagamento</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateAll}
            disabled={isGenerating || !payrollCalculationId}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Gerar Todos os Documentos
          </Button>
          <Button
            onClick={handleCreatePaymentBatch}
            disabled={isGenerating || !payrollCalculationId}
            variant="outline"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Criar Lote de Pagamento
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Títulos Gerados</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generatedTitles?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {generatedTitles?.filter(t => t.status === 'pending').length || 0} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guias de Recolhimento</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taxGuides?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {taxGuides?.filter(t => t.status === 'pending').length || 0} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lotes de Pagamento</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentBatches?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {paymentBatches?.filter(b => b.status === 'generated').length || 0} gerados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arquivos CNAB</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cnabFiles?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {cnabFiles?.filter(f => f.status === 'processed').length || 0} processados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="titles">Títulos</TabsTrigger>
          <TabsTrigger value="guides">Guias</TabsTrigger>
          <TabsTrigger value="batches">Lotes</TabsTrigger>
          <TabsTrigger value="cnab">CNAB</TabsTrigger>
          <TabsTrigger value="provisions">Provisões</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Títulos Recentes */}
            <Card>
              <CardHeader>
                <CardTitle>Títulos Recentes</CardTitle>
                <CardDescription>Últimos títulos gerados pela folha</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {generatedTitles?.slice(0, 5).map((title) => (
                    <div key={title.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{title.title_number}</p>
                        <p className="text-sm text-gray-600">{title.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(title.amount)}</p>
                        {getStatusBadge(title.status)}
                      </div>
                    </div>
                  ))}
                  {(!generatedTitles || generatedTitles.length === 0) && (
                    <p className="text-gray-500 text-center py-4">Nenhum título encontrado</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Guias Recentes */}
            <Card>
              <CardHeader>
                <CardTitle>Guias de Recolhimento</CardTitle>
                <CardDescription>Últimas guias geradas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {taxGuides?.slice(0, 5).map((guide) => (
                    <div key={guide.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{guide.guide_number}</p>
                        <p className="text-sm text-gray-600">{guide.guide_type.toUpperCase()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(guide.total_amount)}</p>
                        {getStatusBadge(guide.status)}
                      </div>
                    </div>
                  ))}
                  {(!taxGuides || taxGuides.length === 0) && (
                    <p className="text-gray-500 text-center py-4">Nenhuma guia encontrada</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Títulos Tab */}
        <TabsContent value="titles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Títulos Gerados</CardTitle>
              <CardDescription>Gerencie os títulos a pagar da folha</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedTitles?.map((title) => (
                    <TableRow key={title.id}>
                      <TableCell className="font-medium">{title.title_number}</TableCell>
                      <TableCell>{title.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{title.title_type}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(title.amount)}</TableCell>
                      <TableCell>{formatDate(title.due_date)}</TableCell>
                      <TableCell>{getStatusBadge(title.status)}</TableCell>
                    </TableRow>
                  ))}
                  {(!generatedTitles || generatedTitles.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhum título encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guias Tab */}
        <TabsContent value="guides" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guias de Recolhimento</CardTitle>
              <CardDescription>Gerencie as guias de impostos e contribuições</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Valor Base</TableHead>
                    <TableHead>Valor Imposto</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxGuides?.map((guide) => (
                    <TableRow key={guide.id}>
                      <TableCell className="font-medium">{guide.guide_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{guide.guide_type.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>{guide.reference_period}</TableCell>
                      <TableCell>{formatCurrency(guide.base_amount)}</TableCell>
                      <TableCell>{formatCurrency(guide.tax_amount)}</TableCell>
                      <TableCell>{formatDate(guide.due_date)}</TableCell>
                      <TableCell>{getStatusBadge(guide.status)}</TableCell>
                    </TableRow>
                  ))}
                  {(!taxGuides || taxGuides.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Nenhuma guia encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lotes Tab */}
        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lotes de Pagamento</CardTitle>
              <CardDescription>Gerencie os lotes de pagamento bancário</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número do Lote</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Total de Títulos</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentBatches?.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.batch_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{batch.batch_type}</Badge>
                      </TableCell>
                      <TableCell>{batch.description}</TableCell>
                      <TableCell>{batch.total_titles}</TableCell>
                      <TableCell>{formatCurrency(batch.total_amount)}</TableCell>
                      <TableCell>{getStatusBadge(batch.status)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadCNAB(batch.id, batch.cnab_file_name || '')}
                          disabled={batch.status !== 'generated'}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          CNAB
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!paymentBatches || paymentBatches.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Nenhum lote encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CNAB Tab */}
        <TabsContent value="cnab" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Arquivos CNAB</CardTitle>
              <CardDescription>Gerencie os arquivos de remessa e retorno bancário</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Arquivo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Banco</TableHead>
                    <TableHead>Registros</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cnabFiles?.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="font-medium">{file.file_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{file.file_type}</Badge>
                      </TableCell>
                      <TableCell>{file.bank_name}</TableCell>
                      <TableCell>{file.total_records || 0}</TableCell>
                      <TableCell>{formatCurrency(file.total_amount || 0)}</TableCell>
                      <TableCell>{getStatusBadge(file.status)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadCNAB(file.id, file.file_name)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!cnabFiles || cnabFiles.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Nenhum arquivo CNAB encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Provisões Tab */}
        <TabsContent value="provisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provisões Contábeis</CardTitle>
              <CardDescription>Gerencie as provisões para encargos patronais</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Valor Base</TableHead>
                    <TableHead>Taxa</TableHead>
                    <TableHead>Valor Provisão</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountingProvisions?.map((provision) => (
                    <TableRow key={provision.id}>
                      <TableCell>
                        <Badge variant="outline">{provision.provision_type}</Badge>
                      </TableCell>
                      <TableCell>{provision.description}</TableCell>
                      <TableCell>{provision.reference_period}</TableCell>
                      <TableCell>{formatCurrency(provision.base_amount)}</TableCell>
                      <TableCell>{(provision.rate * 100).toFixed(2)}%</TableCell>
                      <TableCell>{formatCurrency(provision.provision_amount)}</TableCell>
                      <TableCell>{getStatusBadge(provision.status)}</TableCell>
                    </TableRow>
                  ))}
                  {(!accountingProvisions || accountingProvisions.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Nenhuma provisão encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

