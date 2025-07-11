import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AccessProfileModal from './AccessProfileModal';
import AccessProfilePermissionsModal from './AccessProfilePermissionsModal';
import type { Tables } from '@/integrations/supabase/types';

type AccessProfile = Tables<'access_profiles'>;

const AccessProfilesSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<AccessProfile | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['access-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_profiles')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('access_profiles')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-profiles'] });
      toast({
        title: "Perfil excluído",
        description: "O perfil de acesso foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o perfil de acesso.",
        variant: "destructive",
      });
    }
  });

  const handleEdit = (profile: AccessProfile) => {
    setSelectedProfile(profile);
    setIsModalOpen(true);
  };

  const handleEditPermissions = (profile: AccessProfile) => {
    setSelectedProfile(profile);
    setIsPermissionsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedProfile(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este perfil de acesso?')) {
      deleteProfileMutation.mutate(id);
    }
  };

  const getPermissionCount = (permissions: any): number => {
    if (!permissions) return 0;
    if (Array.isArray(permissions)) return permissions.length;
    if (typeof permissions === 'string') {
      try {
        const arr = JSON.parse(permissions);
        if (Array.isArray(arr)) return arr.length;
        if (typeof arr === 'object' && arr !== null) {
          return Object.values(arr as Record<string, any>).reduce((total: number, v: any) => Array.isArray(v) ? Number(total) + v.length : Number(total), 0);
        }
      } catch {
        return 0;
      }
    }
    if (typeof permissions === 'object' && permissions !== null) {
      return Object.values(permissions as Record<string, any>).reduce((total: number, v: any) => Array.isArray(v) ? Number(total) + v.length : Number(total), 0);
    }
    return 0;
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Carregando perfis de acesso...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Perfis de Acesso</h2>
          <p className="text-gray-600">Gerencie os perfis de acesso e suas permissões no sistema</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Criar Novo Perfil
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Permissões</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles?.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.name}</TableCell>
                  <TableCell className="text-gray-600">{profile.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getPermissionCount(profile.permissions)} permissão(ões)
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={profile.is_active ? "default" : "secondary"}>
                      {profile.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(profile.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPermissions(profile)}
                        title="Configurar Permissões"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(profile)}
                        title="Editar Perfil"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(profile.id)}
                        title="Excluir Perfil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AccessProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        profile={selectedProfile}
      />

      <AccessProfilePermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        profile={selectedProfile}
      />
    </div>
  );
};

export default AccessProfilesSection;
