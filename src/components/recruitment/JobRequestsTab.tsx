import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  FileText,
  Briefcase,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JobRequest {
  id: string;
  position_name: string;
  department_name: string;
  urgency_level: string;
  status: string;
  requested_by: string;
  requested_by_name: string;
  created_at: string;
  expected_start_date: string;
}

interface JobRequestsTabProps {
  companyId: string;
}

// Função auxiliar para badges de status
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'solicitado':
      return <Badge className="bg-yellow-100 text-yellow-800">Solicitado</Badge>;
    case 'em_analise':
      return <Badge className="bg-blue-100 text-blue-800">Em Análise</Badge>;
    case 'aprovado':
      return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
    case 'reprovado':
      return <Badge className="bg-red-100 text-red-800">Reprovado</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800">Desconhecido</Badge>;
  }
};

const JobRequestsTab: React.FC<JobRequestsTabProps> = ({ companyId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'solicitado' | 'em_analise' | 'aprovado' | 'reprovado'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<JobRequest | null>(null);
  
  const { toast } = useToast();

  // Mock data - substituir por dados reais do banco
  const mockRequests: JobRequest[] = [
    {
      id: '1',
      position_name: 'Desenvolvedor Frontend',
      department_name: 'Tecnologia',
      urgency_level: 'alta',
      status: 'solicitado',
      requested_by: 'user1',
      requested_by_name: 'João Silva',
      created_at: '2024-01-15',
      expected_start_date: '2024-02-01'
    },
    {
      id: '2',
      position_name: 'Analista de RH',
      department_name: 'Recursos Humanos',
      urgency_level: 'media',
      status: 'em_analise',
      requested_by: 'user2',
      requested_by_name: 'Maria Santos',
      created_at: '2024-01-14',
      expected_start_date: '2024-02-15'
    },
    {
      id: '3',
      position_name: 'Gerente de Projetos',
      department_name: 'Operações',
      urgency_level: 'critica',
      status: 'aprovado',
      requested_by: 'user3',
      requested_by_name: 'Pedro Costa',
      created_at: '2024-01-10',
      expected_start_date: '2024-01-25'
    }
  ];

  const filteredRequests = mockRequests.filter(request => {
    const matchesSearch = request.position_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.department_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });


  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'baixa':
        return <Badge variant="outline" className="text-green-600">Baixa</Badge>;
      case 'media':
        return <Badge variant="outline" className="text-yellow-600">Média</Badge>;
      case 'alta':
        return <Badge variant="outline" className="text-orange-600">Alta</Badge>;
      case 'critica':
        return <Badge variant="outline" className="text-red-600">Crítica</Badge>;
      default:
        return <Badge variant="outline">N/A</Badge>;
    }
  };

  const handleViewRequest = (request: JobRequest) => {
    setSelectedRequest(request);
    setShowViewModal(true);
  };

  const handleApproveRequest = (requestId: string) => {
    toast({
      title: "Solicitação Aprovada",
      description: "A solicitação de vaga foi aprovada com sucesso",
      variant: "default"
    });
  };

  const handleRejectRequest = (requestId: string) => {
    toast({
      title: "Solicitação Rejeitada",
      description: "A solicitação de vaga foi rejeitada",
      variant: "destructive"
    });
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por cargo ou departamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="solicitado">Solicitados</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="aprovado">Aprovados</SelectItem>
                  <SelectItem value="reprovado">Reprovados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Solicitação
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Solicitações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Solicitações de Vagas ({filteredRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-blue-400">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{request.position_name}</h3>
                          {getStatusBadge(request.status)}
                          {getUrgencyBadge(request.urgency_level)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            <span>Departamento: {request.department_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>Solicitado por: {request.requested_by_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Início esperado: {new Date(request.expected_start_date).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewRequest(request)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalhes
                        </Button>
                        {request.status === 'solicitado' || request.status === 'em_analise' ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleRejectRequest(request.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeitar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApproveRequest(request.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Criação */}
      {showCreateModal && (
        <CreateJobRequestModal
          companyId={companyId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            toast({
              title: "Solicitação Criada",
              description: "A solicitação de vaga foi enviada para aprovação",
              variant: "default"
            });
          }}
        />
      )}

      {/* Modal de Visualização */}
      {showViewModal && selectedRequest && (
        <ViewJobRequestModal
          request={selectedRequest}
          onClose={() => setShowViewModal(false)}
          onApprove={() => handleApproveRequest(selectedRequest.id)}
          onReject={() => handleRejectRequest(selectedRequest.id)}
        />
      )}
    </div>
  );
};

// Modal de Criação
const CreateJobRequestModal: React.FC<{
  companyId: string;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    position_name: '',
    department_name: '',
    job_description: '',
    requirements: '',
    benefits: '',
    salary_range: '',
    urgency_level: 'media',
    expected_start_date: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementar criação da solicitação
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Nova Solicitação de Vaga</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position_name">Nome do Cargo *</Label>
                <Input
                  id="position_name"
                  value={formData.position_name}
                  onChange={(e) => setFormData({ ...formData, position_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="department_name">Departamento</Label>
                <Input
                  id="department_name"
                  value={formData.department_name}
                  onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="job_description">Descrição do Cargo *</Label>
              <Textarea
                id="job_description"
                value={formData.job_description}
                onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="requirements">Requisitos</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="benefits">Benefícios</Label>
                <Textarea
                  id="benefits"
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="salary_range">Faixa Salarial</Label>
                <Input
                  id="salary_range"
                  value={formData.salary_range}
                  onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="urgency_level">Nível de Urgência</Label>
                <Select value={formData.urgency_level} onValueChange={(value) => setFormData({ ...formData, urgency_level: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="expected_start_date">Data de Início Esperada</Label>
                <Input
                  id="expected_start_date"
                  type="date"
                  value={formData.expected_start_date}
                  onChange={(e) => setFormData({ ...formData, expected_start_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                Enviar Solicitação
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Modal de Visualização
const ViewJobRequestModal: React.FC<{
  request: JobRequest;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}> = ({ request, onClose, onApprove, onReject }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Detalhes da Solicitação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="font-medium">Cargo:</Label>
              <p className="text-sm text-gray-600">{request.position_name}</p>
            </div>
            <div>
              <Label className="font-medium">Departamento:</Label>
              <p className="text-sm text-gray-600">{request.department_name}</p>
            </div>
          </div>
          
          <div>
            <Label className="font-medium">Status:</Label>
            <div className="mt-1">
              {getStatusBadge(request.status)}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            {request.status === 'solicitado' || request.status === 'em_analise' ? (
              <>
                <Button variant="destructive" onClick={onReject}>
                  Rejeitar
                </Button>
                <Button onClick={onApprove}>
                  Aprovar
                </Button>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobRequestsTab;
