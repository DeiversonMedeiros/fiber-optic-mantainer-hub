import React, { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Loader2, Plus, Trash2, Edit, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  EmployeeDependent, 
  EmployeeDependentInsert, 
  EmployeeDependentUpdate,
  DependentType,
  KinshipDegree,
  DeficiencyType,
  DeficiencyDegree
} from '@/integrations/supabase/rh-types';

// Schema de validação
const dependentSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  birth_date: z.date(),
  dependent_type_id: z.string().min(1, 'Tipo de dependente é obrigatório'),
  kinship_degree_id: z.string().min(1, 'Grau de parentesco é obrigatório'),
  is_pcd: z.boolean().default(false),
  deficiency_type_id: z.string().optional(),
  deficiency_degree_id: z.string().optional(),
  cid_code: z.string().optional(),
  cid_description: z.string().optional(),
  needs_special_care: z.boolean().default(false),
  special_care_description: z.string().optional(),
  is_ir_dependent: z.boolean().default(true),
  is_health_plan_dependent: z.boolean().default(true),
  is_school_allowance_dependent: z.boolean().default(false),
});

type DependentFormData = z.infer<typeof dependentSchema>;

export interface EmployeeDependentsProps {
  employeeId: string;
  dependents?: EmployeeDependent[];
  dependentTypes?: DependentType[];
  kinshipDegrees?: KinshipDegree[];
  deficiencyTypes?: DeficiencyType[];
  deficiencyDegrees?: DeficiencyDegree[];
  onSubmit: (data: EmployeeDependentInsert | EmployeeDependentUpdate) => Promise<void>;
  onUpdate?: (id: string, data: EmployeeDependentUpdate) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export function EmployeeDependents({
  employeeId,
  dependents = [],
  dependentTypes = [],
  kinshipDegrees = [],
  deficiencyTypes = [],
  deficiencyDegrees = [],
  onSubmit,
  onUpdate,
  onDelete,
  loading = false,
  className = '',
}: EmployeeDependentsProps) {
  const [selectedBirthDate, setSelectedBirthDate] = useState<Date | undefined>();
  const [editingDependent, setEditingDependent] = useState<EmployeeDependent | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
  } = useForm<DependentFormData>({
    resolver: zodResolver(dependentSchema),
    defaultValues: {
      name: '',
      cpf: '',
      is_pcd: false,
      needs_special_care: false,
      is_ir_dependent: true,
      is_health_plan_dependent: true,
      is_school_allowance_dependent: false,
    },
  });

  const watchedIsPcd = watch('is_pcd');
  const watchedNeedsSpecialCare = watch('needs_special_care');

  // Atualizar valores quando a data mudar
  React.useEffect(() => {
    if (selectedBirthDate) {
      setValue('birth_date', selectedBirthDate);
    }
  }, [selectedBirthDate, setValue]);

  // Preencher formulário quando editando
  React.useEffect(() => {
    if (editingDependent) {
      setValue('name', editingDependent.name);
      setValue('cpf', editingDependent.cpf);
      setValue('birth_date', new Date(editingDependent.birth_date));
      setValue('dependent_type_id', editingDependent.dependent_type_id);
      setValue('kinship_degree_id', editingDependent.kinship_degree_id);
      setValue('is_pcd', editingDependent.is_pcd || false);
      setValue('deficiency_type_id', editingDependent.deficiency_type_id || '');
      setValue('deficiency_degree_id', editingDependent.deficiency_degree_id || '');
      setValue('cid_code', editingDependent.cid_code || '');
      setValue('cid_description', editingDependent.cid_description || '');
      setValue('needs_special_care', editingDependent.needs_special_care || false);
      setValue('special_care_description', editingDependent.special_care_description || '');
      setValue('is_ir_dependent', editingDependent.is_ir_dependent || true);
      setValue('is_health_plan_dependent', editingDependent.is_health_plan_dependent || true);
      setValue('is_school_allowance_dependent', editingDependent.is_school_allowance_dependent || false);
      setSelectedBirthDate(new Date(editingDependent.birth_date));
      setIsFormOpen(true);
    }
  }, [editingDependent, setValue]);

