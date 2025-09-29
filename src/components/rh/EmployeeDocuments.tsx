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
import { CalendarIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EmployeeDocument, EmployeeDocumentInsert, EmployeeDocumentUpdate } from '@/integrations/supabase/rh-types';

// Schema de validação
const documentSchema = z.object({
  carteira_trabalho_numero: z.string().optional(),
  carteira_trabalho_serie: z.string().optional(),
  carteira_trabalho_uf: z.string().optional(),
  carteira_trabalho_data_emissao: z.date().optional(),
  titulo_eleitoral_numero: z.string().optional(),
  titulo_eleitoral_zona: z.string().optional(),
  titulo_eleitoral_secao: z.string().optional(),
  titulo_eleitoral_uf: z.string().optional(),
  carteira_reservista_numero: z.string().optional(),
  carteira_reservista_serie: z.string().optional(),
  carteira_reservista_categoria: z.string().optional(),
  carteira_motorista_numero: z.string().optional(),
  carteira_motorista_categoria: z.string().optional(),
  carteira_motorista_data_vencimento: z.date().optional(),
  cartao_pis_numero: z.string().optional(),
  cartao_pis_data_emissao: z.date().optional(),
});

type DocumentFormData = z.infer<typeof documentSchema>;

export interface EmployeeDocumentsProps {
  employeeId: string;
  documents?: EmployeeDocument[];
  onSubmit: (data: EmployeeDocumentInsert | EmployeeDocumentUpdate) => Promise<void>;
  onDelete?: (documentId: string) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export function EmployeeDocuments({
  employeeId,
  documents = [],
  onSubmit,
  onDelete,
  loading = false,
  className = '',
}: EmployeeDocumentsProps) {
  const [selectedWorkCardDate, setSelectedWorkCardDate] = useState<Date | undefined>();
  const [selectedDriverCardDate, setSelectedDriverCardDate] = useState<Date | undefined>();
  const [selectedPisCardDate, setSelectedPisCardDate] = useState<Date | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      carteira_trabalho_numero: '',
      carteira_trabalho_serie: '',
      carteira_trabalho_uf: '',
      titulo_eleitoral_numero: '',
      titulo_eleitoral_zona: '',
      titulo_eleitoral_secao: '',
      titulo_eleitoral_uf: '',
      carteira_reservista_numero: '',
      carteira_reservista_serie: '',
      carteira_reservista_categoria: '',
      carteira_motorista_numero: '',
      carteira_motorista_categoria: '',
      cartao_pis_numero: '',
    },
  });

  // Atualizar valores quando as datas mudarem
  React.useEffect(() => {
    if (selectedWorkCardDate) {
      setValue('carteira_trabalho_data_emissao', selectedWorkCardDate);
    }
    if (selectedDriverCardDate) {
      setValue('carteira_motorista_data_vencimento', selectedDriverCardDate);
    }
    if (selectedPisCardDate) {
      setValue('cartao_pis_data_emissao', selectedPisCardDate);
    }
  }, [selectedWorkCardDate, selectedDriverCardDate, selectedPisCardDate, setValue]);

  const handleFormSubmit = async (data: DocumentFormData) => {
    try {
      const documentData: EmployeeDocumentInsert = {
        employee_id: employeeId,
        company_id: '', // Será preenchido pelo hook
        ...data,
        carteira_trabalho_data_emissao: data.carteira_trabalho_data_emissao?.toISOString(),
        carteira_motorista_data_vencimento: data.carteira_motorista_data_vencimento?.toISOString(),
        cartao_pis_data_emissao: data.cartao_pis_data_emissao?.toISOString(),
      };
      await onSubmit(documentData);
      reset();
    } catch (error) {
      console.error('Erro ao salvar documentos:', error);
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const formatted = formatCPF(e.target.value);
    setValue(field as any, formatted.replace(/\D/g, ''));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Documentos Pessoais
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Carteira de Trabalho */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Carteira de Trabalho</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carteira_trabalho_numero">Número</Label>
                <Input
                  id="carteira_trabalho_numero"
                  {...register('carteira_trabalho_numero')}
                  placeholder="0000000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carteira_trabalho_serie">Série</Label>
                <Input
                  id="carteira_trabalho_serie"
                  {...register('carteira_trabalho_serie')}
                  placeholder="0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carteira_trabalho_uf">UF</Label>
                <Input
                  id="carteira_trabalho_uf"
                  {...register('carteira_trabalho_uf')}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Data de Emissão</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !selectedWorkCardDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedWorkCardDate ? (
                        format(selectedWorkCardDate, 'dd/MM/yyyy', { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedWorkCardDate}
                      onSelect={setSelectedWorkCardDate}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Título Eleitoral */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Título Eleitoral</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="titulo_eleitoral_numero">Número</Label>
                <Input
                  id="titulo_eleitoral_numero"
                  {...register('titulo_eleitoral_numero')}
                  placeholder="000000000000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="titulo_eleitoral_zona">Zona</Label>
                <Input
                  id="titulo_eleitoral_zona"
                  {...register('titulo_eleitoral_zona')}
                  placeholder="0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="titulo_eleitoral_secao">Seção</Label>
                <Input
                  id="titulo_eleitoral_secao"
                  {...register('titulo_eleitoral_secao')}
                  placeholder="0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="titulo_eleitoral_uf">UF</Label>
                <Input
                  id="titulo_eleitoral_uf"
                  {...register('titulo_eleitoral_uf')}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {/* Carteira de Reservista */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Carteira de Reservista</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carteira_reservista_numero">Número</Label>
                <Input
                  id="carteira_reservista_numero"
                  {...register('carteira_reservista_numero')}
                  placeholder="000000000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carteira_reservista_serie">Série</Label>
                <Input
                  id="carteira_reservista_serie"
                  {...register('carteira_reservista_serie')}
                  placeholder="0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carteira_reservista_categoria">Categoria</Label>
                <Input
                  id="carteira_reservista_categoria"
                  {...register('carteira_reservista_categoria')}
                  placeholder="Ex: Dispensado"
                />
              </div>
            </div>
          </div>

          {/* Carteira de Motorista */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Carteira de Motorista</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carteira_motorista_numero">Número</Label>
                <Input
                  id="carteira_motorista_numero"
                  {...register('carteira_motorista_numero')}
                  placeholder="00000000000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carteira_motorista_categoria">Categoria</Label>
                <Input
                  id="carteira_motorista_categoria"
                  {...register('carteira_motorista_categoria')}
                  placeholder="Ex: B, C, D"
                />
              </div>

              <div className="space-y-2">
                <Label>Data de Vencimento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !selectedDriverCardDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDriverCardDate ? (
                        format(selectedDriverCardDate, 'dd/MM/yyyy', { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDriverCardDate}
                      onSelect={setSelectedDriverCardDate}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Cartão PIS */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Cartão PIS</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cartao_pis_numero">Número</Label>
                <Input
                  id="cartao_pis_numero"
                  {...register('cartao_pis_numero')}
                  placeholder="000.00000.00-0"
                />
              </div>

              <div className="space-y-2">
                <Label>Data de Emissão</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !selectedPisCardDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedPisCardDate ? (
                        format(selectedPisCardDate, 'dd/MM/yyyy', { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedPisCardDate}
                      onSelect={setSelectedPisCardDate}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
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
                'Salvar Documentos'
              )}
            </Button>
          </div>
        </form>

        {/* Lista de Documentos Existentes */}
        {documents.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Documentos Cadastrados</h3>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {doc.carteira_trabalho_numero && `CTPS: ${doc.carteira_trabalho_numero}`}
                      {doc.titulo_eleitoral_numero && ` | Título: ${doc.titulo_eleitoral_numero}`}
                      {doc.carteira_motorista_numero && ` | CNH: ${doc.carteira_motorista_numero}`}
                      {doc.cartao_pis_numero && ` | PIS: ${doc.cartao_pis_numero}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {doc.created_at && new Date(doc.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  {onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(doc.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}




