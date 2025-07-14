
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: any;
}

const PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard', description: 'Acesso ao painel principal' },
  { key: 'reports', label: 'Relatórios', description: 'Criar e visualizar relatórios' },
  { key: 'settings', label: 'Configurações', description: 'Acesso às configurações do sistema' },
  { key: 'users', label: 'Usuários', description: 'Gerenciar usuários do sistema' },
  { key: 'analytics', label: 'Analytics', description: 'Acesso a relatórios analíticos' },
  { key: 'preventive', label: 'Manutenção Preventiva', description: 'Gerenciar manutenções preventivas' },
  { key: 'control', label: 'Controle', description: 'Funções de controle e auditoria' },
  { key: 'change-password', label: 'Alterar Senha', description: 'Permitir que o usuário altere sua senha' },
];

const PermissionsModal = ({ isOpen, onClose, profile }: PermissionsModalProps) => {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (profile && profile.permissions) {
      setPermissions(profile.permissions);
    } else {
      setPermissions({});
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async (newPermissions: Record<string, boolean>) => {
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
        title: "Erro",
        description: "Não foi possível atualizar as permissões.",
        variant: "destructive",
      });
    }
  });

  const handlePermissionChange = (key: string, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(permissions);
  };

  if (!profile) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Permissões - {profile.name}</DialogTitle>
          <DialogDescription>
            Defina quais páginas e funcionalidades este perfil pode acessar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Permissões de Acesso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {PERMISSIONS.map((permission) => (
                <div key={permission.key} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={permission.key}
                    checked={permissions[permission.key] || false}
                    onCheckedChange={(checked) => 
                      handlePermissionChange(permission.key, checked === true)
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor={permission.key} className="font-medium">
                      {permission.label}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {permission.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Salvar Permissões'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PermissionsModal;
