import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Plus, Edit, Trash2, CheckCircle, XCircle, Calendar, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDisciplinaryActions, useDisciplinaryStatistics } from '@/hooks/rh/useDisciplinaryActions';
import { EmployeeDisciplinaryAction, DisciplinaryActionType, DisciplinaryStatus } from '@/integrations/supabase/rh-benefits-unified-types';
import { useToast } from '@/hooks/use-toast';

interface DisciplinaryActionsTabProps {
  companyId: string;
}

const actionTypeLabels: Record<DisciplinaryActionType, string> = {
  advertencia_verbal: 'Advertência Verbal',
  advertencia_escrita: 'Advertência Escrita',
  suspensao: 'Suspensão',
  demissao_justa_causa: 'Demissão por Justa Causa'
};

const statusLabels: Record<DisciplinaryStatus, string> = {
  active: 'Ativa',
  suspended: 'Suspensa',
  expired: 'Expirada',
  cancelled: 'Cancelada'
};

const statusColors: Record<DisciplinaryStatus, string> = {
  active: 'bg-green-500',
  suspended: 'bg-yellow-500',
  expired: 'bg-gray-500',
  cancelled: 'bg-red-500'
};

export function DisciplinaryActionsTab({ companyId }: DisciplinaryActionsTabProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<EmployeeDisciplinaryAction | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedActionType, setSelectedActionType] = useState<DisciplinaryActionType | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<DisciplinaryStatus | ''>('');
  const { toast } = useToast();

  const {
    disciplinaryActions,
    isLoading,
    error,
    createDisciplinaryAction,
    updateDisciplinaryAction,
    deleteDisciplinaryAction,
    approveDisciplinaryAction
  } = useDisciplinaryActions({ 
    companyId, 
    employeeId: selectedEmployee !== 'all' ? selectedEmployee : undefined,
    actionType: selectedActionType || undefined,
    status: selectedStatus || undefined
  });

  const { statistics } = useDisciplinaryStatistics(companyId);

  const [formData, setFormData] = useState({
    employee_id: '',
    action_type: '' as DisciplinaryActionType | '',
    action_date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    duration_days: 0,
    start_date: '',
    end_date: '',
    notes: ''
  });

  const handleCreateAction = async () => {
    if (!formData.employee_id || !formData.action_type || !formData.description) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    try {
      await createDisciplinaryAction.mutateAsync({
        company_id: companyId,
        employee_id: formData.employee_id,
        action_type: formData.action_type as DisciplinaryActionType,
        action_date: formData.action_date,
        description: formData.description,
        duration_days: formData.duration_days || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        notes: formData.notes || undefined,
        status: 'active'
      });

      setIsCreateModalOpen(false);
      setFormData({
        employee_id: '',
        action_type: '',
        action_date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        duration_days: 0,
        start_date: '',
        end_date: '',
        notes: ''
      });
    } catch (error) {
      console.error('Erro ao criar ação disciplinar:', error);
    }
  };

  const handleEditAction = (action: EmployeeDisciplinaryAction) => {
    setEditingAction(action);
    setFormData({
      employee_id: action.employee_id,
      action_type: action.action_type,
      action_date: action.action_date,
      description: action.description,
      duration_days: action.duration_days || 0,
      start_date: action.start_date || '',
      end_date: action.end_date || '',
      notes: action.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateAction = async () => {
    if (!editingAction) return;

    try {
      await updateDisciplinaryAction.mutateAsync({
        id: editingAction.id,
        ...formData,
        action_type: formData.action_type as DisciplinaryActionType
      });

      setIsEditModalOpen(false);
      setEditingAction(null);
    } catch (error) {
      console.error('Erro ao atualizar ação disciplinar:', error);
    }
  };

  const handleDeleteAction = async (action: EmployeeDisciplinaryAction) => {
    if (window.confirm(`Tem certeza que deseja remover esta ação disciplinar?`)) {
      try {
        await deleteDisciplinaryAction.mutateAsync(action.id);
      } catch (error) {
        console.error('Erro ao remover ação disciplinar:', error);
      }
    }
  };

  const handleApproveAction = async (action: EmployeeDisciplinaryAction) => {
    try {
      await approveDisciplinaryAction.mutateAsync({
        id: action.id,
        approved_by: 'current-user-id' // TODO: Get from auth context
      });
    } catch (error) {
      console.error('Erro ao aprovar ação disciplinar:', error);
    }
  };

  // Filtros são aplicados no hook, não precisamos filtrar novamente aqui
  const filteredActions = disciplinaryActions;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando ações disciplinares...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-red-600">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4" />
          <p>Erro ao carregar ações disciplinares</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Total</p>
                  <p className="text-2xl font-bold">{statistics.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Suspensões</p>
                  <p className="text-2xl font-bold">{statistics.byType.suspensao}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Ativas</p>
                  <p className="text-2xl font-bold">{statistics.byStatus.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Este Mês</p>
                  <p className="text-2xl font-bold">{statistics.thisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros e Ações */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Ações Disciplinares</span>
            </CardTitle>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Ação
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="employee-filter">Funcionário</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os funcionários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os funcionários</SelectItem>
                  <SelectItem value="fc0ba118-76d7-4dc0-8574-dc43ea6934c5">Funcionário Teste Locação (TESTE001)</SelectItem>
                  <SelectItem value="25594519-67fe-412e-97fd-9ababe0849f0">João Silva Teste (010001)</SelectItem>
                  <SelectItem value="47f83704-7c39-4a1c-a5bc-65e5552f12ee">Maria Santos Teste (010002)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="action-type-filter">Tipo de Ação</Label>
              <Select value={selectedActionType} onValueChange={(value) => setSelectedActionType(value === 'all' ? '' : value as DisciplinaryActionType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {Object.entries(actionTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value === 'all' ? '' : value as DisciplinaryStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabela */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActions?.map((action) => (
                  <TableRow key={action.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{action.employee?.nome}</p>
                        <p className="text-sm text-muted-foreground">{action.employee?.matricula}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {actionTypeLabels[action.action_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(action.action_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {action.duration_days ? `${action.duration_days} dias` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[action.status]}>
                        {statusLabels[action.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {action.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAction(action)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {action.status === 'suspended' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApproveAction(action)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAction(action)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Criação/Edição */}
      <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setEditingAction(null);
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isCreateModalOpen ? 'Nova Ação Disciplinar' : 'Editar Ação Disciplinar'}
            </DialogTitle>
            <DialogDescription>
              {isCreateModalOpen 
                ? 'Registre uma nova ação disciplinar para o funcionário.'
                : 'Edite os dados da ação disciplinar.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employee_id">Funcionário *</Label>
                <Select value={formData.employee_id} onValueChange={(value) => setFormData(prev => ({ ...prev, employee_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fc0ba118-76d7-4dc0-8574-dc43ea6934c5">Funcionário Teste Locação (TESTE001)</SelectItem>
                    <SelectItem value="25594519-67fe-412e-97fd-9ababe0849f0">João Silva Teste (010001)</SelectItem>
                    <SelectItem value="47f83704-7c39-4a1c-a5bc-65e5552f12ee">Maria Santos Teste (010002)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="action_type">Tipo de Ação *</Label>
                <Select value={formData.action_type} onValueChange={(value) => setFormData(prev => ({ ...prev, action_type: value as DisciplinaryActionType }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(actionTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="action_date">Data da Ação *</Label>
                <Input
                  id="action_date"
                  type="date"
                  value={formData.action_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, action_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="duration_days">Duração (dias)</Label>
                <Input
                  id="duration_days"
                  type="number"
                  min="0"
                  value={formData.duration_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_days: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Data de Início</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end_date">Data de Fim</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                placeholder="Descreva a ação disciplinar aplicada..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Observações adicionais..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
                setEditingAction(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={isCreateModalOpen ? handleCreateAction : handleUpdateAction}
              disabled={createDisciplinaryAction.isPending || updateDisciplinaryAction.isPending}
            >
              {isCreateModalOpen ? 'Criar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
