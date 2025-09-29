import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DelayReasonsForm } from './DelayReasonsForm';
import { useDelayReasons, type DelayReason, type DelayReasonInsert, type DelayReasonUpdate } from '@/hooks/rh/useDelayReasons';

export const DelayReasonsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDelayReason, setEditingDelayReason] = useState<DelayReason | null>(null);
  
  const {
    delayReasons,
    isLoading,
    error,
    createDelayReason,
    updateDelayReason,
    deleteDelayReason,
    isCreating,
    isUpdating,
    isDeleting
  } = useDelayReasons();

  const handleNewDelayReason = () => {
    setEditingDelayReason(null);
    setIsFormOpen(true);
  };

  const handleEditDelayReason = (delayReason: DelayReason) => {
    setEditingDelayReason(delayReason);
    setIsFormOpen(true);
  };

  const handleSaveDelayReason = (data: DelayReasonInsert) => {
    if (editingDelayReason) {
      // Atualizar existente
      updateDelayReason({ id: editingDelayReason.id, data: data as DelayReasonUpdate });
    } else {
      // Adicionar novo
      createDelayReason(data);
    }
    setIsFormOpen(false);
    setEditingDelayReason(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingDelayReason(null);
  };

  const filteredDelayReasons = delayReasons.filter(delayReason =>
    delayReason.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delayReason.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando motivos de atraso...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Erro ao carregar motivos de atraso: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Motivos de Atraso</CardTitle>
            <Button onClick={handleNewDelayReason} disabled={isCreating}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Motivo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar motivos de atraso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          {filteredDelayReasons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum motivo de atraso encontrado.</p>
              <p className="text-sm">Clique em "Novo Motivo" para adicionar o primeiro motivo.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDelayReasons.map((delayReason) => (
                <div key={delayReason.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{delayReason.codigo}</span>
                      <span className="text-sm text-muted-foreground">-</span>
                      <span>{delayReason.descricao}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Categoria: {delayReason.categoria}
                      {delayReason.requires_justification && ' • Requer justificativa'}
                      {delayReason.requires_medical_certificate && ' • Requer atestado médico'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditDelayReason(delayReason)}
                      disabled={isUpdating}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteDelayReason(delayReason.id)}
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

      <DelayReasonsForm
        delayReason={editingDelayReason}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveDelayReason}
      />
    </div>
  );
};

