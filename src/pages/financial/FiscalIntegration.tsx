import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  DollarSign,
  Building,
  FileText,
  AlertTriangle,
  Activity,
  CreditCard,
  Banknote,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Upload,
  File,
  Zap,
  Globe,
  Shield,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useSefazIntegration } from '@/hooks/financial';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function FiscalIntegration() {
  const [isCreateIntegrationModalOpen, setIsCreateIntegrationModalOpen] = useState(false);
  const [isEditIntegrationModalOpen, setIsEditIntegrationModalOpen] = useState(false);
  const [isUploadXmlModalOpen, setIsUploadXmlModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    uf: '',
    status: '',
    data_inicio: '',
    data_fim: '',
    tipo: '',
  });

  const {
    integrations,
    status,
    invoices,
    loading,
    error,
    fetchIntegrations,
    fetchStatus,
    fetchInvoices,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testConnection,
    uploadXml,
    consultNfe,
    cancelNfe,
    inutilizeNfe,
    downloadXml,
    generateDanfe,
    getUfStatus,
    getActiveIntegrations
  } = useSefazIntegration();

  const [integrationFormData, setIntegrationFormData] = useState({
    uf: '',
    ambiente: 'homologacao' as const,
    webservice_url: '',
    certificado_a1: '',
    senha_certificado: '',
    is_active: true,
  });

  const [inutilizeFormData, setInutilizeFormData] = useState({
    serie: '',
    numero_inicial: '',
    numero_final: '',
    justificativa: '',
    uf: '',
  });

  const [cancelFormData, setCancelFormData] = useState({
    invoice_id: '',
    justificativa: '',
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    await fetchIntegrations();
    await fetchStatus();
    await fetchInvoices(filters);
  };

  const handleCreateIntegration = async () => {
    try {
      await createIntegration(integrationFormData);
      setIsCreateIntegrationModalOpen(false);
      resetIntegrationForm();
      loadData();
    } catch (error) {
      console.error('Erro ao criar integração SEFAZ:', error);
    }
  };

  const handleUpdateIntegration = async () => {
    if (!selectedIntegration) return;

    try {
      await updateIntegration(selectedIntegration.id, integrationFormData);
      setIsEditIntegrationModalOpen(false);
      setSelectedIntegration(null);
      resetIntegrationForm();
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar integração SEFAZ:', error);
    }
  };

  const handleDeleteIntegration = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta integração SEFAZ?')) {
      try {
        await deleteIntegration(id);
        loadData();
      } catch (error) {
        console.error('Erro ao excluir integração SEFAZ:', error);
      }
    }
  };

  const handleTestConnection = async (id: string) => {
    try {
      await testConnection(id);
      loadData();
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
    }
  };

  const handleUploadXml = async (file: File) => {
    try {
      await uploadXml(file, filters.uf || 'SP');
      setIsUploadXmlModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao fazer upload do XML:', error);
    }
  };

  const handleCancelNfe = async () => {
    try {
      await cancelNfe(cancelFormData.invoice_id, cancelFormData.justificativa);
      resetCancelForm();
      loadData();
    } catch (error) {
      console.error('Erro ao cancelar NF-e:', error);
    }
  };

  const handleInutilizeNfe = async () => {
    try {
      await inutilizeNfe(
        inutilizeFormData.serie,
        parseInt(inutilizeFormData.numero_inicial),
        parseInt(inutilizeFormData.numero_final),
        inutilizeFormData.justificativa,
        inutilizeFormData.uf
      );
      resetInutilizeForm();
      loadData();
    } catch (error) {
      console.error('Erro ao inutilizar NF-e:', error);
    }
  };

  const handleEditIntegration = (integration: any) => {
    setSelectedIntegration(integration);
    setIntegrationFormData({
      uf: integration.uf || '',
      ambiente: integration.ambiente || 'homologacao',
      webservice_url: integration.webservice_url || '',
      certificado_a1: integration.certificado_a1 || '',
      senha_certificado: integration.senha_certificado || '',
      is_active: integration.is_active,
    });
    setIsEditIntegrationModalOpen(true);
  };

  const resetIntegrationForm = () => {
    setIntegrationFormData({
      uf: '',
      ambiente: 'homologacao',
      webservice_url: '',
      certificado_a1: '',
      senha_certificado: '',
      is_active: true,
    });
  };

  const resetCancelForm = () => {
    setCancelFormData({
      invoice_id: '',
      justificativa: '',
    });
  };

  const resetInutilizeForm = () => {
    setInutilizeFormData({
      serie: '',
      numero_inicial: '',
      numero_final: '',
      justificativa: '',
      uf: '',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'autorizada':
        return 'bg-green-100 text-green-800';
      case 'rejeitada':
        return 'bg-red-100 text-red-800';
      case 'cancelada':
        return 'bg-gray-100 text-gray-800';
      case 'inutilizada':
        return 'bg-orange-100 text-orange-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUfStatusColor = (ufStatus: string) => {
    switch (ufStatus) {
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'offline':
        return 'bg-red-100 text-red-800';
      case 'manutencao':
        return 'bg-yellow-100 text-yellow-800';
      case 'erro':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.numero_nf.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeIntegrations = getActiveIntegrations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integração Fiscal</h1>
          <p className="text-muted-foreground">
            Gerencie integrações SEFAZ e notas fiscais
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Dialog open={isUploadXmlModalOpen} onOpenChange={setIsUploadXmlModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload XML
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload de XML</DialogTitle>
                <DialogDescription>
                  Faça upload de arquivos XML de notas fiscais
                </DialogDescription>
              </DialogHeader>
              <XmlUploadForm onSubmit={handleUploadXml} onCancel={() => setIsUploadXmlModalOpen(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateIntegrationModalOpen} onOpenChange={setIsCreateIntegrationModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Integração
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Integração SEFAZ</DialogTitle>
                <DialogDescription>
                  Configure uma nova integração com a SEFAZ
                </DialogDescription>
              </DialogHeader>
              <IntegrationForm
                formData={integrationFormData}
                setFormData={setIntegrationFormData}
                onSubmit={handleCreateIntegration}
                onCancel={() => setIsCreateIntegrationModalOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status SEFAZ por UF */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Status SEFAZ por UF
          </CardTitle>
          <CardDescription>
            Monitoramento da disponibilidade dos serviços SEFAZ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {status.map((ufStatus) => (
              <div key={ufStatus.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{ufStatus.uf}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(ufStatus.ultima_verificacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
                <Badge className={getUfStatusColor(ufStatus.status)}>
                  {ufStatus.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Notas Fiscais</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
          <TabsTrigger value="tools">Ferramentas</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Número da NF..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uf">UF</Label>
                  <Select
                    value={filters.uf}
                    onValueChange={(value) => setFilters({ ...filters, uf: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as UFs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as UFs</SelectItem>
                      <SelectItem value="SP">São Paulo</SelectItem>
                      <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                      <SelectItem value="MG">Minas Gerais</SelectItem>
                      <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os status</SelectItem>
                      <SelectItem value="autorizada">Autorizada</SelectItem>
                      <SelectItem value="rejeitada">Rejeitada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                      <SelectItem value="inutilizada">Inutilizada</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_inicio">Data Início</Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    value={filters.data_inicio}
                    onChange={(e) => setFilters({ ...filters, data_inicio: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_fim">Data Fim</Label>
                  <Input
                    id="data_fim"
                    type="date"
                    value={filters.data_fim}
                    onChange={(e) => setFilters({ ...filters, data_fim: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Notas Fiscais */}
          <Card>
            <CardHeader>
              <CardTitle>Notas Fiscais</CardTitle>
              <CardDescription>
                {filteredInvoices.length} nota(s) encontrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Série</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data Emissão</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.numero_nf}</TableCell>
                      <TableCell>{invoice.serie || '-'}</TableCell>
                      <TableCell className="capitalize">{invoice.tipo}</TableCell>
                      <TableCell>
                        {invoice.data_emissao ? (
                          format(new Date(invoice.data_emissao), 'dd/MM/yyyy', { locale: ptBR })
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {invoice.valor_total ? formatCurrency(invoice.valor_total) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadXml(invoice.id)}
                          >
                            <File className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => generateDanfe(invoice.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {invoice.status === 'autorizada' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCancelFormData({ ...cancelFormData, invoice_id: invoice.id })}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrações SEFAZ</CardTitle>
              <CardDescription>
                {integrations.length} integração(ões) configurada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>UF</TableHead>
                    <TableHead>Ambiente</TableHead>
                    <TableHead>Webservice URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrations.map((integration) => (
                    <TableRow key={integration.id}>
                      <TableCell className="font-medium">{integration.uf}</TableCell>
                      <TableCell className="capitalize">{integration.ambiente}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {integration.webservice_url}
                      </TableCell>
                      <TableCell>
                        <Badge variant={integration.is_active ? "default" : "secondary"}>
                          {integration.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestConnection(integration.id)}
                          >
                            <Zap className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditIntegration(integration)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteIntegration(integration.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>Monitoramento SEFAZ</CardTitle>
              <CardDescription>
                Acompanhe o status dos serviços SEFAZ em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Implementar dashboard de monitoramento em tempo real.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cancelar NF-e</CardTitle>
                <CardDescription>
                  Cancele uma nota fiscal eletrônica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cancel_invoice_id">ID da Nota Fiscal</Label>
                  <Input
                    id="cancel_invoice_id"
                    value={cancelFormData.invoice_id}
                    onChange={(e) => setCancelFormData({ ...cancelFormData, invoice_id: e.target.value })}
                    placeholder="ID da nota fiscal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cancel_justificativa">Justificativa</Label>
                  <Textarea
                    id="cancel_justificativa"
                    value={cancelFormData.justificativa}
                    onChange={(e) => setCancelFormData({ ...cancelFormData, justificativa: e.target.value })}
                    placeholder="Justificativa para cancelamento"
                  />
                </div>
                <Button onClick={handleCancelNfe} className="w-full">
                  Cancelar NF-e
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inutilizar NF-e</CardTitle>
                <CardDescription>
                  Inutilize uma sequência de números de NF-e
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="inutilize_serie">Série</Label>
                    <Input
                      id="inutilize_serie"
                      value={inutilizeFormData.serie}
                      onChange={(e) => setInutilizeFormData({ ...inutilizeFormData, serie: e.target.value })}
                      placeholder="Série"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inutilize_uf">UF</Label>
                    <Select
                      value={inutilizeFormData.uf}
                      onValueChange={(value) => setInutilizeFormData({ ...inutilizeFormData, uf: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a UF" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SP">São Paulo</SelectItem>
                        <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                        <SelectItem value="MG">Minas Gerais</SelectItem>
                        <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="inutilize_numero_inicial">Número Inicial</Label>
                    <Input
                      id="inutilize_numero_inicial"
                      type="number"
                      value={inutilizeFormData.numero_inicial}
                      onChange={(e) => setInutilizeFormData({ ...inutilizeFormData, numero_inicial: e.target.value })}
                      placeholder="Número inicial"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inutilize_numero_final">Número Final</Label>
                    <Input
                      id="inutilize_numero_final"
                      type="number"
                      value={inutilizeFormData.numero_final}
                      onChange={(e) => setInutilizeFormData({ ...inutilizeFormData, numero_final: e.target.value })}
                      placeholder="Número final"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inutilize_justificativa">Justificativa</Label>
                  <Textarea
                    id="inutilize_justificativa"
                    value={inutilizeFormData.justificativa}
                    onChange={(e) => setInutilizeFormData({ ...inutilizeFormData, justificativa: e.target.value })}
                    placeholder="Justificativa para inutilização"
                  />
                </div>
                <Button onClick={handleInutilizeNfe} className="w-full">
                  Inutilizar NF-e
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Edição */}
      <Dialog open={isEditIntegrationModalOpen} onOpenChange={setIsEditIntegrationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Integração SEFAZ</DialogTitle>
            <DialogDescription>
              Atualize os dados da integração SEFAZ
            </DialogDescription>
          </DialogHeader>
          <IntegrationForm
            formData={integrationFormData}
            setFormData={setIntegrationFormData}
            onSubmit={handleUpdateIntegration}
            onCancel={() => setIsEditIntegrationModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface IntegrationFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function IntegrationForm({ formData, setFormData, onSubmit, onCancel }: IntegrationFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="uf">UF *</Label>
          <Select
            value={formData.uf}
            onValueChange={(value) => setFormData({ ...formData, uf: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a UF" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SP">São Paulo</SelectItem>
              <SelectItem value="RJ">Rio de Janeiro</SelectItem>
              <SelectItem value="MG">Minas Gerais</SelectItem>
              <SelectItem value="RS">Rio Grande do Sul</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ambiente">Ambiente *</Label>
          <Select
            value={formData.ambiente}
            onValueChange={(value) => setFormData({ ...formData, ambiente: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="homologacao">Homologação</SelectItem>
              <SelectItem value="producao">Produção</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="webservice_url">URL do Webservice *</Label>
          <Input
            id="webservice_url"
            value={formData.webservice_url}
            onChange={(e) => setFormData({ ...formData, webservice_url: e.target.value })}
            placeholder="https://nfe.sefaz.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="certificado_a1">Certificado A1</Label>
          <Input
            id="certificado_a1"
            type="file"
            accept=".pfx,.p12"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // Aqui você implementaria o upload do certificado
                setFormData({ ...formData, certificado_a1: file.name });
              }
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="senha_certificado">Senha do Certificado</Label>
          <Input
            id="senha_certificado"
            type="password"
            value={formData.senha_certificado}
            onChange={(e) => setFormData({ ...formData, senha_certificado: e.target.value })}
            placeholder="Senha do certificado"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="is_active">Status</Label>
          <Select
            value={formData.is_active.toString()}
            onValueChange={(value) => setFormData({ ...formData, is_active: value === 'true' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Ativa</SelectItem>
              <SelectItem value="false">Inativa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onSubmit}>
          Salvar
        </Button>
      </div>
    </div>
  );
}

interface XmlUploadFormProps {
  onSubmit: (file: File) => void;
  onCancel: () => void;
}

function XmlUploadForm({ onSubmit, onCancel }: XmlUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = () => {
    if (file) {
      onSubmit(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="xml_file">Arquivo XML</Label>
        <Input
          id="xml_file"
          type="file"
          accept=".xml"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <p className="text-sm text-muted-foreground">
          Selecione um arquivo XML de nota fiscal eletrônica
        </p>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={!file}>
          Upload
        </Button>
      </div>
    </div>
  );
}
