import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BeneficioElegibilidade, BeneficioElegibilidadeInsert, BeneficioElegibilidadeUpdate, BeneficioTipo } from '@/integrations/supabase/rh-types';
import { usePositions } from '@/hooks/rh/usePositions';
import { useDepartments } from '@/hooks/rh';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Users, Target, Calendar } from 'lucide-react';

const elegibilidadeSchema = z.object({
  beneficio_tipo_id: z.string().min(1, 'Tipo de benefício é obrigatório'),
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  descricao: z.string().optional(),
  tipo_regra: z.enum(['cargo', 'departamento', 'ambos', 'todos']),
  criterios: z.record(z.any()).optional(),
  is_active: z.boolean().default(true),
  data_inicio: z.string().min(1, 'Data de início é obrigatória'),
  data_fim: z.string().optional(),
  company_id: z.string().min(1, 'ID da empresa é obrigatório'),
  cargos_selecionados: z.array(z.string()).optional(),
  departamentos_selecionados: z.array(z.string()).optional(),
});

type ElegibilidadeFormData = z.infer<typeof elegibilidadeSchema>;

interface ElegibilidadeFormProps {
  initialData?: BeneficioElegibilidade;
  onSubmit: (data: BeneficioElegibilidadeInsert | BeneficioElegibilidadeUpdate) => void;
  onCancel: () => void;
  isLoading?: boolean;
  companyId: string;
  beneficioTipos: BeneficioTipo[];
}

