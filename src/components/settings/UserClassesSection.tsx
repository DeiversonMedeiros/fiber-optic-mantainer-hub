
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import UserClassModal from './UserClassModal';

const UserClassesSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userClasses, isLoading } = useQuery({
    queryKey: ['user-classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_classes')
        .select(`
          *,
          access_profiles (
            id,
            name
          )
        `)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_classes')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-classes'] });
      toast({
        title: "Classe excluída",
        description: "A classe de usuário foi excluída com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a classe de usuário.",
        variant: "destructive",
      });
    }
  });

  const handleEdit = (userClass: any) => {
    setSelectedClass(userClass);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedClass(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta classe de usuário?')) {
      deleteClassMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Carregando classes de usuário...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Classes de Usuário</h2>
          <p className="text-gray-600">Gerencie as classes de usuário e seus perfis de acesso</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Criar Nova Classe
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Perfil de Acesso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userClasses?.map((userClass) => (
                <TableRow key={userClass.id}>
                  <TableCell className="font-medium">{userClass.name}</TableCell>
                  <TableCell className="text-gray-600">{userClass.description}</TableCell>
                  <TableCell>
                    {userClass.access_profiles ? (
                      <Badge variant="outline">{userClass.access_profiles.name}</Badge>
                    ) : (
                      <span className="text-gray-400">Não definido</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={userClass.is_active ? "default" : "secondary"}>
                      {userClass.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(userClass.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(userClass)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(userClass.id)}
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

      <UserClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userClass={selectedClass}
      />
    </div>
  );
};

export default UserClassesSection;
