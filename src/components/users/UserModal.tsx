
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
}

const UserModal = ({ isOpen, onClose, user }: UserModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    userClassId: '',
    accessProfileId: '',
    managerId: '',
    password: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar classes de usuário
  const { data: userClasses = [] } = useQuery({
    queryKey: ['user-classes-modal'],
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

  // Buscar perfis de acesso
  const { data: accessProfiles = [] } = useQuery({
    queryKey: ['access-profiles-modal'],
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

  // Buscar gestores (usuários com role gestor ou admin)
  const { data: managers = [] } = useQuery({
    queryKey: ['managers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .in('role', ['gestor', 'admin'])
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        userClassId: user.user_class_id || '',
        accessProfileId: user.access_profile_id || '',
        managerId: user.manager_id || '',
        password: ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        userClassId: '',
        accessProfileId: '',
        managerId: '',
        password: ''
      });
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (user) {
        // Atualizar usuário existente
        const { error } = await supabase
          .from('profiles')
          .update({
            name: data.name,
            phone: data.phone,
            user_class_id: data.userClassId || null,
            access_profile_id: data.accessProfileId || null,
            manager_id: data.managerId || null
          })
          .eq('id', user.id);
        
        if (error) throw error;
      } else {
        // Criar novo usuário
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: true,
          user_metadata: {
            name: data.name
          }
        });
        
        if (authError) throw authError;
        
        // Atualizar o perfil com dados adicionais
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              name: data.name,
              phone: data.phone,
              user_class_id: data.userClassId || null,
              access_profile_id: data.accessProfileId || null,
              manager_id: data.managerId || null
            })
            .eq('id', authData.user.id);
          
          if (profileError) throw profileError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: user ? "Usuário atualizado" : "Usuário criado",
        description: `O usuário foi ${user ? 'atualizado' : 'criado'} com sucesso.`,
      });
      onClose();
    },
    onError: (error) => {
      console.error('Error creating/updating user:', error);
      toast({
        title: "Erro",
        description: `Não foi possível ${user ? 'atualizar' : 'criar'} o usuário.`,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || (!user && !formData.email.trim())) {
      toast({
        title: "Erro",
        description: "Nome e email são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    if (!user && !formData.password) {
      toast({
        title: "Erro",
        description: "Senha é obrigatória para novos usuários.",
        variant: "destructive",
      });
      return;
    }
    
    mutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {user ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
          </DialogTitle>
          <DialogDescription>
            {user 
              ? 'Edite as informações do usuário.'
              : 'Preencha os dados para criar um novo usuário.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome completo"
              required
            />
          </div>
          
          {!user && (
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Digite o email"
                required
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Digite o telefone"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="userClass">Classe</Label>
            <Select value={formData.userClassId} onValueChange={(value) => setFormData(prev => ({ ...prev, userClassId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma classe" />
              </SelectTrigger>
              <SelectContent>
                {userClasses.map((userClass) => (
                  <SelectItem key={userClass.id} value={userClass.id}>
                    {userClass.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accessProfile">Perfil de Acesso</Label>
            <Select value={formData.accessProfileId} onValueChange={(value) => setFormData(prev => ({ ...prev, accessProfileId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um perfil de acesso" />
              </SelectTrigger>
              <SelectContent>
                {accessProfiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="manager">Gestor</Label>
            <Select value={formData.managerId} onValueChange={(value) => setFormData(prev => ({ ...prev, managerId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um gestor" />
              </SelectTrigger>
              <SelectContent>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {!user && (
            <div className="space-y-2">
              <Label htmlFor="password">Senha Provisória *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Digite uma senha provisória"
                required
                minLength={6}
              />
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending 
                ? 'Salvando...' 
                : user ? 'Atualizar' : 'Criar Usuário'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserModal;
