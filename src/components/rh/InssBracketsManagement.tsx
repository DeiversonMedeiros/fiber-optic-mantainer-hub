import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { InssBracketsForm } from './InssBracketsForm';
import { useInssBrackets, type InssBracket, type InssBracketInsert, type InssBracketUpdate } from '@/hooks/rh/useInssBrackets';

export const InssBracketsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInssBracket, setEditingInssBracket] = useState<InssBracket | null>(null);
  
  const {
    inssBrackets,
    isLoading,
    error,
    createInssBracket,
    updateInssBracket,
    deleteInssBracket,
    isCreating,
    isUpdating,
    isDeleting
  } = useInssBrackets();

  const handleNewInssBracket = () => {
    setEditingInssBracket(null);
    setIsFormOpen(true);
  };

  const handleEditInssBracket = (inssBracket: InssBracket) => {
    setEditingInssBracket(inssBracket);
    setIsFormOpen(true);
  };

  const handleSaveInssBracket = (data: InssBracketInsert) => {
    if (editingInssBracket) {
      updateInssBracket({ id: editingInssBracket.id, data: data as InssBracketUpdate });
    } else {
      createInssBracket(data);
    }
    setIsFormOpen(false);
    setEditingInssBracket(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingInssBracket(null);
  };

  const filteredInssBrackets = inssBrackets.filter(inssBracket =>
    inssBracket.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inssBracket.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando faixas INSS...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Erro ao carregar faixas INSS: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Faixas INSS</CardTitle>
            <Button onClick={handleNewInssBracket} disabled={isCreating}>
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
                placeholder="Buscar faixas INSS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          {filteredInssBrackets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma faixa INSS encontrada.</p>
              <p className="text-sm">Clique em "Nova Faixa" para adicionar a primeira faixa.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredInssBrackets.map((inssBracket) => (
                <div key={inssBracket.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{inssBracket.codigo}</span>
                      <span className="text-sm text-muted-foreground">-</span>
                      <span>{inssBracket.descricao}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      R$ {(inssBracket.valor_minimo || 0).toFixed(2)} - {inssBracket.valor_maximo ? `R$ ${(inssBracket.valor_maximo || 0).toFixed(2)}` : 'Acima'}
                      {` • ${(inssBracket.aliquota || 0)}%`}
                      {` • Dedução: R$ ${(inssBracket.valor_deducao || 0).toFixed(2)}`}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditInssBracket(inssBracket)}
                      disabled={isUpdating}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteInssBracket(inssBracket.id)}
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

      <InssBracketsForm
        inssBracket={editingInssBracket}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveInssBracket}
      />
    </div>
  );
};

