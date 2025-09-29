import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Car, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  Users,
  DollarSign,
  Settings,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// useEquipmentRentalApprovals removido - sistema de equipamentos migrado para benefícios unificados
import { useToast } from '@/hooks/use-toast';

const AprovacaoEquipamentos: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [statusFilter, setStatusFilter] = useState('');

  // Dados mockados temporariamente - sistema migrado para benefícios unificados
  const approvals: any[] = [];
  const loading = false;
  const error = null;
  const refetch = () => {};
  const statsLoading = false;
  const isUpdating = false;
  const stats = { pending: 0, approved: 0, rejected: 0 };
  const updateStatus = async () => {};

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'aprovado': return 'bg-green-100 text-green-800';
      case 'rejeitado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'aprovado': return 'Aprovado';
      case 'rejeitado': return 'Rejeitado';
      default: return 'Desconhecido';
    }
  };

  const getEquipmentTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'vehicle': return '🚗';
      case 'computer': return '💻';
      case 'phone': return '📱';
      default: return '🔧';
    }
  };

  const getEquipmentTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'vehicle': return 'Veículo';
      case 'computer': return 'Computador';
      case 'phone': return 'Telefone';
      default: return 'Outros';
    }
  };

  const handleApprove = async (approvalId: string) => {
    try {
      await updateStatus({
        id: approvalId,
        status: 'aprovado',
        observacoes: approvalComment || undefined
      });
      
      toast({
        title: "Aprovação realizada",
        description: "Equipamento aprovado com sucesso.",
      });
      
      setApprovalComment('');
      setSelectedRequest(null);
      refetch();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o equipamento.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (approvalId: string) => {
    try {
      await updateStatus({
        id: approvalId,
        status: 'rejeitado',
        observacoes: approvalComment || undefined
      });
      
      toast({
        title: "Rejeição realizada",
        description: "Equipamento rejeitado com sucesso.",
      });
      
      setApprovalComment('');
      setSelectedRequest(null);
      refetch();
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar o equipamento.",
        variant: "destructive",
      });
    }
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

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  const pendingCount = stats?.pendentes || 0;
  const totalPendingAmount = stats?.valorTotalPendente || 0;

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
            <h1 className="text-3xl font-bold mb-2">Aprovação de Equipamentos</h1>
            <p className="text-muted-foreground">
              Gerencie as aprovações mensais de equipamentos locados da sua equipe
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            {pendingCount} Pendentes
          </Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            {formatCurrency(totalPendingAmount)}/mês
          </Badge>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="month-filter">Mês:</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <SelectItem key={month} value={month.toString()}>
                      {getMonthName(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="year-filter">Ano:</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="status-filter">Status:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando aprovações...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>Erro ao carregar aprovações. Tente novamente.</p>
              <Button onClick={() => refetch()} className="mt-2">
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Aprovações */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {approvals.length === 0 ? (
            <Card className="col-span-2">
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">Nenhuma aprovação encontrada</p>
                  <p>Não há aprovações de equipamentos para o período selecionado.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            approvals.map((approval) => (
              <Card key={approval.id} className={`cursor-pointer transition-all hover:shadow-md ${
                selectedRequest?.id === approval.id ? 'ring-2 ring-blue-500' : ''
              }`} onClick={() => setSelectedRequest(approval)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{approval.employee?.nome || 'Funcionário'}</CardTitle>
                    <Badge className={getStatusColor(approval.status)}>
                      {getStatusLabel(approval.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Informações do Funcionário */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{approval.employee?.position?.nome || 'Cargo'}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span>CPF: {approval.employee?.cpf || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Detalhes do Equipamento */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Detalhes do Equipamento</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p><strong>Tipo:</strong> {getEquipmentTypeIcon(approval.equipment_rental?.equipment_type || '')} {getEquipmentTypeLabel(approval.equipment_rental?.equipment_type || '')}</p>
                      <p><strong>Nome:</strong> {approval.equipment_rental?.equipment_name || 'N/A'}</p>
                      {approval.equipment_rental?.brand && approval.equipment_rental?.model && (
                        <p><strong>Marca/Modelo:</strong> {approval.equipment_rental.brand} {approval.equipment_rental.model}</p>
                      )}
                      {approval.equipment_rental?.license_plate && (
                        <p><strong>Placa:</strong> {approval.equipment_rental.license_plate}</p>
                      )}
                      {approval.equipment_rental?.serial_number && (
                        <p><strong>Série:</strong> {approval.equipment_rental.serial_number}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span><strong>Valor Aprovado:</strong></span>
                        <span className="font-bold text-green-600">{formatCurrency(approval.valor_aprovado)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Período de Aprovação */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Período de Aprovação</span>
                    </div>
                    <div className="text-sm">
                      <p><strong>Mês:</strong> {getMonthName(approval.mes_referencia)}/{approval.ano_referencia}</p>
                      <p><strong>Data de Início:</strong> {approval.equipment_rental?.start_date ? formatDate(approval.equipment_rental.start_date) : 'N/A'}</p>
                    </div>
                  </div>

                  {/* Status do Equipamento */}
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${
                      approval.equipment_rental?.status === 'active' ? 'text-green-600' : 'text-red-600'
                    }`} />
                    <span className={`text-sm ${
                      approval.equipment_rental?.status === 'active' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      Equipamento {approval.equipment_rental?.status === 'active' ? 'ativo' : 'inativo'}
                    </span>
                  </div>

                  {/* Data de Criação */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Criado em: {formatDateTime(approval.created_at)}</span>
                  </div>

                  {/* Ações */}
                  {approval.status === 'pendente' && (
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        disabled={isUpdating}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(approval.id);
                        }}
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        )}
                        Aprovar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        disabled={isUpdating}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(approval.id);
                        }}
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-1" />
                        )}
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Modal de Comentário */}
      {selectedRequest && (
        <Card className="fixed inset-x-4 bottom-4 z-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Ação para {selectedRequest.employee?.nome || 'Funcionário'}</span>
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
              <p className="text-sm"><strong>Equipamento:</strong> {selectedRequest.equipment_rental?.equipment_name || 'N/A'}</p>
              <p className="text-sm"><strong>Valor:</strong> {formatCurrency(selectedRequest.valor_aprovado)}</p>
              <p className="text-sm"><strong>Período:</strong> {getMonthName(selectedRequest.mes_referencia)}/{selectedRequest.ano_referencia}</p>
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
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Aprovar Equipamento
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleReject(selectedRequest.id)}
                className="flex-1"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Rejeitar Solicitação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AprovacaoEquipamentos;
