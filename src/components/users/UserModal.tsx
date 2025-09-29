
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { coreSupabase } from '@/integrations/supabase/client';
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
    username: '',
    phone: '',
    profileId: '',
    managerId: '',
    password: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar perfis
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles-modal'],
    queryFn: async () => {
      const { data, error } = await coreSupabase
        .from('profiles')
        .select('id, nome')
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  });

  // Buscar gestores (usuários com perfil de gestor)
  const { data: managers = [] } = useQuery({
    queryKey: ['managers'],
    queryFn: async () => {
      const { data, error } = await coreSupabase
        .from('users')
        .select(`
          id, 
          name,
          profiles!inner(nome)
        `)
        .eq('is_active', true)
        .ilike('profiles.nome', '%gestor%')
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
        username: user.username || '',
        phone: user.phone || '',
        profileId: user.profile_id || '',
        managerId: user.manager_id || '',
        password: ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        username: '',
        phone: '',
        profileId: '',
        managerId: '',
        password: ''
      });
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (user) {
        // Montar payload sem campos nulos
        const updatePayload: any = {
          name: data.name,
          username: data.username,
          phone: data.phone,
          profile_id: data.profileId || null,
        };
        if (data.managerId) updatePayload.manager_id = data.managerId;
        console.log('Payload final do update:', updatePayload);
        const { data: updateData, error } = await coreSupabase
          .from('users')
          .update(updatePayload)
          .eq('id', user.id)
          .select();
        console.log('Resposta do update:', updateData, error);
        if (error) throw error;
        if (!updateData || updateData.length === 0) {
          throw new Error('Nenhuma linha foi atualizada. Verifique se o ID do usuário está correto e se os dados realmente mudaram.');
        }
      } else {
        // Criar novo usuário usando Edge Function
        if (!user) {
          // Log do payload antes de enviar para create-user
          console.log('Payload enviado para create-user:', {
            email: data.email,
            password: data.password,
            name: data.name,
            username: data.username,
            phone: data.phone,
            profileId: data.profileId,
            managerId: data.managerId
          });
        }
        const { data: result, error: createError } = await supabase.functions.invoke('create-user', {
          body: {
            email: data.email,
            password: data.password,
            name: data.name,
            username: data.username,
            phone: data.phone,
            profileId: data.profileId,
            managerId: data.managerId
          }
        });
        
        if (createError) {
          console.error('Create user error:', createError);
          throw createError;
        }
        
        if (result?.error) {
          console.error('Create user function error:', result.error);
          throw new Error(result.error);
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
            <Label htmlFor="username">Nome de Usuário *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Digite o nome de usuário"
              required
            />
          </div>
          
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
            <Label htmlFor="profile">Perfil</Label>
            <Select value={formData.profileId} onValueChange={(value) => setFormData(prev => ({ ...prev, profileId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um perfil" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.nome}
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
