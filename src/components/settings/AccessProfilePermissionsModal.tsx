
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SYSTEM_PAGES = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Painel principal do sistema',
    category: 'Principal'
  },
  {
    id: 'my-reports',
    name: 'Meus Relatórios',
    description: 'Visualizar e criar relatórios técnicos',
    category: 'Relatórios'
  },
  {
    id: 'report-validation',
    name: 'Validação de Relatórios',
    description: 'Validar relatórios técnicos',
    category: 'Relatórios'
  },
  {
    id: 'material-control',
    name: 'Controle de Material',
    description: 'Gerenciar materiais e estoque',
    category: 'Material'
  },
  {
    id: 'my-adjustments',
    name: 'Meus Ajustes',
    description: 'Visualizar ajustes de material',
    category: 'Material'
  },
  {
    id: 'preventive-maintenance',
    name: 'Gestão de Preventiva',
    description: 'Gerenciar manutenção preventiva e riscos',
    category: 'Preventiva'
  },
  {
    id: 'preventivas',
    name: 'Preventivas',
    description: 'Visualizar e gerenciar preventivas',
    category: 'Preventiva'
  },
  {
    id: 'vistoria',
    name: 'Vistoria',
    description: 'Realizar vistorias técnicas',
    category: 'Preventiva'
  },
  {
    id: 'users',
    name: 'Gerenciar Usuários',
    description: 'Administrar usuários do sistema',
    category: 'Administração'
  },
  {
    id: 'settings',
    name: 'Configurações',
    description: 'Configurações do sistema',
    category: 'Administração'
  },
  {
    id: 'profile',
    name: 'Meu Perfil',
    description: 'Editar perfil pessoal',
    category: 'Pessoal'
  }
];

const PERMISSION_TYPES = [
  { id: 'view', name: 'Visualizar', description: 'Pode acessar a página' },
  { id: 'create', name: 'Criar', description: 'Pode criar novos registros' },
  { id: 'edit', name: 'Editar', description: 'Pode editar registros existentes' },
  { id: 'delete', name: 'Excluir', description: 'Pode excluir registros' }
];

interface AccessProfilePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: any;
}

const AccessProfilePermissionsModal = ({ isOpen, onClose, profile }: AccessProfilePermissionsModalProps) => {
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (profile?.permissions) {
      setPermissions(profile.permissions);
    } else {
      setPermissions({});
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async (newPermissions: Record<string, string[]>) => {
      const { error } = await supabase
        .from('access_profiles')
        .update({ permissions: newPermissions })
        .eq('id', profile.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-profiles'] });
      toast({
        title: "Permissões atualizadas",
        description: "As permissões do perfil foram atualizadas com sucesso.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar as permissões.",
        variant: "destructive",
      });
    }
  });

  const togglePermission = (pageId: string, permissionType: string) => {
    setPermissions(prev => {
      const newPermissions = { ...prev };
      
      // Ensure we always have an array for the pageId
      if (!Array.isArray(newPermissions[pageId])) {
        newPermissions[pageId] = [];
      }
      
      const currentPermissions = [...newPermissions[pageId]];
      const permissionIndex = currentPermissions.indexOf(permissionType);
      
      if (permissionIndex > -1) {
        currentPermissions.splice(permissionIndex, 1);
      } else {
        currentPermissions.push(permissionType);
      }
      
      newPermissions[pageId] = currentPermissions;
      return newPermissions;
    });
  };

  const hasPermission = (pageId: string, permissionType: string) => {
    const pagePermissions = permissions[pageId];
    return Array.isArray(pagePermissions) && pagePermissions.includes(permissionType);
  };

  const handleSubmit = () => {
    mutation.mutate(permissions);
  };

  const categories = [...new Set(SYSTEM_PAGES.map(page => page.category))];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Configurar Permissões - {profile?.name}
          </DialogTitle>
          <DialogDescription>
            Defina quais páginas e ações este perfil pode acessar no sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {categories.map((category) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {SYSTEM_PAGES.filter(page => page.category === category).map((page) => (
                  <div key={page.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{page.name}</h4>
                        <p className="text-sm text-gray-600">{page.description}</p>
                      </div>
                      <div className="flex gap-2">
                        {Array.isArray(permissions[page.id]) && permissions[page.id].length > 0 && (
                          <Badge variant="secondary">
                            {permissions[page.id].length} permissão(ões)
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {PERMISSION_TYPES.map((permissionType) => (
                        <div key={permissionType.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${page.id}-${permissionType.id}`}
                            checked={hasPermission(page.id, permissionType.id)}
                            onCheckedChange={() => togglePermission(page.id, permissionType.id)}
                          />
                          <label 
                            htmlFor={`${page.id}-${permissionType.id}`}
                            className="text-sm font-medium cursor-pointer"
                            title={permissionType.description}
                          >
                            {permissionType.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando...' : 'Salvar Permissões'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccessProfilePermissionsModal;
