import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CidCodesForm } from './CidCodesForm';
import { useCidCodes, type CidCode, type CidCodeInsert, type CidCodeUpdate } from '@/hooks/rh/useCidCodes';

export const CidCodesManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCidCode, setEditingCidCode] = useState<CidCode | null>(null);
  
  const {
    cidCodes,
    isLoading,
    error,
    createCidCode,
    updateCidCode,
    deleteCidCode,
    isCreating,
    isUpdating,
    isDeleting
  } = useCidCodes();

  const handleNewCidCode = () => {
    setEditingCidCode(null);
    setIsFormOpen(true);
  };

  const handleEditCidCode = (cidCode: CidCode) => {
    setEditingCidCode(cidCode);
    setIsFormOpen(true);
  };

  const handleSaveCidCode = (data: CidCodeInsert) => {
    if (editingCidCode) {
      updateCidCode({ id: editingCidCode.id, data: data as CidCodeUpdate });
    } else {
      createCidCode(data);
    }
    setIsFormOpen(false);
    setEditingCidCode(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCidCode(null);
  };

  const filteredCidCodes = cidCodes.filter(cidCode =>
    cidCode.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cidCode.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando códigos CID...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Erro ao carregar códigos CID: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Códigos CID</CardTitle>
            <Button onClick={handleNewCidCode} disabled={isCreating}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Código CID
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar códigos CID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          {filteredCidCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum código CID encontrado.</p>
              <p className="text-sm">Clique em "Novo Código CID" para adicionar o primeiro código.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCidCodes.map((cidCode) => (
                <div key={cidCode.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{cidCode.codigo}</span>
                      <span className="text-sm text-muted-foreground">-</span>
                      <span>{cidCode.descricao}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {cidCode.categoria && `Categoria: ${cidCode.categoria}`}
                      {cidCode.max_absence_days && ` • Máx: ${cidCode.max_absence_days} dias`}
                      {cidCode.requires_work_restriction && ' • Requer restrição'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCidCode(cidCode)}
                      disabled={isUpdating}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteCidCode(cidCode.id)}
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

      <CidCodesForm
        cidCode={editingCidCode}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveCidCode}
      />
    </div>
  );
};

