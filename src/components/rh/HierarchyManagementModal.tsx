import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Briefcase, 
  Building, 
  ArrowUp, 
  ArrowDown, 
  UserPlus,
  UserMinus,
  Save
} from 'lucide-react';

interface HierarchyManagementModalProps {
  node: any;
  view: 'person' | 'position' | 'cost_center';
  companyId: string;
  onSave?: (changes: any) => void;
}

export function HierarchyManagementModal({ 
  node, 
  view, 
  companyId, 
  onSave 
}: HierarchyManagementModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [changes, setChanges] = useState<any>({});
  const { toast } = useToast();

  const handleSave = () => {
    onSave?.(changes);
    setIsOpen(false);
    setChanges({});
    toast({
      title: 'Sucesso!',
      description: 'Hierarquia atualizada com sucesso.',
    });
  };

  const getViewIcon = () => {
    switch (view) {
      case 'person':
        return <Users className="h-5 w-5 text-blue-600" />;
      case 'position':
        return <Briefcase className="h-5 w-5 text-green-600" />;
      case 'cost_center':
        return <Building className="h-5 w-5 text-purple-600" />;
    }
  };

  const getViewTitle = () => {
    switch (view) {
      case 'person':
        return 'Gerenciar Hierarquia de Funcionários';
      case 'position':
        return 'Gerenciar Hierarquia de Cargos';
      case 'cost_center':
        return 'Gerenciar Hierarquia de Centros de Custo';
    }
  };

  const getViewDescription = () => {
    switch (view) {
      case 'person':
        return 'Defina quem reporta para quem na estrutura organizacional';
      case 'position':
        return 'Organize a hierarquia de cargos e posições';
      case 'cost_center':
        return 'Configure a estrutura hierárquica dos centros de custo';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {getViewIcon()}
          <span className="ml-2">Gerenciar Hierarquia</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getViewIcon()}
            {getViewTitle()}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {getViewDescription()}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Item Selecionado */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Item Selecionado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {getViewIcon()}
                <div>
                  <h3 className="font-medium">{node.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {view === 'person' && node.metadata?.position && (
                      <>Cargo: {node.metadata.position}</>
                    )}
                    {view === 'position' && node.metadata?.employee_count !== undefined && (
                      <>{node.metadata.employee_count} funcionário(s)</>
                    )}
                    {view === 'cost_center' && node.metadata?.employee_count !== undefined && (
                      <>{node.metadata.employee_count} funcionário(s)</>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Hierarquia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supervisor/Gestor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowUp className="h-4 w-4" />
                  Supervisor/Gestor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="supervisor">Quem é o supervisor?</Label>
                  <Select onValueChange={(value) => setChanges({...changes, supervisorId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar supervisor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum (Nível mais alto)</SelectItem>
                      {/* TODO: Carregar lista de supervisores baseado no tipo */}
                      <SelectItem value="supervisor1">Supervisor Exemplo 1</SelectItem>
                      <SelectItem value="supervisor2">Supervisor Exemplo 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {changes.supervisorId && changes.supervisorId !== 'none' && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Nova estrutura:</strong> {node.name} reportará para o supervisor selecionado
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subordinados */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowDown className="h-4 w-4" />
                  Subordinados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Quem reporta para {node.name}?</Label>
                  <div className="space-y-2 mt-2">
                    {/* TODO: Carregar lista de subordinados */}
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">Subordinado Exemplo 1</span>
                      <Button variant="outline" size="sm">
                        <UserMinus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">Subordinado Exemplo 2</span>
                      <Button variant="outline" size="sm">
                        <UserMinus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="addSubordinate">Adicionar Subordinado</Label>
                  <div className="flex gap-2 mt-2">
                    <Select>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecionar para adicionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sub1">Funcionário 1</SelectItem>
                        <SelectItem value="sub2">Funcionário 2</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <UserPlus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visualização da Nova Estrutura */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visualização da Nova Estrutura</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  {/* Supervisor */}
                  {changes.supervisorId && changes.supervisorId !== 'none' && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Supervisor</Badge>
                      <span className="text-sm">Nome do Supervisor</span>
                    </div>
                  )}
                  
                  {/* Item atual */}
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant="default">{node.name}</Badge>
                    <span className="text-sm font-medium">(Item selecionado)</span>
                  </div>
                  
                  {/* Subordinados */}
                  <div className="ml-8 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Subordinado 1</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Subordinado 2</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
