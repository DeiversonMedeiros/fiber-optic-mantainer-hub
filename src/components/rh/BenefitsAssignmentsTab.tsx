// @ts-nocheck
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Search, Filter, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEmployeeBenefitAssignments } from '@/hooks/rh/useUnifiedBenefits';
import { useBenefitConfigurations } from '@/hooks/rh/useUnifiedBenefits';
import { useEmployees } from '@/hooks/rh/useEmployees';
import { EmployeeBenefitAssignment, EmployeeBenefitAssignmentInsert, BenefitConfiguration } from '@/integrations/supabase/rh-benefits-unified-types';
import { FormModal } from './FormModal';
import { toast } from 'sonner';

interface BenefitsAssignmentsTabProps {
  companyId: string;
}

export function BenefitsAssignmentsTab({ companyId }: BenefitsAssignmentsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [benefitTypeFilter, setBenefitTypeFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<EmployeeBenefitAssignment | null>(null);

  const { data: assignments, isLoading, error } = useEmployeeBenefitAssignments(companyId);
  const { data: configurations } = useBenefitConfigurations(companyId);
  const { data: employees } = useEmployees(companyId);


  const filteredAssignments = assignments?.filter(assignment => {
    const matchesSearch = assignment.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.employee_matricula?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = benefitTypeFilter === 'all' || assignment.benefit_type === benefitTypeFilter;
    return matchesSearch && matchesType;
  });

  const handleCreateAssignment = () => {
    setEditingAssignment(null);
    setIsModalOpen(true);
  };

  const handleEditAssignment = (assignment: EmployeeBenefitAssignment) => {
    setEditingAssignment(assignment);
    setIsModalOpen(true);
  };

  const getBenefitTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'vr_va': 'VR/VA',
      'transporte': 'Transporte',
      'equipment_rental': 'Locação de Equipamentos',
      'premiacao': 'Premiação'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (assignment: EmployeeBenefitAssignment) => {
    const now = new Date();
    const startDate = new Date(assignment.start_date);
    const endDate = assignment.end_date ? new Date(assignment.end_date) : null;

    if (endDate && endDate < now) {
      return <Badge variant="secondary">Inativo</Badge>;
    } else if (startDate > now) {
      return <Badge variant="outline">Futuro</Badge>;
    } else {
      return <Badge variant="default">Ativo</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Carregando vínculos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Erro ao carregar vínculos: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Vínculos de Funcionários</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os vínculos entre funcionários e benefícios
          </p>
        </div>
        <Button onClick={handleCreateAssignment}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Vínculo
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por funcionário ou matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={benefitTypeFilter} onValueChange={setBenefitTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="vr_va">VR/VA</SelectItem>
                <SelectItem value="transporte">Transporte</SelectItem>
                <SelectItem value="equipment_rental">Locação de Equipamentos</SelectItem>
                <SelectItem value="premiacao">Premiação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Vínculos */}
      <Card>
        <CardHeader>
          <CardTitle>
            Vínculos Ativos ({filteredAssignments?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAssignments && filteredAssignments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Tipo de Benefício</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor/Configuração</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {assignment.employee_name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {assignment.employee_matricula || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {getBenefitTypeLabel(assignment.benefit_type)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Início: {format(new Date(assignment.start_date), 'dd/MM/yyyy', { locale: ptBR })}</div>
                        {assignment.end_date && (
                          <div>Fim: {format(new Date(assignment.end_date), 'dd/MM/yyyy', { locale: ptBR })}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(assignment)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {assignment.criteria_type === 'fixed_value' && assignment.criteria_value && (
                          <span>R$ {parseFloat(assignment.criteria_value).toFixed(2)}</span>
                        )}
                        {assignment.criteria_type === 'percentage' && assignment.criteria_value && (
                          <span>{assignment.criteria_value}%</span>
                        )}
                        {assignment.criteria_type === 'geral' && (
                          <span className="text-muted-foreground">Padrão</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAssignment(assignment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // TODO: Implementar exclusão
                            toast.info('Funcionalidade de exclusão será implementada em breve');
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum vínculo encontrado. Clique em "Novo Vínculo" para criar o primeiro.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Criação/Edição */}
      <AssignmentFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        assignment={editingAssignment}
        companyId={companyId}
        configurations={configurations || []}
        employees={employees || []}
      />
    </div>
  );
}

// Modal de Formulário de Vínculo
interface AssignmentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment?: EmployeeBenefitAssignment | null;
  companyId: string;
  configurations: BenefitConfiguration[];
  employees: any[];
}

function AssignmentFormModal({
  open,
  onOpenChange,
  assignment,
  companyId,
  configurations,
  employees
}: AssignmentFormModalProps) {
  const [formData, setFormData] = useState({
    employee_id: assignment?.employee_id || '',
    benefit_type: assignment?.benefit_type || 'vr_va',
    benefit_config_id: assignment?.benefit_config_id || '',
    criteria_type: assignment?.criteria_type || 'geral',
    criteria_value: assignment?.criteria_value || '',
    start_date: assignment?.start_date ? new Date(assignment.start_date) : new Date(),
    end_date: assignment?.end_date ? new Date(assignment.end_date) : undefined,
  });

  const { createAssignment, updateAssignment } = useEmployeeBenefitAssignments(companyId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const assignmentData: EmployeeBenefitAssignmentInsert = {
        employee_id: formData.employee_id,
        company_id: companyId,
        benefit_type: formData.benefit_type,
        benefit_config_id: formData.benefit_config_id || undefined,
        criteria_type: formData.criteria_type,
        criteria_value: formData.criteria_value || undefined,
        start_date: formData.start_date.toISOString().split('T')[0],
        end_date: formData.end_date?.toISOString().split('T')[0],
        vr_va_config_id: formData.benefit_type === 'vr_va' ? formData.benefit_config_id : undefined,
        transporte_config_id: formData.benefit_type === 'transporte' ? formData.benefit_config_id : undefined,
      };

      if (assignment) {
        await updateAssignment.mutateAsync({ id: assignment.id, updates: assignmentData });
        toast.success('Vínculo atualizado com sucesso!');
      } else {
        await createAssignment.mutateAsync(assignmentData);
        toast.success('Vínculo criado com sucesso!');
      }
      
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao salvar vínculo');
      console.error(error);
    }
  };


  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={assignment ? 'Editar Vínculo' : 'Novo Vínculo'}
      description="Configure o vínculo entre funcionário e benefício"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="employee_id">Funcionário</Label>
            <Select value={formData.employee_id} onValueChange={(value) => setFormData({...formData, employee_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o funcionário" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.nome} - {employee.matricula}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="benefit_config_id">Benefício</Label>
            <Select value={formData.benefit_config_id} onValueChange={(value) => {
              const selectedConfig = configurations.find(config => config.id === value);
              setFormData({
                ...formData, 
                benefit_config_id: value,
                benefit_type: selectedConfig?.benefit_type || '',
                criteria_type: selectedConfig?.calculation_type || ''
              });
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o benefício" />
              </SelectTrigger>
              <SelectContent>
                {configurations.map((config) => (
                  <SelectItem key={config.id} value={config.id}>
                    {config.name} ({config.benefit_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>


        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date">Data de Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.start_date ? format(formData.start_date, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.start_date}
                  onSelect={(date) => date && setFormData({...formData, start_date: date})}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="end_date">Data de Fim (Opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.end_date ? format(formData.end_date, 'dd/MM/yyyy', { locale: ptBR }) : 'Sem data de fim'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.end_date}
                  onSelect={(date) => setFormData({...formData, end_date: date})}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createAssignment.isPending || updateAssignment.isPending}>
            {assignment ? 'Atualizar' : 'Criar'} Vínculo
          </Button>
        </div>
      </form>
    </FormModal>
  );
}