export function ElegibilidadeForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  companyId,
  beneficioTipos 
}: ElegibilidadeFormProps) {
  const [cargosSelecionados, setCargosSelecionados] = useState<string[]>([]);
  const [departamentosSelecionados, setDepartamentosSelecionados] = useState<string[]>([]);
  const isEditing = !!initialData;

  const {
    positions,
    isLoading: isLoadingPositions,
  } = usePositions(companyId);

  const {
    departments,
    isLoading: isLoadingDepartments,
  } = useDepartments(companyId);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<ElegibilidadeFormData>({
    resolver: zodResolver(elegibilidadeSchema),
    defaultValues: {
      beneficio_tipo_id: initialData?.beneficio_tipo_id || '',
      nome: initialData?.nome || '',
      descricao: initialData?.descricao || '',
      tipo_regra: (initialData?.tipo_regra as any) || 'cargo',
      criterios: initialData?.criterios || {},
      is_active: initialData?.is_active ?? true,
      data_inicio: initialData?.data_inicio || '',
      data_fim: initialData?.data_fim || '',
      company_id: companyId,
      cargos_selecionados: [],
      departamentos_selecionados: [],
    },
  });

  const watchedTipoRegra = watch('tipo_regra');
  const watchedIsActive = watch('is_active');

  // Carregar dados iniciais se estiver editando
  useEffect(() => {
    if (initialData) {
      // Carregar cargos e departamentos selecionados
      if (initialData.beneficio_elegibilidade_cargos) {
        const cargos = initialData.beneficio_elegibilidade_cargos.map((c: any) => c.position_id);
        setCargosSelecionados(cargos);
        setValue('cargos_selecionados', cargos);
      }
      if (initialData.beneficio_elegibilidade_departamentos) {
        const departamentos = initialData.beneficio_elegibilidade_departamentos.map((d: any) => d.department_id);
        setDepartamentosSelecionados(departamentos);
        setValue('departamentos_selecionados', departamentos);
      }
    }
  }, [initialData, setValue]);

  const handleFormSubmit = (data: ElegibilidadeFormData) => {
    const formData = {
      ...data,
      criterios: {
        cargos: cargosSelecionados,
        departamentos: departamentosSelecionados,
      },
    };

    if (isEditing) {
      onSubmit({
        ...formData,
        id: initialData.id,
        updated_at: new Date().toISOString(),
      } as BeneficioElegibilidadeUpdate);
    } else {
      onSubmit({
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as BeneficioElegibilidadeInsert);
    }
  };

  const handleCargoToggle = (cargoId: string, checked: boolean) => {
    if (checked) {
      const newCargos = [...cargosSelecionados, cargoId];
      setCargosSelecionados(newCargos);
      setValue('cargos_selecionados', newCargos);
    } else {
      const newCargos = cargosSelecionados.filter(id => id !== cargoId);
      setCargosSelecionados(newCargos);
      setValue('cargos_selecionados', newCargos);
    }
  };

  const handleDepartamentoToggle = (departamentoId: string, checked: boolean) => {
    if (checked) {
      const newDepartamentos = [...departamentosSelecionados, departamentoId];
      setDepartamentosSelecionados(newDepartamentos);
      setValue('departamentos_selecionados', newDepartamentos);
    } else {
      const newDepartamentos = departamentosSelecionados.filter(id => id !== departamentoId);
      setDepartamentosSelecionados(newDepartamentos);
      setValue('departamentos_selecionados', newDepartamentos);
    }
  };

  const getTipoRegraLabel = (tipo: string) => {
    switch (tipo) {
      case 'cargo':
        return 'Por Cargo';
      case 'departamento':
        return 'Por Departamento';
      case 'ambos':
        return 'Cargo + Departamento';
      case 'todos':
        return 'Todos os Funcionários';
      default:
        return tipo;
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="beneficio_tipo_id">Tipo de Benefício *</Label>
              <Select
                value={watch('beneficio_tipo_id')}
                onValueChange={(value) => setValue('beneficio_tipo_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de benefício" />
                </SelectTrigger>
                <SelectContent>
                  {beneficioTipos.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.nome} - {tipo.categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.beneficio_tipo_id && (
                <p className="text-sm text-destructive">{errors.beneficio_tipo_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Regra *</Label>
              <Input
                id="nome"
                {...register('nome')}
                placeholder="Ex: Elegibilidade Convênios - Gerentes"
                className={errors.nome ? 'border-destructive' : ''}
              />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_regra">Tipo de Regra *</Label>
              <Select
                value={watchedTipoRegra}
                onValueChange={(value) => setValue('tipo_regra', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de regra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cargo">Por Cargo</SelectItem>
                  <SelectItem value="departamento">Por Departamento</SelectItem>
                  <SelectItem value="ambos">Cargo + Departamento</SelectItem>
                  <SelectItem value="todos">Todos os Funcionários</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo_regra && (
                <p className="text-sm text-destructive">{errors.tipo_regra.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                {...register('descricao')}
                placeholder="Descrição da regra de elegibilidade"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Período de Vigência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Período de Vigência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data de Início *</Label>
              <Input
                id="data_inicio"
                type="date"
                {...register('data_inicio')}
                className={errors.data_inicio ? 'border-destructive' : ''}
              />
              {errors.data_inicio && (
                <p className="text-sm text-destructive">{errors.data_inicio.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_fim">Data de Fim</Label>
              <Input
                id="data_fim"
                type="date"
                {...register('data_fim')}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco para vigência indefinida
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={watchedIsActive}
                onCheckedChange={(checked) => setValue('is_active', checked)}
              />
              <Label htmlFor="is_active">Regra ativa</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Regras inativas não são aplicadas aos funcionários
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seleção de Cargos */}
      {(watchedTipoRegra === 'cargo' || watchedTipoRegra === 'ambos') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Cargos Elegíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {positions.map((cargo) => (
                <div key={cargo.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cargo-${cargo.id}`}
                    checked={cargosSelecionados.includes(cargo.id)}
                    onCheckedChange={(checked) => handleCargoToggle(cargo.id, checked as boolean)}
                  />
                  <Label htmlFor={`cargo-${cargo.id}`} className="text-sm">
                    {cargo.nome}
                  </Label>
                </div>
              ))}
            </div>
            {isLoadingPositions && (
              <p className="text-sm text-muted-foreground">Carregando cargos...</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Seleção de Departamentos */}
      {(watchedTipoRegra === 'departamento' || watchedTipoRegra === 'ambos') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Departamentos Elegíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments.map((departamento) => (
                <div key={departamento.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`departamento-${departamento.id}`}
                    checked={departamentosSelecionados.includes(departamento.id)}
                    onCheckedChange={(checked) => handleDepartamentoToggle(departamento.id, checked as boolean)}
                  />
                  <Label htmlFor={`departamento-${departamento.id}`} className="text-sm">
                    {departamento.nome}
                  </Label>
                </div>
              ))}
            </div>
            {isLoadingDepartments && (
              <p className="text-sm text-muted-foreground">Carregando departamentos...</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resumo da Regra */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Resumo da Regra
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Tipo de Regra:</strong> {getTipoRegraLabel(watchedTipoRegra)}
            </p>
            {watchedTipoRegra === 'cargo' && (
              <p className="text-sm">
                <strong>Cargos Selecionados:</strong> {cargosSelecionados.length} cargo(s)
              </p>
            )}
            {watchedTipoRegra === 'departamento' && (
              <p className="text-sm">
                <strong>Departamentos Selecionados:</strong> {departamentosSelecionados.length} departamento(s)
              </p>
            )}
            {watchedTipoRegra === 'ambos' && (
              <p className="text-sm">
                <strong>Cargos:</strong> {cargosSelecionados.length} | <strong>Departamentos:</strong> {departamentosSelecionados.length}
              </p>
            )}
            {watchedTipoRegra === 'todos' && (
              <p className="text-sm text-green-600">
                <strong>Todos os funcionários serão elegíveis para este benefício</strong>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={!isValid || isLoading}
        >
          {isLoading ? 'Salvando...' : isEditing ? 'Atualizar Regra' : 'Criar Regra'}
        </Button>
      </div>
    </form>
  );
}
