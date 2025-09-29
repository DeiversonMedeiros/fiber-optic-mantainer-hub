import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Employee, EmployeeInsert, EmployeeUpdate } from '@/integrations/supabase/rh-types';
import { usePositions, useWorkShifts, useDepartments } from '@/hooks/rh';
import { useCostCenters } from '@/hooks/useCostCenters';
import { useProjects } from '@/hooks/useProjects';

// Schema de validação
const employeeSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  matricula: z.string().optional(),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos').optional().or(z.literal('')),
  rg: z.string().optional(),
  data_nascimento: z.date().optional(),
  data_admissao: z.date().optional(),
  data_demissao: z.date().optional(),
  status: z.enum(['ativo', 'inativo', 'demitido', 'aposentado', 'licenca']).default('ativo'),
  cost_center_id: z.string().optional(),
  project_id: z.string().optional(),
  // Novos campos
  position_id: z.string().optional(),
  work_shift_id: z.string().optional(),
  department_id: z.string().optional(),
  manager_id: z.string().optional(),
  salario_base: z.number().min(0, 'Salário deve ser positivo').optional(),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  estado_civil: z.string().optional(),
  nacionalidade: z.string().optional(),
  naturalidade: z.string().optional(),
  nome_mae: z.string().optional(),
  nome_pai: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export interface EmployeeFormProps {
  employee?: Employee;
  companyId?: string;
  onSubmit: (data: EmployeeInsert | EmployeeUpdate) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  className?: string;
  showButtons?: boolean; // Nova prop para controlar se deve mostrar os botões
}

