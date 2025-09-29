import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  Users,
  FileText,
  Download,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AprovacaoReembolsos: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approvalComment, setApprovalComment] = useState('');

  // Dados mockados - serão substituídos por dados reais
  const reimbursementRequests = [
    {
      id: 1,
      employee: {
        id: '1',
        name: 'Fernanda Costa',
        position: 'Gerente de Projetos',
        department: 'Operações'
      },
      request: {
        expenseDate: '2024-03-10',
        amount: 250.00,
        category: 'Transporte',
        description: 'Despesas com transporte durante viagem a clientes',
        submittedAt: '2024-03-15T10:30:00Z',
        receiptUrl: '/receipts/receipt_001.pdf'
      },
      status: 'pending'
    },
    {
      id: 2,
      employee: {
        id: '2',
        name: 'Roberto Silva',
        position: 'Vendedor',
        department: 'Comercial'
      },
      request: {
        expenseDate: '2024-03-12',
        amount: 180.50,
        category: 'Alimentação',
        description: 'Refeições durante visita a clientes',
        submittedAt: '2024-03-14T14:20:00Z',
        receiptUrl: '/receipts/receipt_002.pdf'
      },
      status: 'pending'
    },
    {
      id: 3,
      employee: {
        id: '3',
        name: 'Patricia Alves',
        position: 'Consultora',
        department: 'Consultoria'
      },
      request: {
        expenseDate: '2024-03-08',
        amount: 320.00,
        category: 'Hospedagem',
        description: 'Hospedagem durante consultoria em cliente',
        submittedAt: '2024-03-13T09:15:00Z',
        receiptUrl: '/receipts/receipt_003.pdf'
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

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'transporte': return '🚗';
      case 'alimentação': return '🍽️';
      case 'hospedagem': return '🏨';
      case 'combustível': return '⛽';
      default: return '📄';
    }
  };

  const handleApprove = (requestId: number) => {
    console.log(`Aprovar reembolso ID: ${requestId}`, { comment: approvalComment });
    // Implementar lógica de aprovação
    setApprovalComment('');
    setSelectedRequest(null);
  };

  const handleReject = (requestId: number) => {
    console.log(`Rejeitar reembolso ID: ${requestId}`, { comment: approvalComment });
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const pendingCount = reimbursementRequests.filter(r => r.status === 'pending').length;
  const totalPendingAmount = reimbursementRequests
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.request.amount, 0);

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
            <h1 className="text-3xl font-bold mb-2">Aprovação de Reembolsos</h1>
            <p className="text-muted-foreground">
              Gerencie as solicitações de reembolso da sua equipe
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            {pendingCount} Pendentes
          </Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            {formatCurrency(totalPendingAmount)}
          </Badge>
        </div>
      </div>

      {/* Lista de Solicitações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reimbursementRequests.map((request) => (
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

              {/* Detalhes do Reembolso */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Detalhes do Reembolso</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span><strong>Valor:</strong></span>
                    <span className="font-bold text-green-600">{formatCurrency(request.request.amount)}</span>
                  </div>
                  <p><strong>Categoria:</strong> {getCategoryIcon(request.request.category)} {request.request.category}</p>
                  <p><strong>Data da Despesa:</strong> {formatDate(request.request.expenseDate)}</p>
                  <p><strong>Descrição:</strong> {request.request.description}</p>
                </div>
              </div>

              {/* Comprovante */}
              <div className="border border-gray-200 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Comprovante</span>
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
              <p className="text-sm"><strong>Valor:</strong> {formatCurrency(selectedRequest.request.amount)}</p>
              <p className="text-sm"><strong>Categoria:</strong> {selectedRequest.request.category}</p>
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
                Aprovar Reembolso
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

export default AprovacaoReembolsos;
