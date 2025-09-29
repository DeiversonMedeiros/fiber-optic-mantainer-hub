import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useIrrfBrackets, type IrrfBracket, type IrrfBracketInsert, type IrrfBracketUpdate } from '@/hooks/rh/useIrrfBrackets';
import { IrrfBracketsForm } from './IrrfBracketsForm';

export const IrrfBracketsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIrrfBracket, setEditingIrrfBracket] = useState<IrrfBracket | null>(null);
  
  const {
    irrfBrackets,
    isLoading,
    error,
    createIrrfBracket,
    updateIrrfBracket,
    deleteIrrfBracket,
    isCreating,
    isUpdating,
    isDeleting
  } = useIrrfBrackets();

  const handleNewIrrfBracket = () => {
    setEditingIrrfBracket(null);
    setIsFormOpen(true);
  };

  const handleEditIrrfBracket = (irrfBracket: IrrfBracket) => {
    setEditingIrrfBracket(irrfBracket);
    setIsFormOpen(true);
  };

  const handleSaveIrrfBracket = (data: IrrfBracketInsert) => {
    if (editingIrrfBracket) {
      updateIrrfBracket({ id: editingIrrfBracket.id, data: data as IrrfBracketUpdate });
    } else {
      createIrrfBracket(data);
    }
    setIsFormOpen(false);
    setEditingIrrfBracket(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingIrrfBracket(null);
  };

  const filteredIrrfBrackets = irrfBrackets.filter(irrfBracket =>
    irrfBracket.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    irrfBracket.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando faixas IRRF...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Erro ao carregar faixas IRRF: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Faixas IRRF</CardTitle>
            <Button onClick={handleNewIrrfBracket} disabled={isCreating}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Faixa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar faixas IRRF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          {filteredIrrfBrackets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma faixa IRRF encontrada.</p>
              <p className="text-sm">Clique em "Nova Faixa" para adicionar a primeira faixa.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredIrrfBrackets.map((irrfBracket) => (
                <div key={irrfBracket.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{irrfBracket.codigo}</span>
                      <span className="text-sm text-muted-foreground">-</span>
                      <span>{irrfBracket.descricao}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      R$ {(irrfBracket.valor_minimo || 0).toFixed(2)} - {irrfBracket.valor_maximo ? `R$ ${(irrfBracket.valor_maximo || 0).toFixed(2)}` : 'Acima'}
                      {` • ${(irrfBracket.aliquota || 0)}%`}
                      {` • Dedução: R$ ${(irrfBracket.valor_deducao || 0).toFixed(2)}`}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditIrrfBracket(irrfBracket)}
                      disabled={isUpdating}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteIrrfBracket(irrfBracket.id)}
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

      <IrrfBracketsForm
        irrfBracket={editingIrrfBracket}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveIrrfBracket}
      />
    </div>
  );
};

