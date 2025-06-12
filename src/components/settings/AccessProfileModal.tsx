
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AccessProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: any;
}

const AccessProfileModal = ({ isOpen, onClose, profile }: AccessProfileModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setDescription(profile.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      if (profile) {
        const { error } = await supabase
          .from('access_profiles')
          .update(data)
          .eq('id', profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('access_profiles')
          .insert([{ ...data, permissions: {} }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-profiles'] });
      toast({
        title: profile ? "Perfil atualizado" : "Perfil criado",
        description: `O perfil de acesso foi ${profile ? 'atualizado' : 'criado'} com sucesso.`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível ${profile ? 'atualizar' : 'criar'} o perfil de acesso.`,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    mutation.mutate({
      name: name.trim(),
      description: description.trim()
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {profile ? 'Editar Perfil de Acesso' : 'Criar Novo Perfil de Acesso'}
          </DialogTitle>
          <DialogDescription>
            {profile 
              ? 'Edite as informações do perfil de acesso.'
              : 'Crie um novo perfil de acesso para o sistema.'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Perfil</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome do perfil"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Digite uma descrição para o perfil"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending 
                ? 'Salvando...' 
                : profile ? 'Atualizar' : 'Criar'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AccessProfileModal;
