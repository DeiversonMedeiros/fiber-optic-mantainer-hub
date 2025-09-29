import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Eye, Edit, Trash2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmployeeShiftTable } from './EmployeeShiftTable';
import { EmployeeShiftForm } from './EmployeeShiftForm';
import { useEmployeeShifts } from '@/hooks/rh/useEmployeeShifts';

export const EmployeeShiftManagement = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEmployeeShift, setSelectedEmployeeShift] = useState<any>(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    shift: 'all'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    employeeShifts,
    isLoading,
    error,
    createEmployeeShift,
    updateEmployeeShift,
    deleteEmployeeShift
  } = useEmployeeShifts();

  const handleCreate = () => {
    setSelectedEmployeeShift(null);
    setIsFormOpen(true);
  };

  const handleEdit = (employeeShift: any) => {
    setSelectedEmployeeShift(employeeShift);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta atribuição de turno?')) {
      try {
        await deleteEmployeeShift.mutateAsync(id);
        toast({
          title: 'Sucesso',
          description: 'Atribuição de turno excluída com sucesso!',
        });
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao excluir atribuição de turno.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (selectedEmployeeShift) {
        await updateEmployeeShift.mutateAsync({
          id: selectedEmployeeShift.id,
          ...data
        });
        toast({
          title: 'Sucesso',
          description: 'Atribuição de turno atualizada com sucesso!',
        });
      } else {
        await createEmployeeShift.mutateAsync(data);
        toast({
          title: 'Sucesso',
          description: 'Atribuição de turno criada com sucesso!',
        });
      }
      setIsFormOpen(false);
      setSelectedEmployeeShift(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar atribuição de turno.',
        variant: 'destructive',
      });
    }
  };

  const filteredEmployeeShifts = employeeShifts?.filter(employeeShift => {
    const matchesSearch = !filters.search || 
      employeeShift.employee?.nome?.toLowerCase().includes(filters.search.toLowerCase()) ||
      employeeShift.shift?.nome?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || 
      (filters.status === 'active' && employeeShift.is_active) ||
      (filters.status === 'inactive' && !employeeShift.is_active);
    
    const matchesShift = filters.shift === 'all' || employeeShift.shift_id === filters.shift;

    return matchesSearch && matchesStatus && matchesShift;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando turnos de funcionários...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erro ao carregar turnos de funcionários: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {employeeShifts?.length || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {employeeShifts?.filter(es => es.is_active).length || 0}
                </p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Ativo
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Com Data Fim</p>
                <p className="text-2xl font-bold text-orange-600">
                  {employeeShifts?.filter(es => es.data_fim).length || 0}
                </p>
              </div>
              <Badge variant="outline">Finalizado</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sem Data Fim</p>
                <p className="text-2xl font-bold text-blue-600">
                  {employeeShifts?.filter(es => !es.data_fim).length || 0}
                </p>
              </div>
              <Badge variant="outline">Ativo</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Turnos de Funcionários</CardTitle>
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nova Atribuição
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por funcionário ou turno..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <EmployeeShiftTable
            employeeShifts={filteredEmployeeShifts}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* Form Modal */}
      {isFormOpen && (
        <EmployeeShiftForm
          employeeShift={selectedEmployeeShift}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setSelectedEmployeeShift(null);
          }}
        />
      )}
    </div>
  );
};























































































