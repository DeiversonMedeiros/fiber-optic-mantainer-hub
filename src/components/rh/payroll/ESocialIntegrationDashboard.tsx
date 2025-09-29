import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useESocialIntegration } from '@/hooks/rh/useESocialIntegration';
import { useEmployees } from '@/hooks/rh';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Filter,
  Download,
  Eye,
  RefreshCw,
  Send,
  FileText
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';

interface ESocialIntegrationDashboardProps {
  companyId: string;
}

export function ESocialIntegrationDashboard({ companyId }: ESocialIntegrationDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [integrationResult, setIntegrationResult] = useState<any>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const { employees, isLoading: employeesLoading } = useEmployees(companyId);
  const { 
    loading, 
    error, 
    processESocialEvents, 
    getESocialEvents, 
    getESocialBatches,
    getESocialEventById,
    retryESocialEvent,
    cancelESocialEvent
  } = useESocialIntegration();

  // Gerar opções de período (últimos 12 meses)
  const generatePeriodOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const period = date.toISOString().slice(0, 7); // YYYY-MM
      const label = date.toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'long' 
      });
      options.push({ value: period, label });
    }
    
    return options;
  };

  // Carregar eventos quando o período mudar
  useEffect(() => {
    if (selectedPeriod) {
      loadEvents();
      loadBatches();
    }
  }, [selectedPeriod, selectedEmployee, selectedEventType, selectedStatus]);

  const loadEvents = async () => {
    const eventsData = await getESocialEvents(
      selectedPeriod,
      selectedEmployee === 'all' ? undefined : selectedEmployee,
      selectedEventType === 'all' ? undefined : selectedEventType,
      selectedStatus === 'all' ? undefined : selectedStatus
    );
    setEvents(eventsData);
  };

  const loadBatches = async () => {
    const batchesData = await getESocialBatches(
      selectedPeriod,
      selectedStatus === 'all' ? undefined : selectedStatus
    );
    setBatches(batchesData);
  };

  const handleProcessESocial = async () => {
    if (!selectedPeriod) {
      toast({
        title: "Erro",
        description: "Selecione um período para processar",
        variant: "destructive"
      });
      return;
    }

    const result = await processESocialEvents(
      selectedPeriod,
      selectedEmployee === 'all' ? undefined : [selectedEmployee]
    );
    
    if (result) {
      setIntegrationResult(result);
      await loadEvents();
      await loadBatches();
    }
  };

  const handleRetrySelected = async () => {
    if (selectedEvents.length === 0) return;

    for (const eventId of selectedEvents) {
      await retryESocialEvent(eventId);
    }
    
    setSelectedEvents([]);
    await loadEvents();
  };

  const handleCancelSelected = async () => {
    if (selectedEvents.length === 0) return;

    const reason = prompt('Motivo do cancelamento:');
    if (!reason) return;

    for (const eventId of selectedEvents) {
      await cancelESocialEvent(eventId, reason);
    }
    
    setSelectedEvents([]);
    await loadEvents();
  };

  const handleSelectEvent = (eventId: string, checked: boolean) => {
    if (checked) {
      setSelectedEvents([...selectedEvents, eventId]);
    } else {
      setSelectedEvents(selectedEvents.filter(id => id !== eventId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEvents(events.map(event => event.id));
    } else {
      setSelectedEvents([]);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': 'secondary',
      'sent': 'default',
      'accepted': 'outline',
      'rejected': 'destructive',
      'error': 'destructive'
    } as const;

    const icons = {
      'pending': <Clock className="h-3 w-3" />,
      'sent': <Send className="h-3 w-3" />,
      'accepted': <CheckCircle className="h-3 w-3" />,
      'rejected': <XCircle className="h-3 w-3" />,
      'error': <AlertTriangle className="h-3 w-3" />
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {icons[status as keyof typeof icons]}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  const eventTypes = [
    { value: 'S-1000', label: 'S-1000 - Informações do Empregador' },
    { value: 'S-1005', label: 'S-1005 - Tabela de Estabelecimentos' },
    { value: 'S-1010', label: 'S-1010 - Tabela de Rubricas' },
    { value: 'S-1020', label: 'S-1020 - Tabela de Lotações' },
    { value: 'S-1030', label: 'S-1030 - Tabela de Cargos' },
    { value: 'S-1200', label: 'S-1200 - Remuneração RGPS' },
    { value: 'S-1202', label: 'S-1202 - Remuneração RPPS' },
    { value: 'S-1207', label: 'S-1207 - Benefícios Previdenciários' },
    { value: 'S-1210', label: 'S-1210 - Pagamentos de Rendimentos' },
    { value: 'S-1250', label: 'S-1250 - Aquisição de Produção Rural' },
    { value: 'S-1260', label: 'S-1260 - Comercialização de Produção Rural' },
    { value: 'S-1270', label: 'S-1270 - Contratação de Trabalhadores Avulsos' },
    { value: 'S-1280', label: 'S-1280 - Contribuições Consolidadas' },
    { value: 'S-1295', label: 'S-1295 - Totalização FGTS' },
    { value: 'S-1298', label: 'S-1298 - Reabertura de Eventos' },
    { value: 'S-1299', label: 'S-1299 - Fechamento de Eventos' },
    { value: 'S-1300', label: 'S-1300 - Contribuição Sindical' },
    { value: 'S-2190', label: 'S-2190 - Admissão Preliminar' },
    { value: 'S-2200', label: 'S-2200 - Cadastramento Inicial' },
    { value: 'S-2205', label: 'S-2205 - Alteração de Dados' },
    { value: 'S-2206', label: 'S-2206 - Alteração de Contrato' },
    { value: 'S-2210', label: 'S-2210 - Comunicação de Acidente' },
    { value: 'S-2220', label: 'S-2220 - Monitoramento da Saúde' },
    { value: 'S-2230', label: 'S-2230 - Afastamento Temporário' },
    { value: 'S-2240', label: 'S-2240 - Condições Ambientais' },
    { value: 'S-2241', label: 'S-2241 - Insalubridade/Periculosidade' },
    { value: 'S-2250', label: 'S-2250 - Aviso Prévio' },
    { value: 'S-2260', label: 'S-2260 - Convocação Tempo Parcial' },
    { value: 'S-2298', label: 'S-2298 - Reintegração' },
    { value: 'S-2299', label: 'S-2299 - Desligamento' },
    { value: 'S-2300', label: 'S-2300 - Trabalhador Sem Vínculo - Início' },
    { value: 'S-2306', label: 'S-2306 - Trabalhador Sem Vínculo - Término' },
    { value: 'S-2399', label: 'S-2399 - Alteração Contratual' },
    { value: 'S-2400', label: 'S-2400 - Benefícios Previdenciários RPPS' },
    { value: 'S-3000', label: 'S-3000 - Exclusão de Eventos' },
    { value: 'S-3500', label: 'S-3500 - Processos Judiciais' },
    { value: 'S-5001', label: 'S-5001 - Contribuições Sociais' },
    { value: 'S-5002', label: 'S-5002 - Contribuições PIS/PASEP' },
    { value: 'S-5003', label: 'S-5003 - Contribuições FGTS' },
    { value: 'S-5011', label: 'S-5011 - Contribuições PIS/PASEP' },
    { value: 'S-5012', label: 'S-5012 - Contribuições FGTS' },
    { value: 'S-5013', label: 'S-5013 - Contribuições FGTS' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pendente' },
    { value: 'sent', label: 'Enviado' },
    { value: 'accepted', label: 'Aceito' },
    { value: 'rejected', label: 'Rejeitado' },
    { value: 'error', label: 'Erro' }
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Integração eSocial</h2>
          <p className="text-muted-foreground">
            Processe e envie eventos para o eSocial brasileiro
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleProcessESocial} disabled={loading || !selectedPeriod}>
            <Upload className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Processar eSocial
          </Button>
        </div>
      </div>

      {/* Resultado da Integração */}
      {integrationResult && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Integração Concluída:</strong> {integrationResult.events_processed} eventos processados, 
            {integrationResult.events_accepted} aceitos, {integrationResult.events_rejected} rejeitados
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period">Período *</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um período" />
                </SelectTrigger>
                <SelectContent>
                  {generatePeriodOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee">Funcionário</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os funcionários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os funcionários</SelectItem>
                  {employees?.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.nome} {employee.matricula && `(${employee.matricula})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventType">Tipo de Evento</Label>
              <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {eventTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações em Lote */}
      {selectedEvents.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedEvents.length} evento(s) selecionado(s)
              </span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleRetrySelected}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reenviar
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={handleCancelSelected}
                  disabled={loading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs para Eventos e Lotes */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Eventos eSocial</TabsTrigger>
          <TabsTrigger value="batches">Lotes de Envio</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Eventos eSocial</CardTitle>
              <CardDescription>
                {events.length} evento(s) encontrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2">Carregando eventos...</span>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum evento encontrado para o período selecionado
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Cabeçalho da tabela */}
                  <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 rounded-lg font-medium text-sm">
                    <div className="col-span-1">
                      <Checkbox
                        checked={selectedEvents.length === events.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </div>
                    <div className="col-span-2">Funcionário</div>
                    <div className="col-span-2">Tipo de Evento</div>
                    <div className="col-span-2">Período</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Data Envio</div>
                    <div className="col-span-1">Ações</div>
                  </div>

                  {/* Eventos */}
                  {events.map((event) => (
                    <div key={event.id} className="grid grid-cols-12 gap-4 p-4 border rounded-lg">
                      <div className="col-span-1 flex items-center">
                        <Checkbox
                          checked={selectedEvents.includes(event.id)}
                          onCheckedChange={(checked) => handleSelectEvent(event.id, checked as boolean)}
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <div className="font-medium">{event.employee?.nome}</div>
                        <div className="text-sm text-muted-foreground">
                          {event.employee?.matricula}
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        <Badge variant="outline">
                          {event.event_type}
                        </Badge>
                      </div>
                      
                      <div className="col-span-2">
                        <div className="font-medium">
                          {new Date(event.period + '-01').toLocaleDateString('pt-BR', { 
                            year: 'numeric', 
                            month: 'long' 
                          })}
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        {getStatusBadge(event.status)}
                      </div>
                      
                      <div className="col-span-2">
                        {event.sent_at ? (
                          <div className="text-sm">
                            {new Date(event.sent_at).toLocaleDateString('pt-BR')}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Não enviado
                          </div>
                        )}
                      </div>
                      
                      <div className="col-span-1">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => getESocialEventById(event.id)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {event.status === 'rejected' || event.status === 'error' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retryESocialEvent(event.id)}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches">
          <Card>
            <CardHeader>
              <CardTitle>Lotes de Envio</CardTitle>
              <CardDescription>
                {batches.length} lote(s) encontrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2">Carregando lotes...</span>
                </div>
              ) : batches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum lote encontrado para o período selecionado
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Cabeçalho da tabela */}
                  <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 rounded-lg font-medium text-sm">
                    <div className="col-span-2">Número do Lote</div>
                    <div className="col-span-2">Período</div>
                    <div className="col-span-2">Total de Eventos</div>
                    <div className="col-span-2">Enviados</div>
                    <div className="col-span-2">Aceitos</div>
                    <div className="col-span-2">Status</div>
                  </div>

                  {/* Lotes */}
                  {batches.map((batch) => (
                    <div key={batch.id} className="grid grid-cols-12 gap-4 p-4 border rounded-lg">
                      <div className="col-span-2">
                        <div className="font-medium">{batch.batch_number}</div>
                      </div>
                      
                      <div className="col-span-2">
                        <div className="font-medium">
                          {new Date(batch.period + '-01').toLocaleDateString('pt-BR', { 
                            year: 'numeric', 
                            month: 'long' 
                          })}
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        <div className="font-medium">{batch.total_events}</div>
                      </div>
                      
                      <div className="col-span-2">
                        <div className="font-medium text-blue-600">{batch.sent_events}</div>
                      </div>
                      
                      <div className="col-span-2">
                        <div className="font-medium text-green-600">{batch.accepted_events}</div>
                      </div>
                      
                      <div className="col-span-2">
                        {getStatusBadge(batch.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
