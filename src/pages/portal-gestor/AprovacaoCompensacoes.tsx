import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ArrowLeft,
  Users,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AprovacaoCompensacoes: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approvalComment, setApprovalComment] = useState('');

  // Dados mockados - serão substituídos por dados reais
  const compensationRequests = [
    {
      id: 1,
      employee: {
        id: '1',
        name: 'Ana Oliveira',
        position: 'Analista de Sistemas',
        department: 'TI',
        currentTimeBalance: 15.5
      },
      request: {
        compensationDate: '2024-03-20',
        hours: 8,
        justification: 'Compensação por horas extras trabalhadas no final de semana',
        submittedAt: '2024-03-15T10:30:00Z'
      },
      status: 'pending'
    },
    {
      id: 2,
      employee: {
        id: '2',
        name: 'Carlos Lima',
        position: 'Desenvolvedor',
        department: 'TI',
        currentTimeBalance: 12.0
      },
      request: {
        compensationDate: '2024-03-18',
        hours: 4,
        justification: 'Ausência por motivo pessoal - consulta médica',
        submittedAt: '2024-03-14T14:20:00Z'
      },
      status: 'pending'
    },
    {
      id: 3,
      employee: {
        id: '3',
        name: 'Fernanda Costa',
        position: 'Designer',
        department: 'Marketing',
        currentTimeBalance: 8.5
      },
      request: {
        compensationDate: '2024-03-22',
        hours: 8,
        justification: 'Compensação por horas extras em projeto urgente',
        submittedAt: '2024-03-13T09:15:00Z'
      },
      status: 'approved'
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
    console.log(`Aprovar compensação ID: ${requestId}`, { comment: approvalComment });
    // Implementar lógica de aprovação
    setApprovalComment('');
    setSelectedRequest(null);
  };

  const handleReject = (requestId: number) => {
    console.log(`Rejeitar compensação ID: ${requestId}`, { comment: approvalComment });
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

  const pendingCount = compensationRequests.filter(r => r.status === 'pending').length;

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
            <h1 className="text-3xl font-bold mb-2">Aprovação de Compensações</h1>
            <p className="text-muted-foreground">
              Gerencie as solicitações de compensação de banco de horas da sua equipe
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
          {pendingCount} Pendentes
        </Badge>
      </div>

      {/* Lista de Solicitações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {compensationRequests.map((request) => (
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
                  <TrendingUp className="h-4 w-4" />
                  <span>Saldo atual: {request.employee.currentTimeBalance}h</span>
                </div>
              </div>

              {/* Detalhes da Compensação */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Detalhes da Compensação</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p><strong>Data:</strong> {formatDate(request.request.compensationDate)}</p>
                  <p><strong>Horas:</strong> {request.request.hours}h</p>
                  <p><strong>Justificativa:</strong> {request.request.justification}</p>
                </div>
              </div>

              {/* Validação de Saldo */}
              {request.request.hours > request.employee.currentTimeBalance && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Saldo Insuficiente</span>
                  </div>
                  <p className="text-sm text-red-700">
                    O funcionário possui apenas {request.employee.currentTimeBalance}h de saldo,
                    mas está solicitando {request.request.hours}h.
                  </p>
                </div>
              )}

              {/* Data de Submissão */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Solicitado em: {formatDateTime(request.request.submittedAt)}</span>
              </div>

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
                    disabled={request.request.hours > request.employee.currentTimeBalance}
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

      {/* Modal de Comentário */}
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
                disabled={selectedRequest.request.hours > selectedRequest.employee.currentTimeBalance}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprovar Compensação
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

export default AprovacaoCompensacoes;
