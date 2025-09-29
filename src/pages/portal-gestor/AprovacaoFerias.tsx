import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AprovacaoFerias: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approvalComment, setApprovalComment] = useState('');

  // Dados mockados - serão substituídos por dados reais
  const vacationRequests = [
    {
      id: 1,
      employee: {
        id: '1',
        name: 'João Silva',
        position: 'Desenvolvedor Senior',
        department: 'TI',
        admissionDate: '2020-01-15',
        currentVacationBalance: 30
      },
      request: {
        startDate: '2024-07-15',
        endDate: '2024-07-30',
        days: 16,
        period: '1º Período',
        year: 2024,
        submittedAt: '2024-03-15T10:30:00Z',
        justification: 'Férias familiares planejadas há meses'
      },
      status: 'pending',
      conflicts: []
    },
    {
      id: 2,
      employee: {
        id: '2',
        name: 'Maria Santos',
        position: 'Analista de RH',
        department: 'Recursos Humanos',
        admissionDate: '2019-06-01',
        currentVacationBalance: 20
      },
      request: {
        startDate: '2024-08-01',
        endDate: '2024-08-15',
        days: 15,
        period: '2º Período',
        year: 2024,
        submittedAt: '2024-03-14T14:20:00Z',
        justification: 'Viagem internacional já programada'
      },
      status: 'pending',
      conflicts: []
    },
    {
      id: 3,
      employee: {
        id: '3',
        name: 'Pedro Costa',
        position: 'Gerente de Projetos',
        department: 'Operações',
        admissionDate: '2018-03-10',
        currentVacationBalance: 25
      },
      request: {
        startDate: '2024-09-20',
        endDate: '2024-10-05',
        days: 16,
        period: '3º Período',
        year: 2024,
        submittedAt: '2024-03-13T09:15:00Z',
        justification: 'Período de baixa demanda no projeto'
      },
      status: 'pending',
      conflicts: []
    }
  ];

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

  const handleApprove = (requestId: number) => {
    console.log(`Aprovar férias ID: ${requestId}`, { comment: approvalComment });
    // Implementar lógica de aprovação
    setApprovalComment('');
    setSelectedRequest(null);
  };

  const handleReject = (requestId: number) => {
    console.log(`Rejeitar férias ID: ${requestId}`, { comment: approvalComment });
    // Implementar lógica de rejeição
    setApprovalComment('');
    setSelectedRequest(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/portal-gestor/aprovacoes')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Aprovação de Férias</h1>
            <p className="text-muted-foreground">
              Gerencie as solicitações de férias da sua equipe
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
          {vacationRequests.filter(r => r.status === 'pending').length} Pendentes
        </Badge>
      </div>

      {/* Lista de Solicitações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {vacationRequests.map((request) => (
          <Card key={request.id} className={`cursor-pointer transition-all hover:shadow-md ${
            selectedRequest?.id === request.id ? 'ring-2 ring-blue-500' : ''
          }`} onClick={() => setSelectedRequest(request)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{request.employee.name}</CardTitle>
                <Badge className={getStatusColor(request.status)}>
                  {getStatusLabel(request.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Informações do Funcionário */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{request.employee.position}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Saldo atual: {request.employee.currentVacationBalance} dias</span>
                </div>
              </div>

              {/* Período Solicitado */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Período Solicitado</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p><strong>Início:</strong> {formatDate(request.request.startDate)}</p>
                  <p><strong>Fim:</strong> {formatDate(request.request.endDate)}</p>
                  <p><strong>Dias:</strong> {request.request.days}</p>
                  <p><strong>Período:</strong> {request.request.period}</p>
                </div>
              </div>

              {/* Justificativa */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Justificativa:</p>
                <p className="text-sm">{request.request.justification}</p>
              </div>

              {/* Data de Submissão */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Solicitado em: {formatDateTime(request.request.submittedAt)}</span>
              </div>

              {/* Conflitos (se houver) */}
              {request.conflicts.length > 0 && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Conflitos Detectados</span>
                  </div>
                  <ul className="text-sm text-red-700 space-y-1">
                    {request.conflicts.map((conflict, index) => (
                      <li key={index}>• {conflict}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ações */}
              {request.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApprove(request.id);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Aprovar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReject(request.id);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Comentário (quando uma solicitação é selecionada) */}
      {selectedRequest && (
        <Card className="fixed inset-x-4 bottom-4 z-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Ação para {selectedRequest.employee.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRequest(null)}
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="comment">Comentário (opcional)</Label>
              <Textarea
                id="comment"
                placeholder="Adicione um comentário sobre sua decisão..."
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => handleApprove(selectedRequest.id)}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprovar Férias
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleReject(selectedRequest.id)}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeitar Solicitação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AprovacaoFerias;
