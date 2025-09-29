// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScheduleEntry, ScheduleEntryInsert, ScheduleEntryUpdate, Holiday } from '@/integrations/supabase/rh-types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus, Users, Clock, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScheduleCell } from './ScheduleCell';
import { ScheduleEntryForm } from './ScheduleEntryForm';

interface SchedulePlanningProps {
  companyId: string;
  className?: string;
}

interface Employee {
  id: string;
  nome: string;
  cargo: string;
  turno_atual?: string;
}

interface ScheduleData {
  employee: Employee;
  entries: ScheduleEntry[];
}

export const SchedulePlanning = ({ companyId, className = '' }: SchedulePlanningProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCell, setSelectedCell] = useState<{employeeId: string, date: string} | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calcular período da escala (todo o mês)
  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Buscar funcionários
  const { data: employees = [] } = useQuery({
    queryKey: ['employees', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('rh')
        .from('employees')
        .select(`
          id,
          nome,
          position:positions(nome),
          employee_shifts!inner(
            shift:work_shifts(nome),
            data_inicio,
            data_fim,
            is_active
          )
        `)
        .eq('company_id', companyId)
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;
      
      return data.map(emp => ({
        id: emp.id,
        nome: emp.nome,
        cargo: emp.position?.nome || 'Sem cargo',
        turno_atual: emp.employee_shifts?.find(es => es.is_active)?.shift?.nome
      }));
    },
    enabled: !!companyId
  });

  // Buscar entradas de escala
  const { data: scheduleEntries = [] } = useQuery({
    queryKey: ['schedule-entries', companyId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('rh')
        .from('schedule_entries')
        .select(`
          *,
          shift:work_shifts(nome, hora_inicio, hora_fim)
        `)
        .eq('company_id', companyId)
        .gte('data', startDate.toISOString().split('T')[0])
        .lte('data', endDate.toISOString().split('T')[0])
        .order('data');

      if (error) throw error;
      return data as (ScheduleEntry & { shift?: { nome: string; hora_inicio: string; hora_fim: string } })[];
    },
    enabled: !!companyId
  });

  // Buscar feriados
  const { data: holidays = [] } = useQuery({
    queryKey: ['holidays', companyId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('rh')
        .from('holidays')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .gte('data', startDate.toISOString().split('T')[0])
        .lte('data', endDate.toISOString().split('T')[0])
        .order('data');

      if (error) throw error;
      return data as Holiday[];
    },
    enabled: !!companyId
  });

  // Buscar turnos disponíveis
  const { data: shifts = [] } = useQuery({
    queryKey: ['work-shifts', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('rh')
        .from('work_shifts')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('nome');

      if (error) throw error;
      return data;
    },
    enabled: !!companyId
  });

  // Criar/Atualizar entrada de escala
  const scheduleEntryMutation = useMutation({
    mutationFn: async (data: ScheduleEntryInsert | ScheduleEntryUpdate) => {
      if ('id' in data) {
        // Update
        const { error } = await supabase
          .schema('rh')
          .from('schedule_entries')
          .update(data)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .schema('rh')
          .from('schedule_entries')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-entries'] });
      toast({
        title: 'Sucesso!',
        description: 'Escala atualizada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro!',
        description: error.message || 'Erro ao atualizar escala.',
        variant: 'destructive',
      });
    }
  });

  // Gerar array de datas para o período
  const generateDateRange = () => {
    const dates = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  const dates = generateDateRange();

  // Obter entrada para funcionário e data específica
  const getEntryForEmployeeAndDate = (employeeId: string, date: string) => {
    return scheduleEntries.find(entry => 
      entry.employee_id === employeeId && entry.data === date
    );
  };

  // Obter feriado para data específica
  const getHolidayForDate = (date: string) => {
    return holidays.find(holiday => holiday.data === date);
  };

  // Verificar se é fim de semana
  const isWeekend = (date: Date) => {
    return date.getDay() === 0 || date.getDay() === 6; // Domingo ou Sábado
  };

  // Obter nome do dia da semana
  const getDayName = (date: Date) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days[date.getDay()];
  };

  // Formatar data
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  // Lidar com clique na célula
  const handleCellClick = (employeeId: string, date: string) => {
    setSelectedCell({ employeeId, date });
    setIsFormOpen(true);
  };

  // Lidar com envio do formulário
  const handleFormSubmit = (data: any) => {
    if (selectedCell) {
      const entryData: ScheduleEntryInsert = {
        company_id: companyId,
        employee_id: selectedCell.employeeId,
        data: selectedCell.date,
        tipo: data.tipo,
        shift_id: data.shift_id || null,
        observacoes: data.observacoes || null,
        created_by: null // TODO: Pegar do contexto do usuário
      };

      // Verificar se já existe entrada para esta data/funcionário
      const existingEntry = getEntryForEmployeeAndDate(selectedCell.employeeId, selectedCell.date);
      
      if (existingEntry) {
        scheduleEntryMutation.mutate({
          id: existingEntry.id,
          ...entryData
        } as ScheduleEntryUpdate);
      } else {
        scheduleEntryMutation.mutate(entryData);
      }
    }
    
    setIsFormOpen(false);
    setSelectedCell(null);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controles de período */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Mês:</span>
                <span>{startDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <span className="font-medium">Funcionários:</span>
                <span>{employees.length}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              >
                Mês Anterior
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Mês Atual
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              >
                Próximo Mês
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Escala */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[80vh]">
            <table className="border-collapse">
              {/* Cabeçalho com datas */}
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b">
                  <th className="border-r bg-gray-50 p-3 text-left font-medium min-w-[200px] sticky left-0 z-20">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Funcionários</span>
                    </div>
                  </th>
                  {dates.map((date) => {
                    const holiday = getHolidayForDate(date.toISOString().split('T')[0]);
                    const isWeekendDay = isWeekend(date);
                    
                    return (
                      <th key={date.toISOString()} className="border-r bg-gray-50 p-1 text-center font-medium min-w-[80px] w-[80px]">
                        <div className="space-y-1">
                          <div className="text-xs text-gray-600">{getDayName(date)}</div>
                          <div className="text-sm font-semibold">{formatDate(date)}</div>
                          {holiday && (
                            <div className="text-xs text-orange-600 bg-orange-100 rounded px-1 truncate" title={holiday.nome}>
                              {holiday.nome.length > 6 ? holiday.nome.substring(0, 6) + '...' : holiday.nome}
                            </div>
                          )}
                          {isWeekendDay && !holiday && (
                            <div className="text-xs text-gray-500 bg-gray-100 rounded px-1">
                              S/Exp.
                            </div>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Linhas dos funcionários */}
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b hover:bg-gray-50">
                    {/* Coluna do funcionário */}
                    <td className="border-r p-3 sticky left-0 bg-white z-10 min-w-[200px]">
                      <div>
                        <div className="font-medium">{employee.nome}</div>
                        <div className="text-sm text-gray-600">{employee.cargo}</div>
                        {employee.turno_atual && (
                          <div className="text-xs text-blue-600 bg-blue-100 rounded px-2 py-1 mt-1 inline-block">
                            {employee.turno_atual}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Células de cada dia */}
                    {dates.map((date) => {
                      const dateString = date.toISOString().split('T')[0];
                      const entry = getEntryForEmployeeAndDate(employee.id, dateString);
                      const holiday = getHolidayForDate(dateString);
                      const isWeekendDay = isWeekend(date);
                      
                      return (
                        <td key={dateString} className="border-r p-1">
                          <ScheduleCell
                            entry={entry}
                            holiday={holiday}
                            isWeekend={isWeekendDay}
                            shifts={shifts}
                            onClick={() => handleCellClick(employee.id, dateString)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legenda */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-3">Legenda:</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>T1 - Turno 1</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>T2 - Turno 2</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-600 rounded"></div>
              <span>T3 - Turno 3</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>T4 - Turno 4</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-300 rounded"></div>
              <span>Folga</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span>Férias</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-400 rounded"></div>
              <span>Feriado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span>S/Exp. - Sem Expediente</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal do Formulário */}
      {isFormOpen && selectedCell && (
        <ScheduleEntryForm
          employeeId={selectedCell.employeeId}
          date={selectedCell.date}
          employees={employees}
          shifts={shifts}
          existingEntry={getEntryForEmployeeAndDate(selectedCell.employeeId, selectedCell.date)}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setSelectedCell(null);
          }}
        />
      )}
    </div>
  );
};
