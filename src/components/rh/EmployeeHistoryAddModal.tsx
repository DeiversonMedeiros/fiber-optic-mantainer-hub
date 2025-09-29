import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMovementTypes, useCreateHistoryEntry } from '@/hooks/rh/useEmployeeHistory';
import { EmployeeHistoryInsert } from '@/integrations/supabase/rh-history-types';
import { useToast } from '@/hooks/use-toast';

const historyEntrySchema = z.object({
  movement_type_id: z.string().min(1, 'Tipo de movimentação é obrigatório'),
  effective_date: z.date({ required_error: 'Data de efetivação é obrigatória' }),
  reason: z.string().optional(),
  description: z.string().optional(),
  attachment_url: z.string().url().optional().or(z.literal('')),
});

type HistoryEntryFormData = z.infer<typeof historyEntrySchema>;

interface EmployeeHistoryAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  companyId: string;
}

export function EmployeeHistoryAddModal({
  isOpen,
  onClose,
  employeeId,
  companyId,
}: EmployeeHistoryAddModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();
  
  const { data: movementTypes = [] } = useMovementTypes();
  const createHistoryEntry = useCreateHistoryEntry();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
  } = useForm<HistoryEntryFormData>({
    resolver: zodResolver(historyEntrySchema),
    defaultValues: {
      effective_date: new Date(),
    },
  });

  // Atualizar valor da data quando selecionada
  React.useEffect(() => {
    if (selectedDate) {
      setValue('effective_date', selectedDate);
    }
  }, [selectedDate, setValue]);

  const onSubmit = async (data: HistoryEntryFormData) => {
    try {
      const entryData: EmployeeHistoryInsert = {
        employee_id: employeeId,
        company_id: companyId,
        movement_type_id: data.movement_type_id,
        effective_date: data.effective_date.toISOString().split('T')[0],
        reason: data.reason || null,
        description: data.description || null,
        attachment_url: data.attachment_url || null,
        created_by: '', // Será preenchido pelo serviço
      };

      await createHistoryEntry.mutateAsync(entryData);
      
      toast({
        title: 'Sucesso',
        description: 'Movimentação registrada com sucesso!',
      });
      
      reset();
      setSelectedDate(new Date());
      onClose();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao registrar movimentação. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar Movimentação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="movement_type_id">Tipo de Movimentação *</Label>
              <Select
                value={watch('movement_type_id') || ''}
                onValueChange={(value) => setValue('movement_type_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de movimentação" />
                </SelectTrigger>
                <SelectContent>
                  {movementTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.codigo} - {type.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.movement_type_id && (
                <p className="text-sm text-destructive">{errors.movement_type_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Data de Efetivação *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !selectedDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              {errors.effective_date && (
                <p className="text-sm text-destructive">{errors.effective_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo</Label>
              <Input
                id="reason"
                {...register('reason')}
                placeholder="Motivo da movimentação (opcional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Descrição detalhada da movimentação (opcional)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attachment_url">URL do Documento</Label>
              <Input
                id="attachment_url"
                {...register('attachment_url')}
                placeholder="URL do documento anexo (opcional)"
                type="url"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createHistoryEntry.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isValid || createHistoryEntry.isPending}
            >
              {createHistoryEntry.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Movimentação'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
