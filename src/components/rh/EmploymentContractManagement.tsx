import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Eye, Edit, Trash2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmploymentContractTable } from './EmploymentContractTable';
import { EmploymentContractForm } from './EmploymentContractForm';
import { useEmploymentContracts } from '@/hooks/rh/useEmploymentContracts';

export const EmploymentContractManagement = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    tipo: 'all'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    employmentContracts,
    isLoading,
    error,
    createEmploymentContract,
    updateEmploymentContract,
    deleteEmploymentContract
  } = useEmploymentContracts();

  const handleCreate = () => {
    setSelectedContract(null);
    setIsFormOpen(true);
  };

  const handleEdit = (contract: any) => {
    setSelectedContract(contract);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este contrato?')) {
      try {
        await deleteEmploymentContract.mutateAsync(id);
        toast({
          title: 'Sucesso',
          description: 'Contrato excluído com sucesso!',
        });
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao excluir contrato.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (selectedContract) {
        await updateEmploymentContract.mutateAsync({
          id: selectedContract.id,
          ...data
        });
        toast({
          title: 'Sucesso',
          description: 'Contrato atualizado com sucesso!',
        });
      } else {
        await createEmploymentContract.mutateAsync(data);
        toast({
          title: 'Sucesso',
          description: 'Contrato criado com sucesso!',
        });
      }
      setIsFormOpen(false);
      setSelectedContract(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar contrato.',
        variant: 'destructive',
      });
    }
  };

  const filteredContracts = employmentContracts?.filter(contract => {
    const matchesSearch = !filters.search || 
      contract.employee?.nome?.toLowerCase().includes(filters.search.toLowerCase()) ||
      contract.position?.nome?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || 
      (filters.status === 'active' && contract.is_active) ||
      (filters.status === 'inactive' && !contract.is_active);
    
    const matchesTipo = filters.tipo === 'all' || contract.tipo_contrato === filters.tipo;

    return matchesSearch && matchesStatus && matchesTipo;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando contratos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erro ao carregar contratos: {error.message}</p>
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
                  {employmentContracts?.length || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {employmentContracts?.filter(c => c.is_active).length || 0}
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
                <p className="text-sm font-medium text-gray-600">CLT</p>
                <p className="text-2xl font-bold text-blue-600">
                  {employmentContracts?.filter(c => c.tipo_contrato === 'clt').length || 0}
                </p>
              </div>
              <Badge variant="outline">CLT</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">PJ</p>
                <p className="text-2xl font-bold text-purple-600">
                  {employmentContracts?.filter(c => c.tipo_contrato === 'pj').length || 0}
                </p>
              </div>
              <Badge variant="outline">PJ</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Contratos de Trabalho</CardTitle>
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por funcionário ou cargo..."
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
            <Select
              value={filters.tipo}
              onValueChange={(value) => setFilters(prev => ({ ...prev, tipo: value }))}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="clt">CLT</SelectItem>
                <SelectItem value="pj">PJ</SelectItem>
                <SelectItem value="estagiario">Estagiário</SelectItem>
                <SelectItem value="temporario">Temporário</SelectItem>
                <SelectItem value="terceirizado">Terceirizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <EmploymentContractTable
            contracts={filteredContracts}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* Form Modal */}
      {isFormOpen && (
        <EmploymentContractForm
          contract={selectedContract}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setSelectedContract(null);
          }}
        />
      )}
    </div>
  );
};



















