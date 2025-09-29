// @ts-nocheck
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, GraduationCap } from 'lucide-react';
import { EmployeeEducation, EmployeeEducationInsert, EmployeeEducationUpdate } from '@/integrations/supabase/rh-types';

// Schema de validação
const educationSchema = z.object({
  nivel_escolaridade: z.string().min(1, 'Nível de escolaridade é obrigatório'),
  curso: z.string().optional(),
  instituicao: z.string().optional(),
  ano_conclusao: z.number().min(1900, 'Ano deve ser maior que 1900').max(new Date().getFullYear() + 10, 'Ano inválido').optional(),
  status_curso: z.string().optional(),
});

type EducationFormData = z.infer<typeof educationSchema>;

export interface EmployeeEducationProps {
  employeeId: string;
  education?: EmployeeEducation[];
  onSubmit: (data: EmployeeEducationInsert | EmployeeEducationUpdate) => Promise<void>;
  onDelete?: (educationId: string) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export function EmployeeEducation({
  employeeId,
  education = [],
  onSubmit,
  onDelete,
  loading = false,
  className = '',
}: EmployeeEducationProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
  } = useForm<EducationFormData>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      nivel_escolaridade: '',
      curso: '',
      instituicao: '',
      ano_conclusao: undefined,
      status_curso: '',
    },
  });

  const handleFormSubmit = async (data: EducationFormData) => {
    try {
      const educationData: EmployeeEducationInsert = {
        employee_id: employeeId,
        company_id: '', // Será preenchido pelo hook
        ...data,
      };
      await onSubmit(educationData);
      reset();
    } catch (error) {
      console.error('Erro ao salvar escolaridade:', error);
    }
  };

  const nivelEscolaridadeOptions = [
    { value: 'fundamental_incompleto', label: 'Ensino Fundamental Incompleto' },
    { value: 'fundamental_completo', label: 'Ensino Fundamental Completo' },
    { value: 'medio_incompleto', label: 'Ensino Médio Incompleto' },
    { value: 'medio_completo', label: 'Ensino Médio Completo' },
    { value: 'superior_incompleto', label: 'Ensino Superior Incompleto' },
    { value: 'superior_completo', label: 'Ensino Superior Completo' },
    { value: 'pos_graduacao', label: 'Pós-Graduação' },
    { value: 'mestrado', label: 'Mestrado' },
    { value: 'doutorado', label: 'Doutorado' },
    { value: 'pos_doutorado', label: 'Pós-Doutorado' },
  ];

  const statusCursoOptions = [
    { value: 'concluido', label: 'Concluído' },
    { value: 'cursando', label: 'Cursando' },
    { value: 'trancado', label: 'Trancado' },
    { value: 'abandonado', label: 'Abandonado' },
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Escolaridade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Nível de Escolaridade */}
          <div className="space-y-2">
            <Label htmlFor="nivel_escolaridade">Nível de Escolaridade *</Label>
            <Select
              value={watch('nivel_escolaridade')}
              onValueChange={(value) => setValue('nivel_escolaridade', value)}
            >
              <SelectTrigger className={errors.nivel_escolaridade ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione o nível de escolaridade" />
              </SelectTrigger>
              <SelectContent>
                {nivelEscolaridadeOptions.map((nivel) => (
                  <SelectItem key={nivel.value} value={nivel.value}>
                    {nivel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.nivel_escolaridade && (
              <p className="text-sm text-destructive">{errors.nivel_escolaridade.message}</p>
            )}
          </div>

          {/* Curso e Instituição */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="curso">Curso</Label>
              <Input
                id="curso"
                {...register('curso')}
                placeholder="Nome do curso"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instituicao">Instituição de Ensino</Label>
              <Input
                id="instituicao"
                {...register('instituicao')}
                placeholder="Nome da instituição"
              />
            </div>
          </div>

          {/* Ano de Conclusão e Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ano_conclusao">Ano de Conclusão</Label>
              <Select
                value={watch('ano_conclusao')?.toString()}
                onValueChange={(value) => setValue('ano_conclusao', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status_curso">Status do Curso</Label>
              <Select
                value={watch('status_curso')}
                onValueChange={(value) => setValue('status_curso', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {statusCursoOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
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
                'Salvar Escolaridade'
              )}
            </Button>
          </div>
        </form>

        {/* Lista de Escolaridade Existente */}
        {education.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Escolaridade Cadastrada</h3>
            <div className="space-y-2">
              {education.map((edu) => {
                const nivelLabel = nivelEscolaridadeOptions.find(n => n.value === edu.nivel_escolaridade)?.label || edu.nivel_escolaridade;
                const statusLabel = statusCursoOptions.find(s => s.value === edu.status_curso)?.label || edu.status_curso;
                
                return (
                  <div key={edu.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {nivelLabel}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {edu.curso && `Curso: ${edu.curso}`}
                        {edu.instituicao && ` | Instituição: ${edu.instituicao}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {edu.ano_conclusao && `Ano: ${edu.ano_conclusao}`}
                        {edu.status_curso && ` | Status: ${statusLabel}`}
                      </p>
                    </div>
                    {onDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(edu.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}