  const handleFormSubmit = async (data: DependentFormData) => {
    try {
      const dependentData: EmployeeDependentInsert = {
        employee_id: employeeId,
        company_id: '', // Será preenchido pelo hook
        name: data.name,
        cpf: data.cpf,
        birth_date: data.birth_date.toISOString().split('T')[0],
        dependent_type_id: data.dependent_type_id,
        kinship_degree_id: data.kinship_degree_id,
        is_pcd: data.is_pcd,
        deficiency_type_id: data.deficiency_type_id || null,
        deficiency_degree_id: data.deficiency_degree_id || null,
        cid_code: data.cid_code || null,
        cid_description: data.cid_description || null,
        needs_special_care: data.needs_special_care,
        special_care_description: data.special_care_description || null,
        is_ir_dependent: data.is_ir_dependent,
        is_health_plan_dependent: data.is_health_plan_dependent,
        is_school_allowance_dependent: data.is_school_allowance_dependent,
      };

      if (editingDependent) {
        await onUpdate?.(editingDependent.id, dependentData);
        setEditingDependent(null);
      } else {
        await onSubmit(dependentData);
      }
      
      reset();
      setIsFormOpen(false);
    } catch (error) {
      console.error('Erro ao salvar dependente:', error);
    }
  };

  const handleEdit = (dependent: EmployeeDependent) => {
    setEditingDependent(dependent);
  };

