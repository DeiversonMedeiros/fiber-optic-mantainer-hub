import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  DollarSign,
  Car,
  Stethoscope,
  FileText,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CentralAprovacoes: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Dados mockados - serão substituídos por dados reais
  const approvalData = {
    vacations: [
      { id: 1, employee: 'João Silva', date: '2024-03-15', period: '15/07/2024 - 30/07/2024', days: 16, status: 'pending' },
      { id: 2, employee: 'Maria Santos', date: '2024-03-14', period: '01/08/2024 - 15/08/2024', days: 15, status: 'pending' },
      { id: 3, employee: 'Pedro Costa', date: '2024-03-13', period: '20/09/2024 - 05/10/2024', days: 16, status: 'approved' }
    ],
    compensations: [
      { id: 1, employee: 'Ana Oliveira', date: '2024-03-15', hours: 8, justification: 'Compensação por horas extras', status: 'pending' },
      { id: 2, employee: 'Carlos Lima', date: '2024-03-14', hours: 4, justification: 'Ausência por motivo pessoal', status: 'pending' }
    ],
    reimbursements: [
      { id: 1, employee: 'Fernanda Costa', date: '2024-03-15', amount: 250.00, description: 'Despesas com transporte', status: 'pending' },
      { id: 2, employee: 'Roberto Silva', date: '2024-03-14', amount: 180.50, description: 'Refeições em viagem', status: 'pending' },
      { id: 3, employee: 'Patricia Alves', date: '2024-03-13', amount: 320.00, description: 'Hospedagem', status: 'approved' }
    ],
    equipment: [
      { id: 1, employee: 'Lucas Pereira', date: '2024-03-15', equipment: 'Notebook Dell', value: 150.00, status: 'pending' }
    ],
    medicalCertificates: [
      { id: 1, employee: 'Juliana Rocha', date: '2024-03-15', days: 3, cid: 'J00', type: 'Médico', status: 'pending' },
      { id: 2, employee: 'Marcos Souza', date: '2024-03-14', days: 1, cid: 'K02', type: 'Odontológico', status: 'pending' }
    ],
    attendanceCorrections: [
      { id: 1, employee: 'Rafael Mendes', date: '2024-03-15', originalDate: '2024-03-14', justification: 'Esqueci de bater o ponto', status: 'pending' }
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      default: return 'Desconhecido';
    }
  };

  const handleApprove = (type: string, id: number) => {
    console.log(`Aprovar ${type} ID: ${id}`);
    // Implementar lógica de aprovação
  };

  const handleReject = (type: string, id: number) => {
    console.log(`Rejeitar ${type} ID: ${id}`);
    // Implementar lógica de rejeição
  };

  const filteredData = (data: any[]) => {
    return data.filter(item => {
      const matchesSearch = item.employee.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Central de Aprovações</h1>
          <p className="text-muted-foreground">
            Gerencie todas as solicitações da sua equipe
          </p>
        </div>
        <Button onClick={() => navigate('/portal-gestor/dashboard')}>
          Voltar ao Dashboard
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por funcionário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Aprovações */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="vacations">Férias</TabsTrigger>
          <TabsTrigger value="compensations">Compensações</TabsTrigger>
          <TabsTrigger value="reimbursements">Reembolsos</TabsTrigger>
          <TabsTrigger value="equipment">Equipamentos</TabsTrigger>
          <TabsTrigger value="medical">Atestados</TabsTrigger>
          <TabsTrigger value="attendance">Ponto</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Férias */}
            {filteredData(approvalData.vacations).map((item) => (
              <Card key={`vacation-${item.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Férias
                    </CardTitle>
                    <Badge className={getStatusColor(item.status)}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">{item.employee}</p>
                    <p className="text-sm text-muted-foreground">{item.period}</p>
                    <p className="text-sm text-muted-foreground">{item.days} dias</p>
                  </div>
                  {item.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApprove('vacation', item.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject('vacation', item.id)}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Reembolsos */}
            {filteredData(approvalData.reimbursements).map((item) => (
              <Card key={`reimbursement-${item.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Reembolso
                    </CardTitle>
                    <Badge className={getStatusColor(item.status)}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">{item.employee}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    <p className="text-sm font-medium">R$ {item.amount.toFixed(2)}</p>
                  </div>
                  {item.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApprove('reimbursement', item.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject('reimbursement', item.id)}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Compensações */}
            {filteredData(approvalData.compensations).map((item) => (
              <Card key={`compensation-${item.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Compensação
                    </CardTitle>
                    <Badge className={getStatusColor(item.status)}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">{item.employee}</p>
                    <p className="text-sm text-muted-foreground">{item.justification}</p>
                    <p className="text-sm font-medium">{item.hours} horas</p>
                  </div>
                  {item.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApprove('compensation', item.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject('compensation', item.id)}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Equipamentos */}
            {filteredData(approvalData.equipment).map((item) => (
              <Card key={`equipment-${item.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Equipamento
                    </CardTitle>
                    <Badge className={getStatusColor(item.status)}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">{item.employee}</p>
                    <p className="text-sm text-muted-foreground">{item.equipment}</p>
                    <p className="text-sm font-medium">R$ {item.value.toFixed(2)}/mês</p>
                  </div>
                  {item.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApprove('equipment', item.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject('equipment', item.id)}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Atestados */}
            {filteredData(approvalData.medicalCertificates).map((item) => (
              <Card key={`medical-${item.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Stethoscope className="h-5 w-5" />
                      Atestado
                    </CardTitle>
                    <Badge className={getStatusColor(item.status)}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">{item.employee}</p>
                    <p className="text-sm text-muted-foreground">{item.type} - CID: {item.cid}</p>
                    <p className="text-sm font-medium">{item.days} dias</p>
                  </div>
                  {item.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApprove('medical', item.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject('medical', item.id)}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Correções de Ponto */}
            {filteredData(approvalData.attendanceCorrections).map((item) => (
              <Card key={`attendance-${item.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Correção
                    </CardTitle>
                    <Badge className={getStatusColor(item.status)}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">{item.employee}</p>
                    <p className="text-sm text-muted-foreground">Data: {item.originalDate}</p>
                    <p className="text-sm text-muted-foreground">{item.justification}</p>
                  </div>
                  {item.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApprove('attendance', item.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject('attendance', item.id)}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tabs individuais para cada tipo */}
        <TabsContent value="vacations">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredData(approvalData.vacations).map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{item.employee}</CardTitle>
                    <Badge className={getStatusColor(item.status)}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Período:</p>
                    <p className="font-medium">{item.period}</p>
                    <p className="text-sm text-muted-foreground">{item.days} dias</p>
                  </div>
                  {item.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApprove('vacation', item.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject('vacation', item.id)}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Outras tabs podem ser implementadas de forma similar */}
      </Tabs>
    </div>
  );
};

export default CentralAprovacoes;
