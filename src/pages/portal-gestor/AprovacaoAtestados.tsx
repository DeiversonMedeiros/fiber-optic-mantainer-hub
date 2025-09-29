import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Stethoscope, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  Users,
  FileText,
  Download,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AprovacaoAtestados: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approvalComment, setApprovalComment] = useState('');

  // Dados mockados - serão substituídos por dados reais
  const medicalCertificateRequests = [
    {
      id: 1,
      employee: {
        id: '1',
        name: 'Juliana Rocha',
        position: 'Analista de RH',
        department: 'Recursos Humanos'
      },
      certificate: {
        startDate: '2024-03-15',
        endDate: '2024-03-17',
        days: 3,
        cid: 'J00',
        cidDescription: 'Resfriado comum',
        type: 'Médico',
        submittedAt: '2024-03-15T10:30:00Z',
        attachmentUrl: '/certificates/cert_001.pdf'
      },
      status: 'pending'
    },
    {
      id: 2,
      employee: {
        id: '2',
        name: 'Marcos Souza',
        position: 'Técnico',
        department: 'Produção'
      },
      certificate: {
        startDate: '2024-03-14',
        endDate: '2024-03-14',
        days: 1,
        cid: 'K02',
        cidDescription: 'Cárie dentária',
        type: 'Odontológico',
        submittedAt: '2024-03-14T14:20:00Z',
        attachmentUrl: '/certificates/cert_002.pdf'
      },
      status: 'pending'
    },
    {
      id: 3,
      employee: {
        id: '3',
        name: 'Carla Mendes',
        position: 'Assistente',
        department: 'Administrativo'
      },
      certificate: {
        startDate: '2024-03-10',
        endDate: '2024-03-12',
        days: 3,
        cid: 'Z00',
        cidDescription: 'Exame médico geral',
        type: 'Médico',
        submittedAt: '2024-03-13T09:15:00Z',
        attachmentUrl: '/certificates/cert_003.pdf'
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

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'médico': return '🏥';
      case 'odontológico': return '🦷';
      case 'acompanhante': return '👥';
      default: return '📄';
    }
  };

  const handleApprove = (requestId: number) => {
    console.log(`Aprovar atestado ID: ${requestId}`, { comment: approvalComment });
    // Implementar lógica de aprovação
    setApprovalComment('');
    setSelectedRequest(null);
  };

  const handleReject = (requestId: number) => {
    console.log(`Rejeitar atestado ID: ${requestId}`, { comment: approvalComment });
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

  const pendingCount = medicalCertificateRequests.filter(r => r.status === 'pending').length;
  const totalDays = medicalCertificateRequests
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.certificate.days, 0);

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
            <h1 className="text-3xl font-bold mb-2">Aprovação de Atestados</h1>
            <p className="text-muted-foreground">
              Gerencie as solicitações de atestados médicos da sua equipe
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            {pendingCount} Pendentes
          </Badge>
          <Badge variant="outline" className="bg-red-100 text-red-800">
            {totalDays} dias de afastamento
          </Badge>
        </div>
      </div>

      {/* Lista de Solicitações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {medicalCertificateRequests.map((request) => (
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
              </div>

              {/* Detalhes do Atestado */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Stethoscope className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Detalhes do Atestado</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p><strong>Tipo:</strong> {getTypeIcon(request.certificate.type)} {request.certificate.type}</p>
                  <p><strong>Período:</strong> {formatDate(request.certificate.startDate)} até {formatDate(request.certificate.endDate)}</p>
                  <p><strong>Dias:</strong> {request.certificate.days} {request.certificate.days === 1 ? 'dia' : 'dias'}</p>
                  <p><strong>CID:</strong> {request.certificate.cid} - {request.certificate.cidDescription}</p>
                </div>
              </div>

              {/* Anexo do Atestado */}
              <div className="border border-gray-200 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Atestado Médico</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3 mr-1" />
                      Baixar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Validações */}
              <div className="space-y-2">
                {request.certificate.days > 15 && (
                  <div className="bg-orange-50 border border-orange-200 p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-orange-800">Atestado longo - Verificar necessidade de INSS</span>
                    </div>
                  </div>
                )}
                
                {request.certificate.type === 'Odontológico' && request.certificate.days > 1 && (
                  <div className="bg-yellow-50 border border-yellow-200 p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">Atestado odontológico com mais de 1 dia</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Data de Submissão */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Enviado em: {formatDateTime(request.certificate.submittedAt)}</span>
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
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm"><strong>Tipo:</strong> {selectedRequest.certificate.type}</p>
              <p className="text-sm"><strong>Período:</strong> {formatDate(selectedRequest.certificate.startDate)} - {formatDate(selectedRequest.certificate.endDate)}</p>
              <p className="text-sm"><strong>Dias:</strong> {selectedRequest.certificate.days}</p>
              <p className="text-sm"><strong>CID:</strong> {selectedRequest.certificate.cid}</p>
            </div>
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
                Aprovar Atestado
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

export default AprovacaoAtestados;
