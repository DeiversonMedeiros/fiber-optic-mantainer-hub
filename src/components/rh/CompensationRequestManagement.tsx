import React, { useState } from 'react';
import { useCompensationRequests } from '@/hooks/rh/useCompensationRequests';
import { useCompany } from '@/hooks/useCompany';
import { compensationRequestValidationSchema, compensationRequestBusinessRules } from '@/lib/validations/rh-validations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, CheckCircle, XCircle, AlertCircle, Clock, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface CompensationRequestFormData {
  employee_id: string;
  data_solicitacao: string;
  data_compensacao: string;
  quantidade_horas: string;
  justificativa: string;
}

export function CompensationRequestManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [formData, setFormData] = useState<CompensationRequestFormData>({
    employee_id: '',
    data_solicitacao: new Date().toISOString().split('T')[0],
    data_compensacao: '',
    quantidade_horas: '',
    justificativa: ''
  });

  const { company } = useCompany();
  const {
    compensationRequests,
    isLoading,
    error,
    createCompensationRequest,
    updateCompensationRequest,
    deleteCompensationRequest,
    approveCompensationRequest,
    getPendingCompensationRequests
  } = useCompensationRequests(company?.id);

  const resetForm = () => {
    setFormData({
      employee_id: '',
      data_solicitacao: new Date().toISOString().split('T')[0],
      data_compensacao: '',
      quantidade_horas: '',
      justificativa: ''
    });
    setSelectedRequest(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!company?.id) {
      toast.error('Empresa não identificada');
      return;
    }

    const requestData = {
      company_id: company.id,
      employee_id: formData.employee_id,
      data_solicitacao: formData.data_solicitacao,
      data_compensacao: formData.data_compensacao,
      quantidade_horas: parseFloat(formData.quantidade_horas),
      justificativa: formData.justificativa,
      status: 'pendente' as const
    };

    // Validar dados usando schema
    try {
      compensationRequestValidationSchema.parse(requestData);
    } catch (error: any) {
      const firstError = error.errors?.[0];
      toast.error(firstError?.message || 'Dados inválidos');
      return;
    }

    // Validar regras de negócio
    if (!compensationRequestBusinessRules.isValidCompensationPeriod(
      formData.data_solicitacao, 
      formData.data_compensacao
    )) {
      toast.error('Período de compensação inválido. Compensação deve ser no máximo 60 dias após a solicitação');
      return;
    }

    if (compensationRequests && !selectedRequest) {
      if (compensationRequestBusinessRules.hasOverlap(
        compensationRequests, 
        formData.data_compensacao
      )) {
        toast.error('Já existe compensação aprovada para esta data');
        return;
      }
    }

    if (selectedRequest) {
      updateCompensationRequest.mutate({
        id: selectedRequest.id,
        ...requestData
      });
    } else {
      createCompensationRequest.mutate(requestData);
    }
  };

  const handleEdit = (request: any) => {
    setSelectedRequest(request);
    setFormData({
      employee_id: request.employee_id,
      data_solicitacao: request.data_solicitacao,
      data_compensacao: request.data_compensacao,
      quantidade_horas: request.quantidade_horas.toString(),
      justificativa: request.justificativa || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta solicitação?')) {
      deleteCompensationRequest.mutate(id);
    }
  };

  const handleApprove = (id: string, approvedBy: string) => {
    approveCompensationRequest.mutate({ id, approvedBy });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        );
      case 'rejeitado':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  const calculateStats = () => {
    if (!compensationRequests) return { total: 0, pending: 0, approved: 0, rejected: 0 };
    
    return {
      total: compensationRequests.length,
      pending: compensationRequests.filter(r => r.status === 'pendente').length,
      approved: compensationRequests.filter(r => r.status === 'aprovado').length,
      rejected: compensationRequests.filter(r => r.status === 'rejeitado').length
    };
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Carregando solicitações de compensação...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>Erro ao carregar solicitações: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Solicitações de Compensação</h1>
          <p className="text-gray-600">Gerencie as solicitações de compensação de horas dos funcionários</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedRequest ? 'Editar Solicitação' : 'Nova Solicitação'} de Compensação
              </DialogTitle>
              <DialogDescription>
                {selectedRequest 
                  ? 'Edite os dados da solicitação de compensação.'
                  : 'Adicione uma nova solicitação de compensação de horas.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="employee_id">Funcionário *</Label>
                  <Input
                    id="employee_id"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                    placeholder="ID do funcionário"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="data_solicitacao">Data da Solicitação *</Label>
                  <Input
                    id="data_solicitacao"
                    type="date"
                    value={formData.data_solicitacao}
                    onChange={(e) => setFormData({...formData, data_solicitacao: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="data_compensacao">Data para Compensação *</Label>
                  <Input
                    id="data_compensacao"
                    type="date"
                    value={formData.data_compensacao}
                    onChange={(e) => setFormData({...formData, data_compensacao: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantidade_horas">Quantidade de Horas *</Label>
                  <Input
                    id="quantidade_horas"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.quantidade_horas}
                    onChange={(e) => setFormData({...formData, quantidade_horas: e.target.value})}
                    placeholder="Ex: 8.5"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="justificativa">Justificativa *</Label>
                  <Textarea
                    id="justificativa"
                    value={formData.justificativa}
                    onChange={(e) => setFormData({...formData, justificativa: e.target.value})}
                    placeholder="Descreva o motivo da solicitação de compensação..."
                    rows={3}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCompensationRequest.isPending || updateCompensationRequest.isPending}
                >
                  {(createCompensationRequest.isPending || updateCompensationRequest.isPending) ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Compensation Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Solicitações de Compensação
          </CardTitle>
          <CardDescription>
            Lista de todas as solicitações de compensação de horas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!compensationRequests || compensationRequests.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhuma solicitação de compensação encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Data Solicitação</TableHead>
                  <TableHead>Data Compensação</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compensationRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.employee?.nome || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {new Date(request.data_solicitacao).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {new Date(request.data_compensacao).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{request.quantidade_horas}h</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(request)}
                        >
                          Editar
                        </Button>
                        {request.status === 'pendente' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(request.id, 'current-user-id')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Aprovar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(request.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
