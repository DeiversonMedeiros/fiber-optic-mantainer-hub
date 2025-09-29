import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AbsenceTypesForm } from './AbsenceTypesForm';
import { useAbsenceTypes, type AbsenceType, type AbsenceTypeInsert, type AbsenceTypeUpdate } from '@/hooks/rh/useAbsenceTypes';

export const AbsenceTypesManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAbsenceType, setEditingAbsenceType] = useState<AbsenceType | null>(null);
  
  const {
    absenceTypes,
    isLoading,
    error,
    createAbsenceType,
    updateAbsenceType,
    deleteAbsenceType,
    isCreating,
    isUpdating,
    isDeleting
  } = useAbsenceTypes();

  const handleNewAbsenceType = () => {
    setEditingAbsenceType(null);
    setIsFormOpen(true);
  };

  const handleEditAbsenceType = (absenceType: AbsenceType) => {
    setEditingAbsenceType(absenceType);
    setIsFormOpen(true);
  };

  const handleSaveAbsenceType = (data: AbsenceTypeInsert) => {
    if (editingAbsenceType) {
      updateAbsenceType({ id: editingAbsenceType.id, data: data as AbsenceTypeUpdate });
    } else {
      createAbsenceType(data);
    }
    setIsFormOpen(false);
    setEditingAbsenceType(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAbsenceType(null);
  };

  const filteredAbsenceTypes = absenceTypes.filter(absenceType =>
    absenceType.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    absenceType.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando tipos de afastamento...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Erro ao carregar tipos de afastamento: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tipos de Afastamento</CardTitle>
            <Button onClick={handleNewAbsenceType} disabled={isCreating}>
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
                placeholder="Buscar tipos de afastamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          {filteredAbsenceTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum tipo de afastamento encontrado.</p>
              <p className="text-sm">Clique em "Novo Tipo" para adicionar o primeiro tipo.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAbsenceTypes.map((absenceType) => (
                <div key={absenceType.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{absenceType.codigo}</span>
                      <span className="text-sm text-muted-foreground">-</span>
                      <span>{absenceType.descricao}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Categoria: {absenceType.categoria}
                      {absenceType.max_days && ` • Máx: ${absenceType.max_days} dias`}
                      {absenceType.is_paid ? ' • Remunerado' : ' • Não remunerado'}
                      {absenceType.requires_medical_certificate && ' • Requer atestado'}
                      {absenceType.requires_approval && ' • Requer aprovação'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAbsenceType(absenceType)}
                      disabled={isUpdating}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteAbsenceType(absenceType.id)}
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

      <AbsenceTypesForm
        absenceType={editingAbsenceType}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveAbsenceType}
      />
    </div>
  );
};