  const handleCancel = () => {
    setEditingDependent(null);
    setIsFormOpen(false);
    reset();
    setSelectedBirthDate(undefined);
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

  const getDependentTypeName = (id: string) => {
    return dependentTypes.find(dt => dt.id === id)?.descricao || 'N/A';
  };

  const getKinshipDegreeName = (id: string) => {
    return kinshipDegrees.find(kd => kd.id === id)?.descricao || 'N/A';
  };

  const getDeficiencyTypeName = (id: string) => {
    return deficiencyTypes.find(dt => dt.id === id)?.descricao || 'N/A';
  };

  const getDeficiencyDegreeName = (id: string) => {
    return deficiencyDegrees.find(dd => dd.id === id)?.descricao || 'N/A';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Dependentes
          </CardTitle>
          <Button
            onClick={() => setIsFormOpen(true)}
            size="sm"
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Dependente
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Formulário */}
        {isFormOpen && (
          <div className="mb-6 p-4 border rounded-lg bg-muted/50">
            <h3 className="text-lg font-medium mb-4">
              {editingDependent ? 'Editar Dependente' : 'Novo Dependente'}
            </h3>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Digite o nome completo"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={watch('cpf')}
                    onChange={handleCPFChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={errors.cpf ? 'border-destructive' : ''}
                  />
                  {errors.cpf && (
                    <p className="text-sm text-destructive">{errors.cpf.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Data de Nascimento *</Label>
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
                  <Label htmlFor="dependent_type_id">Tipo de Dependente *</Label>
                  <Select
                    value={watch('dependent_type_id')}
                    onValueChange={(value) => setValue('dependent_type_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {dependentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kinship_degree_id">Grau de Parentesco *</Label>
                  <Select
                    value={watch('kinship_degree_id')}
                    onValueChange={(value) => setValue('kinship_degree_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o grau" />
                    </SelectTrigger>
                    <SelectContent>
                      {kinshipDegrees.map((degree) => (
                        <SelectItem key={degree.id} value={degree.id}>
                          {degree.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Checkboxes para benefícios */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Benefícios</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_ir_dependent"
                      checked={watch('is_ir_dependent')}
                      onCheckedChange={(checked) => setValue('is_ir_dependent', checked as boolean)}
                    />
                    <Label htmlFor="is_ir_dependent">Dependente IR</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_health_plan_dependent"
                      checked={watch('is_health_plan_dependent')}
                      onCheckedChange={(checked) => setValue('is_health_plan_dependent', checked as boolean)}
                    />
                    <Label htmlFor="is_health_plan_dependent">Plano de Saúde</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_school_allowance_dependent"
                      checked={watch('is_school_allowance_dependent')}
                      onCheckedChange={(checked) => setValue('is_school_allowance_dependent', checked as boolean)}
                    />
                    <Label htmlFor="is_school_allowance_dependent">Auxílio Educação</Label>
                  </div>
                </div>
              </div>

              {/* Informações PCD */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_pcd"
                    checked={watchedIsPcd}
                    onCheckedChange={(checked) => setValue('is_pcd', checked as boolean)}
                  />
                  <Label htmlFor="is_pcd">Pessoa com Deficiência (PCD)</Label>
                </div>

                {watchedIsPcd && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
                    <div className="space-y-2">
                      <Label htmlFor="deficiency_type_id">Tipo de Deficiência</Label>
                      <Select
                        value={watch('deficiency_type_id')}
                        onValueChange={(value) => setValue('deficiency_type_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {deficiencyTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.descricao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deficiency_degree_id">Grau de Deficiência</Label>
                      <Select
                        value={watch('deficiency_degree_id')}
                        onValueChange={(value) => setValue('deficiency_degree_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o grau" />
                        </SelectTrigger>
                        <SelectContent>
                          {deficiencyDegrees.map((degree) => (
                            <SelectItem key={degree.id} value={degree.id}>
                              {degree.descricao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cid_code">Código CID</Label>
                      <Input
                        id="cid_code"
                        {...register('cid_code')}
                        placeholder="Ex: F84.0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cid_description">Descrição CID</Label>
                      <Input
                        id="cid_description"
                        {...register('cid_description')}
                        placeholder="Descrição da deficiência"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="needs_special_care"
                        checked={watchedNeedsSpecialCare}
                        onCheckedChange={(checked) => setValue('needs_special_care', checked as boolean)}
                      />
                      <Label htmlFor="needs_special_care">Necessita Cuidados Especiais</Label>
                    </div>

                    {watchedNeedsSpecialCare && (
                      <div className="space-y-2">
                        <Label htmlFor="special_care_description">Descrição dos Cuidados</Label>
                        <Input
                          id="special_care_description"
                          {...register('special_care_description')}
                          placeholder="Descreva os cuidados necessários"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!isValid || loading}
                  className="min-w-[100px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingDependent ? 'Atualizar' : 'Adicionar'
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Dependentes */}
        {dependents.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Dependentes Cadastrados</h3>
            <div className="space-y-2">
              {dependents.map((dependent) => (
                <div key={dependent.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{dependent.name}</h4>
                      <Badge variant="outline">
                        {getDependentTypeName(dependent.dependent_type_id)}
                      </Badge>
                      <Badge variant="secondary">
                        {getKinshipDegreeName(dependent.kinship_degree_id)}
                      </Badge>
                      {dependent.is_pcd && (
                        <Badge variant="destructive">PCD</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>CPF: {dependent.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</p>
                      <p>Nascimento: {new Date(dependent.birth_date).toLocaleDateString('pt-BR')}</p>
                      {dependent.is_pcd && (
                        <p>Deficiência: {getDeficiencyTypeName(dependent.deficiency_type_id || '')} - {getDeficiencyDegreeName(dependent.deficiency_degree_id || '')}</p>
                      )}
                      <div className="flex gap-4">
                        {dependent.is_ir_dependent && <span className="text-green-600">✓ IR</span>}
                        {dependent.is_health_plan_dependent && <span className="text-blue-600">✓ Saúde</span>}
                        {dependent.is_school_allowance_dependent && <span className="text-purple-600">✓ Educação</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(dependent)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {onDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(dependent.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum dependente cadastrado</p>
            <p className="text-sm">Clique em "Adicionar Dependente" para começar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

