
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
  { id: 'dashboard', name: 'Dashboard', description: 'Painel principal do sistema', category: 'Principal' },
  { id: 'my-reports', name: 'Meus Relatórios', description: 'Visualizar e criar relatórios técnicos', category: 'Relatórios' },
  { id: 'report-validation', name: 'Validação de Relatórios', description: 'Validar relatórios técnicos', category: 'Relatórios' },
  { id: 'material-control', name: 'Controle de Material', description: 'Gerenciar materiais e estoque', category: 'Material' },
  { id: 'my-adjustments', name: 'Minhas Adequações', description: 'Visualizar ajustes de material', category: 'Material' },
  { id: 'preventive-maintenance', name: 'Gestão de Preventiva', description: 'Gerenciar manutenção preventiva e riscos', category: 'Preventiva' },
  { id: 'preventivas', name: 'Preventivas', description: 'Visualizar e gerenciar preventivas', category: 'Preventiva' },
  { id: 'vistoria', name: 'Vistoria', description: 'Realizar vistorias técnicas', category: 'Preventiva' },
  { id: 'users', name: 'Gerenciar Usuários', description: 'Administrar usuários do sistema', category: 'Administração' },
  { id: 'settings', name: 'Configurações', description: 'Configurações do sistema', category: 'Administração' },
  { id: 'change-password', name: 'Alterar Senha', description: 'Permitir que o usuário altere sua senha', category: 'Pessoal' },
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
  // Novo estado: array de páginas permitidas
  const [permissions, setPermissions] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (Array.isArray(profile?.permissions)) {
      setPermissions(profile.permissions);
    } else if (typeof profile?.permissions === 'string') {
      try {
        const arr = JSON.parse(profile.permissions);
        if (Array.isArray(arr)) setPermissions(arr);
        else setPermissions([]);
      } catch {
        setPermissions([]);
      }
    } else {
      setPermissions([]);
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async (newPermissions: string[]) => {
      if (!profile?.id) throw new Error("Perfil não encontrado");
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
    onError: (error: any) => {
      console.log('Erro no onError:', error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const togglePage = (pageId: string) => {
    setPermissions(prev =>
      prev.includes(pageId)
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
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
                  <div key={page.id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{page.name}</h4>
                      <p className="text-sm text-gray-600">{page.description}</p>
                    </div>
                    <div>
                      <Checkbox
                        id={page.id}
                        checked={permissions.includes(page.id)}
                        onCheckedChange={() => togglePage(page.id)}
                      />
                      <label htmlFor={page.id} className="ml-2 text-sm font-medium cursor-pointer">
                        Permitir acesso
                      </label>
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
