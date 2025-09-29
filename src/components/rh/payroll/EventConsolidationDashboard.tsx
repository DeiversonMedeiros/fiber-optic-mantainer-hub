import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useEventConsolidation } from '@/hooks/rh/useEventConsolidation';
import { useEmployees } from '@/hooks/rh';
import { useToast } from '@/hooks/use-toast';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  Users, 
  AlertTriangle,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';

interface EventConsolidationDashboardProps {
  companyId: string;
}

export function EventConsolidationDashboard({ companyId }: EventConsolidationDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [consolidationResult, setConsolidationResult] = useState<any>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const { employees, isLoading: employeesLoading } = useEmployees(companyId);
  const { 
    loading, 
    error, 
    consolidateEvents, 
    getEvents, 
    approveEvents, 
    rejectEvents 
  } = useEventConsolidation();

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
    }
  }, [selectedPeriod, selectedEmployee, selectedEventType, selectedStatus]);

  const loadEvents = async () => {
    const eventsData = await getEvents(
      selectedPeriod,
      selectedEmployee === 'all' ? undefined : selectedEmployee || undefined,
      selectedEventType === 'all' ? undefined : selectedEventType || undefined,
      selectedStatus === 'all' ? undefined : selectedStatus || undefined
    );
    setEvents(eventsData);
  };

  const handleConsolidate = async () => {
    if (!selectedPeriod) {
      toast({
        title: "Erro",
        description: "Selecione um período para consolidar",
        variant: "destructive"
      });
      return;
    }

    const result = await consolidateEvents(
      selectedPeriod,
      selectedEmployee && selectedEmployee !== 'all' ? [selectedEmployee] : undefined
    );
    
    if (result) {
      setConsolidationResult(result);
      await loadEvents(); // Recarregar eventos após consolidação
    }
  };

  const handleApproveSelected = async () => {
    if (selectedEvents.length === 0) return;

    const success = await approveEvents(selectedEvents, user?.id || '');
    if (success) {
      setSelectedEvents([]);
      await loadEvents();
    }
  };

  const handleRejectSelected = async () => {
    if (selectedEvents.length === 0) return;

    const reason = prompt('Motivo da rejeição:');
    if (!reason) return;

    const success = await rejectEvents(selectedEvents, user?.id || '', reason);
    if (success) {
      setSelectedEvents([]);
      await loadEvents();
    }
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

  const getEventTypeLabel = (type: string) => {
    const labels = {
      'time_record': 'Controle de Ponto',
      'benefit': 'Benefício',
      'absence': 'Ausência',
      'allowance': 'Adicional',
      'overtime': 'Hora Extra',
      'manual': 'Manual',
      'calculation': 'Cálculo'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': 'secondary',
      'approved': 'default',
      'rejected': 'destructive',
      'processed': 'outline'
    } as const;

    const icons = {
      'pending': <Clock className="h-3 w-3" />,
      'approved': <CheckCircle className="h-3 w-3" />,
      'rejected': <XCircle className="h-3 w-3" />,
      'processed': <CheckCircle className="h-3 w-3" />
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {icons[status as keyof typeof icons]}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  const eventTypes = [
    { value: 'time_record', label: 'Controle de Ponto' },
    { value: 'benefit', label: 'Benefício' },
    { value: 'absence', label: 'Ausência' },
    { value: 'allowance', label: 'Adicional' },
    { value: 'overtime', label: 'Hora Extra' },
    { value: 'manual', label: 'Manual' },
    { value: 'calculation', label: 'Cálculo' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pendente' },
    { value: 'approved', label: 'Aprovado' },
    { value: 'rejected', label: 'Rejeitado' },
    { value: 'processed', label: 'Processado' }
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Consolidação de Eventos</h2>
          <p className="text-muted-foreground">
            Consolide e gerencie eventos que impactam a folha de pagamento
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleConsolidate} disabled={loading || !selectedPeriod}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Consolidar
          </Button>
        </div>
      </div>

      {/* Resultado da Consolidação */}
      {consolidationResult && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Consolidação Concluída:</strong> {consolidationResult.processed_events} eventos processados, 
            {consolidationResult.error_events} erros encontrados
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
                  onClick={handleApproveSelected}
                  disabled={loading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={handleRejectSelected}
                  disabled={loading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Eventos */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos Consolidados</CardTitle>
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
                <div className="col-span-2">Tipo</div>
                <div className="col-span-2">Valor</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Data</div>
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
                      {getEventTypeLabel(event.event_type)}
                    </Badge>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="font-medium">
                      {formatCurrency(event.calculated_value)}
                    </div>
                    {event.base_value > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Base: {formatCurrency(event.base_value)}
                      </div>
                    )}
                  </div>
                  
                  <div className="col-span-2">
                    {getStatusBadge(event.status)}
                  </div>
                  
                  <div className="col-span-2">
                    <div className="text-sm">
                      {new Date(event.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleTimeString('pt-BR')}
                    </div>
                  </div>
                  
                  <div className="col-span-1">
                    <div className="flex gap-1">
                      {event.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => approveEvents([event.id], user?.id || '')}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectEvents([event.id], user?.id || '', 'Rejeitado individualmente')}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
