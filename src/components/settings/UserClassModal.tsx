
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  userClass?: any;
}

const UserClassModal = ({ isOpen, onClose, userClass }: UserClassModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [accessProfileId, setAccessProfileId] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accessProfiles } = useQuery({
    queryKey: ['access-profiles-for-select'],
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

  useEffect(() => {
    if (userClass) {
      setName(userClass.name);
      setDescription(userClass.description || '');
      setAccessProfileId(userClass.access_profile_id || '');
    } else {
      setName('');
      setDescription('');
      setAccessProfileId('');
    }
  }, [userClass]);

  const mutation = useMutation({
    mutationFn: async (data: { name: string; description: string; access_profile_id: string | null }) => {
      if (userClass) {
        const { error } = await supabase
          .from('user_classes')
          .update(data)
          .eq('id', userClass.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_classes')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-classes'] });
      toast({
        title: userClass ? "Classe atualizada" : "Classe criada",
        description: `A classe de usuário foi ${userClass ? 'atualizada' : 'criada'} com sucesso.`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível ${userClass ? 'atualizar' : 'criar'} a classe de usuário.`,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    mutation.mutate({
      name: name.trim(),
      description: description.trim(),
      access_profile_id: accessProfileId || null
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {userClass ? 'Editar Classe de Usuário' : 'Criar Nova Classe de Usuário'}
          </DialogTitle>
          <DialogDescription>
            {userClass 
              ? 'Edite as informações da classe de usuário.'
              : 'Crie uma nova classe de usuário para o sistema.'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Classe</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome da classe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Digite uma descrição para a classe"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="access-profile">Perfil de Acesso</Label>
            <Select value={accessProfileId} onValueChange={setAccessProfileId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um perfil de acesso" />
              </SelectTrigger>
              <SelectContent>
                {accessProfiles?.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending 
                ? 'Salvando...' 
                : userClass ? 'Atualizar' : 'Criar'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserClassModal;
