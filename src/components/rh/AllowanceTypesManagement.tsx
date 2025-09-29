import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AllowanceTypesForm } from './AllowanceTypesForm';
import { useAllowanceTypes, type AllowanceType, type AllowanceTypeInsert, type AllowanceTypeUpdate } from '@/hooks/rh/useAllowanceTypes';

export const AllowanceTypesManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAllowanceType, setEditingAllowanceType] = useState<AllowanceType | null>(null);
  
  const {
    allowanceTypes,
    isLoading,
    error,
    createAllowanceType,
    updateAllowanceType,
    deleteAllowanceType,
    isCreating,
    isUpdating,
    isDeleting
  } = useAllowanceTypes();

  const handleNewAllowanceType = () => {
    setEditingAllowanceType(null);
    setIsFormOpen(true);
  };

  const handleEditAllowanceType = (allowanceType: AllowanceType) => {
    setEditingAllowanceType(allowanceType);
    setIsFormOpen(true);
  };

  const handleSaveAllowanceType = (data: AllowanceTypeInsert) => {
    if (editingAllowanceType) {
      updateAllowanceType({ id: editingAllowanceType.id, data: data as AllowanceTypeUpdate });
    } else {
      createAllowanceType(data);
    }
    setIsFormOpen(false);
    setEditingAllowanceType(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAllowanceType(null);
  };

  const filteredAllowanceTypes = allowanceTypes.filter(allowanceType =>
    allowanceType.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    allowanceType.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando tipos de adicionais...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Erro ao carregar tipos de adicionais: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tipos de Adicionais</CardTitle>
            <Button onClick={handleNewAllowanceType} disabled={isCreating}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Tipo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tipos de adicionais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          {filteredAllowanceTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum tipo de adicional encontrado.</p>
              <p className="text-sm">Clique em "Novo Tipo" para adicionar o primeiro tipo.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAllowanceTypes.map((allowanceType) => (
                <div key={allowanceType.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{allowanceType.codigo}</span>
                      <span className="text-sm text-muted-foreground">-</span>
                      <span>{allowanceType.descricao}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {allowanceType.valor} {allowanceType.unidade === 'PERCENTUAL' ? '%' : allowanceType.unidade === 'REAIS' ? 'R$' : 'h'}
                      {` • ${allowanceType.tipo}`}
                      {` • Base: ${allowanceType.base_calculo}`}
                      {allowanceType.is_cumulative && ' • Cumulativo'}
                      {allowanceType.requires_approval && ' • Requer aprovação'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAllowanceType(allowanceType)}
                      disabled={isUpdating}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteAllowanceType(allowanceType.id)}
                      disabled={isDeleting}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AllowanceTypesForm
        allowanceType={editingAllowanceType}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveAllowanceType}
      />
    </div>
  );
};

