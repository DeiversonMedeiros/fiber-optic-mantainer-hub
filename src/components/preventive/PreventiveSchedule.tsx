
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, Edit, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import * as XLSX from 'xlsx';

const scheduleSchema = z.object({
  cable_number: z.string().min(1, "Número do cabo é obrigatório"),
  client_site: z.string().min(1, "Cliente/Site é obrigatório"),
  scheduled_month: z.number().min(1).max(12),
  scheduled_year: z.number().min(2020),
  inspector_id: z.string().min(1, "Vistoriador é obrigatório"),
  observations: z.string().optional(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

interface PreventiveScheduleItem {
  id: string;
  cable_number: string;
  client_site: string;
  scheduled_month: number;
  scheduled_year: number;
  inspector_id: string;
  observations: string | null;
  created_at: string;
  inspector: {
    name: string;
  } | null;
}

const PreventiveSchedule = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PreventiveScheduleItem | null>(null);
  const [filters, setFilters] = useState({
    cableNumber: '',
    clientSite: '',
    inspector: '',
    month: '',
    year: '',
    dateFrom: '',
    dateTo: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      cable_number: '',
      client_site: '',
      scheduled_month: new Date().getMonth() + 1,
      scheduled_year: new Date().getFullYear(),
      inspector_id: '',
      observations: '',
    }
  });

  // Buscar cronograma
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['preventive-schedule', filters],
    queryFn: async () => {
      let query = supabase
        .from('preventive_schedule')
        .select(`
          *,
          inspector:profiles!inspector_id(name)
        `)
        .order('scheduled_year', { ascending: false })
        .order('scheduled_month', { ascending: false });

      if (filters.cableNumber) {
        query = query.ilike('cable_number', `%${filters.cableNumber}%`);
      }
      if (filters.clientSite) {
        query = query.ilike('client_site', `%${filters.clientSite}%`);
      }
      if (filters.month) {
        query = query.eq('scheduled_month', parseInt(filters.month));
      }
      if (filters.year) {
        query = query.eq('scheduled_year', parseInt(filters.year));
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // Buscar inspetores
  const { data: inspectors = [] } = useQuery({
    queryKey: ['inspectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('is_active', true)
        .in('role', ['tecnico', 'supervisor']);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Criar/Editar cronograma
  const mutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      if (editingItem) {
        const { error } = await supabase
          .from('preventive_schedule')
          .update(data)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { data: user } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('preventive_schedule')
          .insert({
            ...data,
            created_by: user.user?.id || ''
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: editingItem ? "Cronograma atualizado" : "Cronograma criado",
        description: "Operação realizada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['preventive-schedule'] });
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Excluir cronograma
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('preventive_schedule')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Cronograma excluído",
        description: "Item removido com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['preventive-schedule'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  const getMonthName = (month: number) => {
    return months.find(m => m.value === month)?.label || month.toString();
  };

  const exportToExcel = () => {
    const exportData = schedules.map(schedule => ({
      'Nº Cabo': schedule.cable_number,
      'Cliente/Site': schedule.client_site,
      'Mês': getMonthName(schedule.scheduled_month),
      'Ano': schedule.scheduled_year,
      'Vistoriador': schedule.inspector?.name || '',
      'Observações': schedule.observations || '',
      'Data Criação': format(new Date(schedule.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cronograma Preventiva');
    XLSX.writeFile(wb, `cronograma_preventiva_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const handleEdit = (item: PreventiveScheduleItem) => {
    setEditingItem(item);
    form.reset({
      cable_number: item.cable_number,
      client_site: item.client_site,
      scheduled_month: item.scheduled_month,
      scheduled_year: item.scheduled_year,
      inspector_id: item.inspector_id,
      observations: item.observations || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: ScheduleFormData) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return <div>Carregando cronograma...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <Label htmlFor="cableNumber">Nº do Cabo</Label>
          <Input
            id="cableNumber"
            placeholder="Buscar por cabo"
            value={filters.cableNumber}
            onChange={(e) => setFilters(prev => ({ ...prev, cableNumber: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="clientSite">Cliente/Site</Label>
          <Input
            id="clientSite"
            placeholder="Buscar por cliente/site"
            value={filters.clientSite}
            onChange={(e) => setFilters(prev => ({ ...prev, clientSite: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="month">Mês</Label>
          <Select value={filters.month} onValueChange={(value) => setFilters(prev => ({ ...prev, month: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os meses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="year">Ano</Label>
          <Input
            id="year"
            type="number"
            placeholder="Ex: 2024"
            value={filters.year}
            onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
          />
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingItem(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cronograma
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Cronograma' : 'Adicionar Cronograma'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="cable_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº do Cabo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: CABO-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="client_site"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente/Site</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Cliente A - Site Principal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="scheduled_month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mês</FormLabel>
                        <Select value={field.value.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {months.map((month) => (
                              <SelectItem key={month.value} value={month.value.toString()}>
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduled_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ano</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="2020" 
                            max="2050" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="inspector_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vistoriador</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um vistoriador" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {inspectors.map((inspector) => (
                            <SelectItem key={inspector.id} value={inspector.id}>
                              {inspector.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observações sobre a inspeção..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Button onClick={exportToExcel} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar Excel
        </Button>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº Cabo</TableHead>
              <TableHead>Cliente/Site</TableHead>
              <TableHead>Mês/Ano</TableHead>
              <TableHead>Vistoriador</TableHead>
              <TableHead>Observações</TableHead>
              <TableHead>Data Criação</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((schedule) => (
              <TableRow key={schedule.id}>
                <TableCell className="font-medium">{schedule.cable_number}</TableCell>
                <TableCell>{schedule.client_site}</TableCell>
                <TableCell>
                  {getMonthName(schedule.scheduled_month)}/{schedule.scheduled_year}
                </TableCell>
                <TableCell>{schedule.inspector?.name || '-'}</TableCell>
                <TableCell>{schedule.observations || '-'}</TableCell>
                <TableCell>
                  {format(new Date(schedule.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(schedule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(schedule.id)}
                      disabled={deleteMutation.isPending}
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
    </div>
  );
};

export default PreventiveSchedule;
