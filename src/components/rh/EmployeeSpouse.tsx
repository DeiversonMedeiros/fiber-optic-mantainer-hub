// @ts-nocheck
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Heart, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EmployeeSpouse, EmployeeSpouseInsert, EmployeeSpouseUpdate } from '@/integrations/supabase/rh-types';

// Schema de validação
const spouseSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos').optional().or(z.literal('')),
  rg: z.string().optional(),
  data_nascimento: z.date().optional(),
  certidao_casamento_numero: z.string().optional(),
  certidao_casamento_data: z.date().optional(),
  certidao_casamento_cartorio: z.string().optional(),
  certidao_casamento_uf: z.string().max(2, 'UF deve ter 2 caracteres').optional(),
  uniao_estavel_data: z.date().optional(),
  uniao_estavel_cartorio: z.string().optional(),
  uniao_estavel_uf: z.string().max(2, 'UF deve ter 2 caracteres').optional(),
});

type SpouseFormData = z.infer<typeof spouseSchema>;

export interface EmployeeSpouseProps {
  employeeId: string;
  spouse?: EmployeeSpouse;
  onSubmit: (data: EmployeeSpouseInsert | EmployeeSpouseUpdate) => Promise<void>;
  onDelete?: (spouseId: string) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export function EmployeeSpouse({
  employeeId,
  spouse,
  onSubmit,
  onDelete,
  loading = false,
  className = '',
}: EmployeeSpouseProps) {
  const [selectedBirthDate, setSelectedBirthDate] = useState<Date | undefined>(
    spouse?.data_nascimento ? new Date(spouse.data_nascimento) : undefined
  );
  const [selectedMarriageDate, setSelectedMarriageDate] = useState<Date | undefined>(
    spouse?.certidao_casamento_data ? new Date(spouse.certidao_casamento_data) : undefined
  );
  const [selectedUnionDate, setSelectedUnionDate] = useState<Date | undefined>(
    spouse?.uniao_estavel_data ? new Date(spouse.uniao_estavel_data) : undefined
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
  } = useForm<SpouseFormData>({
    resolver: zodResolver(spouseSchema),
    defaultValues: {
      nome: spouse?.nome || '',
      cpf: spouse?.cpf || '',
      rg: spouse?.rg || '',
      certidao_casamento_numero: spouse?.certidao_casamento_numero || '',
      certidao_casamento_cartorio: spouse?.certidao_casamento_cartorio || '',
      certidao_casamento_uf: spouse?.certidao_casamento_uf || '',
      uniao_estavel_cartorio: spouse?.uniao_estavel_cartorio || '',
      uniao_estavel_uf: spouse?.uniao_estavel_uf || '',
    },
  });

  // Atualizar valores quando as datas mudarem
  React.useEffect(() => {
    if (selectedBirthDate) {
      setValue('data_nascimento', selectedBirthDate);
    }
    if (selectedMarriageDate) {
      setValue('certidao_casamento_data', selectedMarriageDate);
    }
    if (selectedUnionDate) {
      setValue('uniao_estavel_data', selectedUnionDate);
    }
  }, [selectedBirthDate, selectedMarriageDate, selectedUnionDate, setValue]);

  const handleFormSubmit = async (data: SpouseFormData) => {
    try {
      const spouseData: EmployeeSpouseInsert = {
        employee_id: employeeId,
        company_id: '', // Será preenchido pelo hook
        ...data,
        data_nascimento: data.data_nascimento?.toISOString(),
        certidao_casamento_data: data.certidao_casamento_data?.toISOString(),
        uniao_estavel_data: data.uniao_estavel_data?.toISOString(),
      };
      await onSubmit(spouseData);
      reset();
    } catch (error) {
      console.error('Erro ao salvar informações do cônjuge:', error);
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

  const ufOptions = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Informações do Cônjuge
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  {...register('nome')}
                  placeholder="Nome completo do cônjuge"
                  className={errors.nome ? 'border-destructive' : ''}
                />
                {errors.nome && (
                  <p className="text-sm text-destructive">{errors.nome.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
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
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  {...register('rg')}
                  placeholder="Número do RG"
                />
              </div>

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
            </div>
          </div>

          {/* Certidão de Casamento */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Certidão de Casamento</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="certidao_casamento_numero">Número da Certidão</Label>
                <Input
                  id="certidao_casamento_numero"
                  {...register('certidao_casamento_numero')}
                  placeholder="Número da certidão"
                />
              </div>

              <div className="space-y-2">
                <Label>Data do Casamento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !selectedMarriageDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedMarriageDate ? (
                        format(selectedMarriageDate, 'dd/MM/yyyy', { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedMarriageDate}
                      onSelect={setSelectedMarriageDate}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certidao_casamento_cartorio">Cartório</Label>
                <Input
                  id="certidao_casamento_cartorio"
                  {...register('certidao_casamento_cartorio')}
                  placeholder="Nome do cartório"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certidao_casamento_uf">UF</Label>
                <select
                  id="certidao_casamento_uf"
                  {...register('certidao_casamento_uf')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecione a UF</option>
                  {ufOptions.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* União Estável */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">União Estável</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data da União Estável</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !selectedUnionDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedUnionDate ? (
                        format(selectedUnionDate, 'dd/MM/yyyy', { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedUnionDate}
                      onSelect={setSelectedUnionDate}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="uniao_estavel_cartorio">Cartório</Label>
                <Input
                  id="uniao_estavel_cartorio"
                  {...register('uniao_estavel_cartorio')}
                  placeholder="Nome do cartório"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="uniao_estavel_uf">UF</Label>
                <select
                  id="uniao_estavel_uf"
                  {...register('uniao_estavel_uf')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecione a UF</option>
                  {ufOptions.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>
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
                spouse ? 'Atualizar' : 'Salvar'
              )}
            </Button>
          </div>
        </form>

        {/* Informações do Cônjuge Existente */}
        {spouse && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Informações Cadastradas</h3>
            <div className="p-3 border rounded-lg">
              <div className="space-y-2">
                <p className="font-medium">
                  {spouse.nome || 'Nome não informado'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {spouse.cpf && `CPF: ${spouse.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}`}
                  {spouse.rg && ` | RG: ${spouse.rg}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {spouse.data_nascimento && 
                    `Nascimento: ${new Date(spouse.data_nascimento).toLocaleDateString('pt-BR')}`
                  }
                </p>
                {spouse.certidao_casamento_numero && (
                  <p className="text-sm text-muted-foreground">
                    Casamento: {spouse.certidao_casamento_numero}
                    {spouse.certidao_casamento_data && 
                      ` em ${new Date(spouse.certidao_casamento_data).toLocaleDateString('pt-BR')}`
                    }
                  </p>
                )}
                {spouse.uniao_estavel_data && (
                  <p className="text-sm text-muted-foreground">
                    União Estável: {new Date(spouse.uniao_estavel_data).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
              {onDelete && (
                <div className="mt-3 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(spouse.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remover Informações
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}




