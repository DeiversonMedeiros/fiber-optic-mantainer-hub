import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Eye, Edit, Trash2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PayrollConfigTable } from './PayrollConfigTable';
import { PayrollConfigForm } from './PayrollConfigForm';
import { usePayrollConfig } from '@/hooks/rh/usePayrollConfig';

export const PayrollConfigManagement = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPayrollConfig, setSelectedPayrollConfig] = useState<any>(null);
  const [filters, setFilters] = useState({
    search: '',
    regime: 'all'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    payrollConfigs,
    isLoading,
    error,
    createPayrollConfig,
    updatePayrollConfig,
    deletePayrollConfig
  } = usePayrollConfig();

  const handleCreate = () => {
    setSelectedPayrollConfig(null);
    setIsFormOpen(true);
  };

  const handleEdit = (payrollConfig: any) => {
    setSelectedPayrollConfig(payrollConfig);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta configuração de folha?')) {
      try {
        await deletePayrollConfig.mutateAsync(id);
        toast({
          title: 'Sucesso',
          description: 'Configuração de folha excluída com sucesso!',
        });
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao excluir configuração de folha.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (selectedPayrollConfig) {
        await updatePayrollConfig.mutateAsync({
          id: selectedPayrollConfig.id,
          ...data
        });
        toast({
          title: 'Sucesso',
          description: 'Configuração de folha atualizada com sucesso!',
        });
      } else {
        await createPayrollConfig.mutateAsync(data);
        toast({
          title: 'Sucesso',
          description: 'Configuração de folha criada com sucesso!',
        });
      }
      setIsFormOpen(false);
      setSelectedPayrollConfig(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configuração de folha.',
        variant: 'destructive',
      });
    }
  };

  const filteredPayrollConfigs = payrollConfigs?.filter(config => {
    const matchesSearch = !filters.search || 
      config.employee?.nome?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesRegime = filters.regime === 'all' || 
      config.regime_hora_extra === filters.regime;

    return matchesSearch && matchesRegime;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando configurações de folha...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erro ao carregar configurações de folha: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {payrollConfigs?.length || 0}
                </p>
              </div>
              <Settings className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Banco de Horas</p>
                <p className="text-2xl font-bold text-green-600">
                  {payrollConfigs?.filter(c => c.vigencia_banco_horas).length || 0}
                </p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Configurado
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hora Extra</p>
                <p className="text-2xl font-bold text-blue-600">
                  {payrollConfigs?.filter(c => c.regime_hora_extra).length || 0}
                </p>
              </div>
              <Badge variant="outline">Configurado</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Configurações de Folha</CardTitle>
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nova Configuração
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por funcionário..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.regime}
              onValueChange={(value) => setFilters(prev => ({ ...prev, regime: value }))}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Regime" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="banco_horas">Banco de Horas</SelectItem>
                <SelectItem value="hora_extra">Hora Extra</SelectItem>
                <SelectItem value="misto">Misto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <PayrollConfigTable
            payrollConfigs={filteredPayrollConfigs}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* Form Modal */}
      {isFormOpen && (
        <PayrollConfigForm
          payrollConfig={selectedPayrollConfig}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setSelectedPayrollConfig(null);
          }}
        />
      )}
    </div>
  );
};













































