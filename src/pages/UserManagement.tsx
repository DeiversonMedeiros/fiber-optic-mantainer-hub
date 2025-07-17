
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, Plus, Users, ArrowLeft, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import UserModal from '@/components/users/UserModal';

interface User {
  id: string;
  name: string;
  username?: string; // ADICIONADO
  phone?: string;
  is_active: boolean;
  user_class_id?: string;
  access_profile_id?: string;
  manager_id?: string;
}

interface UserClass {
  id: string;
  name: string;
}

interface AccessProfile {
  id: string;
  name: string;
}

interface UserWithRelations extends User {
  user_class_name?: string;
  access_profile_name?: string;
  manager_name?: string;
}

const UserManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRelations | null>(null);
  const [filters, setFilters] = useState({
    name: '',
    userClass: '',
    accessProfile: '',
    status: ''
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Consulta simplificada de usuários sem JOINs problemáticos
  const { data: users = [], isLoading, error: usersError } = useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      console.log('Fetching users with basic query');
      
      try {
        // Buscar usuários básicos primeiro
        let query = supabase
          .from('profiles')
          .select('id, name, username, phone, is_active, user_class_id, access_profile_id, manager_id') // ADICIONADO username
          .order('name');

        // Aplicar filtros
        if (filters.name) {
          query = query.ilike('name', `%${filters.name}%`);
        }
        if (filters.userClass && filters.userClass !== 'all') {
          query = query.eq('user_class_id', filters.userClass);
        }
        if (filters.accessProfile && filters.accessProfile !== 'all') {
          query = query.eq('access_profile_id', filters.accessProfile);
        }
        if (filters.status && filters.status !== 'all') {
          query = query.eq('is_active', filters.status === 'ativo');
        }

        const { data: profiles, error } = await query;
        
        if (error) {
          console.error('Error fetching users:', error);
          throw error;
        }

        console.log('Fetched profiles successfully:', profiles?.length || 0);

        if (!profiles || profiles.length === 0) {
          return [];
        }

        // Buscar nomes das classes de usuário
        const userClassIds = [...new Set(profiles.map(p => p.user_class_id).filter(Boolean))];
        const { data: userClasses } = userClassIds.length > 0 ? 
          await supabase
            .from('user_classes')
            .select('id, name')
            .in('id', userClassIds) : { data: [] };

        // Buscar nomes dos perfis de acesso
        const accessProfileIds = [...new Set(profiles.map(p => p.access_profile_id).filter(Boolean))];
        const { data: accessProfiles } = accessProfileIds.length > 0 ? 
          await supabase
            .from('access_profiles')
            .select('id, name')
            .in('id', accessProfileIds) : { data: [] };

        // Buscar nomes dos gestores
        const managerIds = [...new Set(profiles.map(p => p.manager_id).filter(Boolean))];
        const { data: managers } = managerIds.length > 0 ? 
          await supabase
            .from('profiles')
            .select('id, name')
            .in('id', managerIds) : { data: [] };

        // Criar mapas para lookup rápido
        const userClassMap = new Map((userClasses || []).map(uc => [uc.id, uc.name]));
        const accessProfileMap = new Map((accessProfiles || []).map(ap => [ap.id, ap.name]));
        const managerMap = new Map((managers || []).map(m => [m.id, m.name]));

        // Combinar os dados
        const usersWithRelations: UserWithRelations[] = profiles.map((profile) => ({
          id: profile.id,
          name: profile.name,
          username: profile.username, // ADICIONADO
          phone: profile.phone,
          is_active: profile.is_active,
          user_class_id: profile.user_class_id,
          access_profile_id: profile.access_profile_id,
          manager_id: profile.manager_id,
          user_class_name: profile.user_class_id ? userClassMap.get(profile.user_class_id) : undefined,
          access_profile_name: profile.access_profile_id ? accessProfileMap.get(profile.access_profile_id) : undefined,
          manager_name: profile.manager_id ? managerMap.get(profile.manager_id) : undefined
        }));

        console.log('Users with relations:', usersWithRelations);
        return usersWithRelations;
      } catch (error) {
        console.error('Error in users query:', error);
        throw error;
      }
    }
  });

  // Log de erro para debug
  if (usersError) {
    console.error('Users query error:', usersError);
  }

  // Buscar classes de usuário para filtros
  const { data: userClasses = [] } = useQuery<UserClass[]>({
    queryKey: ['user-classes-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_classes')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Buscar perfis de acesso para filtros
  const { data: accessProfiles = [] } = useQuery<AccessProfile[]>({
    queryKey: ['access-profiles-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_profiles')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Mutation para desativar usuário
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !isActive })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: isActive ? "Usuário desativado" : "Usuário reativado",
        description: `O usuário foi ${isActive ? 'desativado' : 'reativado'} com sucesso.`,
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do usuário.",
        variant: "destructive",
      });
    }
  });

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: UserWithRelations) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (user: UserWithRelations) => {
    const action = user.is_active ? 'desativar' : 'reativar';
    if (window.confirm(`Tem certeza que deseja ${action} este usuário?`)) {
      toggleUserStatusMutation.mutate({ id: user.id, isActive: user.is_active });
    }
  };

  const clearFilters = () => {
    setFilters({
      name: '',
      userClass: 'all',
      accessProfile: 'all',
      status: 'all'
    });
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Carregando usuários...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
                <p className="text-sm text-gray-600">Administração de usuários do sistema</p>
              </div>
            </div>
            
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Novo Usuário
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-8">
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Input
                  className="w-full"
                  placeholder="Buscar por nome..."
                  value={filters.name}
                  onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div>
                <Select value={filters.userClass} onValueChange={(value) => setFilters(prev => ({ ...prev, userClass: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Classe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as classes</SelectItem>
                    {userClasses.map((userClass) => (
                      <SelectItem key={userClass.id} value={userClass.id}>
                        {userClass.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select value={filters.accessProfile} onValueChange={(value) => setFilters(prev => ({ ...prev, accessProfile: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Perfil de Acesso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os perfis</SelectItem>
                    {accessProfiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Usuários */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>Nome de Usuário</TableHead> {/* NOVO */}
                    <TableHead>Telefone</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead>Perfil de Acesso</TableHead>
                    <TableHead>Gestor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.username || '-'}</TableCell> {/* NOVO */}
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>{user.user_class_name || '-'}</TableCell>
                      <TableCell>{user.access_profile_name || '-'}</TableCell>
                      <TableCell>{user.manager_name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-w-[44px] min-h-[44px] self-center"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-w-[44px] min-h-[44px] self-center"
                            onClick={() => handleToggleStatus(user)}
                            disabled={toggleUserStatusMutation.isPending}
                          >
                            {user.is_active ? (
                              <Trash2 className="w-4 h-4" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <UserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          user={selectedUser}
        />
      </main>
    </div>
  );
};

export default UserManagement;
