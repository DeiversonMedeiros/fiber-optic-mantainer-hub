
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Buscar dados do perfil do usuário
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Buscar dados relacionados separadamente
  const { data: userClass } = useQuery({
    queryKey: ['user-class', profile?.user_class_id],
    queryFn: async () => {
      if (!profile?.user_class_id) return null;
      
      const { data, error } = await supabase
        .from('user_classes')
        .select('name')
        .eq('id', profile.user_class_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.user_class_id
  });

  const { data: accessProfile } = useQuery({
    queryKey: ['access-profile', profile?.access_profile_id],
    queryFn: async () => {
      if (!profile?.access_profile_id) return null;
      
      const { data, error } = await supabase
        .from('access_profiles')
        .select('name')
        .eq('id', profile.access_profile_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.access_profile_id
  });

  React.useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || ''
      });
    }
  }, [profile]);

  // Mutation para atualizar dados pessoais
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; phone: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setIsEditing(false);
      toast({
        title: "Perfil atualizado",
        description: "Seus dados foram atualizados com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
    }
  });

  // Mutation para atualizar senha
  const updatePasswordMutation = useMutation({
    mutationFn: async ({ newPassword }: { newPassword: string }) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      toast({
        title: "Senha atualizada",
        description: "Sua senha foi alterada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a senha.",
        variant: "destructive",
      });
    }
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }
    
    updatePasswordMutation.mutate({ newPassword: passwordData.newPassword });
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Carregando perfil...</div>;
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
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
                <p className="text-sm text-gray-600">Gerencie suas informações pessoais</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Dados Pessoais</span>
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center space-x-2">
              <Lock className="w-4 h-4" />
              <span>Alterar Senha</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded border">
                          {profile?.name || 'Não informado'}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded border">
                          {profile?.phone || 'Não informado'}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Perfil de Acesso</Label>
                      <div className="p-2 bg-gray-50 rounded border">
                        {accessProfile?.name || 'Não definido'}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Classe</Label>
                      <div className="p-2 bg-gray-50 rounded border">
                        {userClass?.name || 'Não definida'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    {isEditing ? (
                      <>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsEditing(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={updateProfileMutation.isPending}>
                          {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                      </>
                    ) : (
                      <Button type="button" onClick={() => setIsEditing(true)}>
                        Editar Dados
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Senha Atual</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      required
                      minLength={6}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      minLength={6}
                    />
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={updatePasswordMutation.isPending}>
                      {updatePasswordMutation.isPending ? 'Atualizando...' : 'Atualizar Senha'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
