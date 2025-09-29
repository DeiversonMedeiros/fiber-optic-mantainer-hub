import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Holiday, HolidayInsert, HolidayUpdate } from '@/integrations/supabase/rh-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus, Search, Filter, Eye, Edit, Trash2, MapPin, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { HolidayForm } from './HolidayForm';
import { HolidayTable } from './HolidayTable';

interface HolidayManagementProps {
  companyId: string;
  className?: string;
}

export const HolidayManagement = ({ companyId, className = '' }: HolidayManagementProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    tipo: 'all',
    ano: 'all'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar feriados
  const { data: holidays = [], isLoading, error } = useQuery({
    queryKey: ['holidays', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('rh')
        .from('holidays')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('data', { ascending: true });

      if (error) throw error;
      return data as Holiday[];
    },
    enabled: !!companyId
  });

  // Criar feriado
  const createHoliday = useMutation({
    mutationFn: async (data: HolidayInsert) => {
      const { error } = await supabase
        .schema('rh')
        .from('holidays')
        .insert([data]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', companyId] });
      toast({
        title: 'Sucesso!',
        description: 'Feriado criado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro!',
        description: error.message || 'Erro ao criar feriado.',
        variant: 'destructive',
      });
    }
  });

  // Atualizar feriado
  const updateHoliday = useMutation({
    mutationFn: async ({ id, ...data }: HolidayUpdate & { id: string }) => {
      const { error } = await supabase
        .schema('rh')
        .from('holidays')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', companyId] });
      toast({
        title: 'Sucesso!',
        description: 'Feriado atualizado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro!',
        description: error.message || 'Erro ao atualizar feriado.',
        variant: 'destructive',
      });
    }
  });

  // Excluir feriado
  const deleteHoliday = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .schema('rh')
        .from('holidays')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', companyId] });
      toast({
        title: 'Sucesso!',
        description: 'Feriado excluído com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro!',
        description: error.message || 'Erro ao excluir feriado.',
        variant: 'destructive',
      });
    }
  });

  // Popular feriados nacionais
  const populateNationalHolidays = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('populate_national_holidays', {
        company_uuid: companyId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', companyId] });
      toast({
        title: 'Sucesso!',
        description: 'Feriados nacionais adicionados com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro!',
        description: error.message || 'Erro ao popular feriados nacionais.',
        variant: 'destructive',
      });
    }
  });

  const handleCreate = () => {
    setSelectedHoliday(null);
    setIsFormOpen(true);
  };

  const handleEdit = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este feriado?')) {
      deleteHoliday.mutate(id);
    }
  };

  const handleFormSubmit = async (data: HolidayInsert | HolidayUpdate) => {
    try {
      if (selectedHoliday) {
        await updateHoliday.mutateAsync({ id: selectedHoliday.id, ...data });
      } else {
        await createHoliday.mutateAsync({ ...data, company_id: companyId });
      }
      setIsFormOpen(false);
      setSelectedHoliday(null);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  // Filtrar feriados
  const filteredHolidays = holidays.filter(holiday => {
    const matchesSearch = !filters.search || 
      holiday.nome.toLowerCase().includes(filters.search.toLowerCase()) ||
      (holiday.cidade && holiday.cidade.toLowerCase().includes(filters.search.toLowerCase())) ||
      (holiday.estado && holiday.estado.toLowerCase().includes(filters.search.toLowerCase()));
    
    const matchesTipo = filters.tipo === 'all' || holiday.tipo === filters.tipo;
    
    const matchesAno = filters.ano === 'all' || 
      new Date(holiday.data).getFullYear().toString() === filters.ano;

    return matchesSearch && matchesTipo && matchesAno;
  });

  // Calcular estatísticas
  const totalHolidays = holidays.length;
  const nacionalCount = holidays.filter(h => h.tipo === 'nacional').length;
  const estadualCount = holidays.filter(h => h.tipo === 'estadual').length;
  const municipalCount = holidays.filter(h => h.tipo === 'municipal').length;

  // Obter anos únicos
  const anosUnicos = [...new Set(holidays.map(h => new Date(h.data).getFullYear()))].sort((a, b) => b - a);

  if (isLoading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Carregando feriados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-destructive mb-4">
          <p>Erro ao carregar feriados</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Feriados</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHolidays}</div>
            <p className="text-xs text-muted-foreground">Feriados ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nacionais</CardTitle>
            <MapPin className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{nacionalCount}</div>
            <p className="text-xs text-muted-foreground">Feriados nacionais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estaduais</CardTitle>
            <MapPin className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{estadualCount}</div>
            <p className="text-xs text-muted-foreground">Feriados estaduais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Municipais</CardTitle>
            <MapPin className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{municipalCount}</div>
            <p className="text-xs text-muted-foreground">Feriados municipais</p>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Feriados</CardTitle>
              <p className="text-sm text-muted-foreground">
                Gerencie feriados nacionais, estaduais e municipais
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => populateNationalHolidays.mutate()}
                disabled={populateNationalHolidays.isPending}
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Popular Nacionais
              </Button>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Feriado
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, cidade ou estado..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.tipo}
              onValueChange={(value) => setFilters(prev => ({ ...prev, tipo: value }))}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="nacional">Nacional</SelectItem>
                <SelectItem value="estadual">Estadual</SelectItem>
                <SelectItem value="municipal">Municipal</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.ano}
              onValueChange={(value) => setFilters(prev => ({ ...prev, ano: value }))}
            >
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os anos</SelectItem>
                {anosUnicos.map(ano => (
                  <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <HolidayTable
            holidays={filteredHolidays}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* Modal do Formulário */}
      {isFormOpen && (
        <HolidayForm
          holiday={selectedHoliday}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setSelectedHoliday(null);
          }}
          companyId={companyId}
        />
      )}
    </div>
  );
};
