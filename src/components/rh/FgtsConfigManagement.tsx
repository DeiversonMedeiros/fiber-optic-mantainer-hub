import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useFgtsConfig, type FgtsConfig, type FgtsConfigInsert, type FgtsConfigUpdate } from '@/hooks/rh/useFgtsConfig';
import { FgtsConfigForm } from './FgtsConfigForm';

export const FgtsConfigManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFgtsConfig, setEditingFgtsConfig] = useState<FgtsConfig | null>(null);
  
  const {
    fgtsConfigs,
    isLoading,
    error,
    createFgtsConfig,
    updateFgtsConfig,
    deleteFgtsConfig,
    isCreating,
    isUpdating,
    isDeleting
  } = useFgtsConfig();

  const handleNewFgtsConfig = () => {
    setEditingFgtsConfig(null);
    setIsFormOpen(true);
  };

  const handleEditFgtsConfig = (fgtsConfig: FgtsConfig) => {
    setEditingFgtsConfig(fgtsConfig);
    setIsFormOpen(true);
  };

  const handleSaveFgtsConfig = (data: FgtsConfigInsert) => {
    if (editingFgtsConfig) {
      updateFgtsConfig({ id: editingFgtsConfig.id, data: data as FgtsConfigUpdate });
    } else {
      createFgtsConfig(data);
    }
    setIsFormOpen(false);
    setEditingFgtsConfig(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingFgtsConfig(null);
  };

  const filteredFgtsConfigs = fgtsConfigs.filter(fgtsConfig =>
    fgtsConfig.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fgtsConfig.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando configurações FGTS...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Erro ao carregar configurações FGTS: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Configurações FGTS</CardTitle>
            <Button onClick={handleNewFgtsConfig} disabled={isCreating}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Configuração
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar configurações FGTS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          {filteredFgtsConfigs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma configuração FGTS encontrada.</p>
              <p className="text-sm">Clique em "Nova Configuração" para adicionar a primeira configuração.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFgtsConfigs.map((fgtsConfig) => (
                <div key={fgtsConfig.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{fgtsConfig.codigo}</span>
                      <span className="text-sm text-muted-foreground">-</span>
                      <span>{fgtsConfig.descricao}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Alíquota: {(fgtsConfig.aliquota || 0)}%
                      {fgtsConfig.valor_maximo && ` • Máx: R$ ${(fgtsConfig.valor_maximo || 0).toFixed(2)}`}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditFgtsConfig(fgtsConfig)}
                      disabled={isUpdating}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteFgtsConfig(fgtsConfig.id)}
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

      <FgtsConfigForm
        fgtsConfig={editingFgtsConfig}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveFgtsConfig}
      />
    </div>
  );
};