export function EmployeeForm({
  employee,
  companyId,
  onSubmit,
  onCancel,
  loading = false,
  className = '',
  showButtons = true, // Por padrão, mostra os botões
}: EmployeeFormProps) {
  const [selectedBirthDate, setSelectedBirthDate] = useState<Date | undefined>(
    employee?.data_nascimento ? new Date(employee.data_nascimento) : undefined
  );
  const [selectedAdmissionDate, setSelectedAdmissionDate] = useState<Date | undefined>(
    employee?.data_admissao ? new Date(employee.data_admissao) : undefined
  );
  const [selectedDismissalDate, setSelectedDismissalDate] = useState<Date | undefined>(
    employee?.data_demissao ? new Date(employee.data_demissao) : undefined
  );

  const { positions = [] } = usePositions(companyId);
  const { workShifts = [] } = useWorkShifts(companyId);
  const { departments = [] } = useDepartments(companyId);
  const { data: costCenters = [], isLoading: costCentersLoading } = useCostCenters(companyId);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    mode: 'onChange', // Adicionar validação em tempo real
    defaultValues: {
      nome: employee?.nome || '',
      matricula: employee?.matricula || '',
      cpf: employee?.cpf || '',
      rg: employee?.rg || '',
      status: employee?.status || 'ativo',
      cost_center_id: employee?.cost_center_id || '',
      project_id: employee?.project_id || '',
      // Novos campos
      position_id: employee?.position_id || '',
      work_shift_id: employee?.work_shift_id || '',
      department_id: employee?.department_id || '',
      manager_id: employee?.manager_id || '',
      salario_base: employee?.salario_base || undefined,
      telefone: employee?.telefone || '',
      email: employee?.email || '',
      estado_civil: employee?.estado_civil || '',
      nacionalidade: employee?.nacionalidade || '',
      naturalidade: employee?.naturalidade || '',
      nome_mae: employee?.nome_mae || '',
      nome_pai: employee?.nome_pai || '',
    },
  });

  // Hook de projetos que depende do watch - deve vir após a inicialização do useForm
  const { data: projects = [], isLoading: projectsLoading } = useProjects(companyId, watch('cost_center_id'));

  const watchedStatus = watch('status');

  // Atualizar valores quando as datas mudarem
  useEffect(() => {
    if (selectedBirthDate) {
      setValue('data_nascimento', selectedBirthDate);
    }
    if (selectedAdmissionDate) {
      setValue('data_admissao', selectedAdmissionDate);
    }
    if (selectedDismissalDate) {
      setValue('data_demissao', selectedDismissalDate);
    }
  }, [selectedBirthDate, selectedAdmissionDate, selectedDismissalDate, setValue]);

  const handleFormSubmit = async (data: EmployeeFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setValue('cpf', formatted.replace(/\D/g, ''));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  {...register('nome')}
                  placeholder="Digite o nome completo"
                  className={errors.nome ? 'border-destructive' : ''}
                />
                {errors.nome && (
                  <p className="text-sm text-destructive">{errors.nome.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula</Label>
                <Input
                  id="matricula"
                  {...register('matricula')}
                  placeholder="Digite a matrícula"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={watch('cpf')}
                  onChange={handleCPFChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
                {errors.cpf && (
                  <p className="text-sm text-destructive">{errors.cpf.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  {...register('rg')}
                  placeholder="Digite o RG"
                />
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Datas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !selectedBirthDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedBirthDate ? (
                        format(selectedBirthDate, 'dd/MM/yyyy', { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedBirthDate}
                      onSelect={setSelectedBirthDate}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Data de Admissão</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !selectedAdmissionDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedAdmissionDate ? (
                        format(selectedAdmissionDate, 'dd/MM/yyyy', { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedAdmissionDate}
                      onSelect={setSelectedAdmissionDate}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Data de Demissão</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !selectedDismissalDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDismissalDate ? (
                        format(selectedDismissalDate, 'dd/MM/yyyy', { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDismissalDate}
                      onSelect={setSelectedDismissalDate}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Informações Pessoais Adicionais */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Informações Pessoais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  {...register('telefone')}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="email@exemplo.com"
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado_civil">Estado Civil</Label>
                <Select
                  value={watch('estado_civil')}
                  onValueChange={(value) => setValue('estado_civil', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado civil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                    <SelectItem value="casado">Casado(a)</SelectItem>
                    <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                    <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                    <SelectItem value="uniao_estavel">União Estável</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nacionalidade">Nacionalidade</Label>
                <Input
                  id="nacionalidade"
                  {...register('nacionalidade')}
                  placeholder="Ex: Brasileira"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="naturalidade">Naturalidade</Label>
                <Input
                  id="naturalidade"
                  {...register('naturalidade')}
                  placeholder="Cidade de nascimento"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome_mae">Nome da Mãe</Label>
                <Input
                  id="nome_mae"
                  {...register('nome_mae')}
                  placeholder="Nome completo da mãe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome_pai">Nome do Pai</Label>
                <Input
                  id="nome_pai"
                  {...register('nome_pai')}
                  placeholder="Nome completo do pai"
                />
              </div>
            </div>
          </div>

          {/* Informações Profissionais */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Informações Profissionais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position_id">Cargo</Label>
                <Select
                  value={watch('position_id')}
                  onValueChange={(value) => setValue('position_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position) => (
                      <SelectItem key={position.id} value={position.id}>
                        {position.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="work_shift_id">Turno de Trabalho</Label>
                <Select
                  value={watch('work_shift_id')}
                  onValueChange={(value) => setValue('work_shift_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o turno" />
                  </SelectTrigger>
                  <SelectContent>
                    {workShifts.map((shift) => (
                      <SelectItem key={shift.id} value={shift.id}>
                        {shift.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department_id">Departamento</Label>
                <Select
                  value={watch('department_id')}
                  onValueChange={(value) => setValue('department_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salario_base">Salário Base</Label>
                <Input
                  id="salario_base"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('salario_base', { valueAsNumber: true })}
                  placeholder="0,00"
                  className={errors.salario_base ? 'border-destructive' : ''}
                />
                {errors.salario_base && (
                  <p className="text-sm text-destructive">{errors.salario_base.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Status e Relacionamentos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Status e Relacionamentos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={watchedStatus}
                  onValueChange={(value) => setValue('status', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="demitido">Demitido</SelectItem>
                    <SelectItem value="aposentado">Aposentado</SelectItem>
                    <SelectItem value="licenca">Licença</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost_center_id">Centro de Custo</Label>
                <div className="flex gap-2">
                  <Select
                    value={watch('cost_center_id') || undefined}
                    onValueChange={(value) => setValue('cost_center_id', value)}
                    disabled={costCentersLoading}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={costCentersLoading ? 'Carregando...' : 'Selecionar centro de custo'} />
                    </SelectTrigger>
                    <SelectContent>
                      {costCenters.map((costCenter) => (
                        <SelectItem key={costCenter.id} value={costCenter.id}>
                          {costCenter.codigo} - {costCenter.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {watch('cost_center_id') && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setValue('cost_center_id', '');
                        setValue('project_id', ''); // Limpar projeto também
                      }}
                      className="px-3"
                    >
                      Limpar
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project_id">Projeto</Label>
                <div className="flex gap-2">
                  <Select
                    value={watch('project_id') || undefined}
                    onValueChange={(value) => setValue('project_id', value)}
                    disabled={projectsLoading || !watch('cost_center_id')}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={
                        !watch('cost_center_id') 
                          ? 'Selecione um centro de custo primeiro' 
                          : projectsLoading 
                            ? 'Carregando...' 
                            : 'Selecionar projeto'
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.codigo} - {project.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {watch('project_id') && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('project_id', '')}
                      className="px-3"
                    >
                      Limpar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botões - só mostra se showButtons for true */}
          {showButtons && (
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              )}
              <Button
                type="submit"
                disabled={(!isValid && !isDirty) || loading}
                className="min-w-[100px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  employee ? 'Atualizar' : 'Cadastrar'
                )}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

// Componente para exibir detalhes do funcionário
export function EmployeeDetails({ employee }: { employee: Employee }) {
  if (!employee) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhes do Funcionário</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações Básicas */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b pb-2">Informações Básicas</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
              <p className="text-lg">{employee.nome}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Matrícula</Label>
              <p className="text-lg">{employee.matricula || '-'}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">CPF</Label>
              <p className="text-lg font-mono">
                {employee.cpf ? employee.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '-'}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">RG</Label>
              <p className="text-lg">{employee.rg || '-'}</p>
            </div>
          </div>
        </div>

        {/* Datas */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b pb-2">Datas</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Data de Nascimento</Label>
              <p className="text-lg">
                {employee.data_nascimento ? new Date(employee.data_nascimento).toLocaleDateString('pt-BR') : '-'}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Data de Admissão</Label>
              <p className="text-lg">
                {employee.data_admissao ? new Date(employee.data_admissao).toLocaleDateString('pt-BR') : '-'}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Data de Demissão</Label>
              <p className="text-lg">
                {employee.data_demissao ? new Date(employee.data_demissao).toLocaleDateString('pt-BR') : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Informações Pessoais Adicionais */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b pb-2">Informações Pessoais</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
              <p className="text-lg">{employee.telefone || '-'}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <p className="text-lg">{employee.email || '-'}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Estado Civil</Label>
              <p className="text-lg capitalize">{employee.estado_civil || '-'}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Nacionalidade</Label>
              <p className="text-lg">{employee.nacionalidade || '-'}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Naturalidade</Label>
              <p className="text-lg">{employee.naturalidade || '-'}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Nome da Mãe</Label>
              <p className="text-lg">{employee.nome_mae || '-'}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Nome do Pai</Label>
              <p className="text-lg">{employee.nome_pai || '-'}</p>
            </div>
          </div>
        </div>

        {/* Informações Profissionais */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b pb-2">Informações Profissionais</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Cargo</Label>
              <p className="text-lg">{employee.position_id || '-'}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Turno de Trabalho</Label>
              <p className="text-lg">{employee.work_shift_id || '-'}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Departamento</Label>
              <p className="text-lg">{employee.department_id || '-'}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Salário Base</Label>
              <p className="text-lg">
                {employee.salario_base ? 
                  new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  }).format(employee.salario_base) : '-'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b pb-2">Status</h3>
          
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Status Atual</Label>
            <p className="text-lg capitalize">{employee.status || 'ativo'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}





