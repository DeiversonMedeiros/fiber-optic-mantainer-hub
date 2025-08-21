import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface MaterialChargeModalProps {
  userId: string; // Nova prop
  isOpen: boolean;
  onClose: () => void;
  checklistItem: {
    id: string;
    name: string;
    category: string;
  };
}

const MaterialChargeModal: React.FC<MaterialChargeModalProps> = ({
  userId,
  isOpen,
  onClose,
  checklistItem
}) => {
  const [quantity, setQuantity] = useState(1);
  const [saCode, setSaCode] = useState('');
  const [reason, setReason] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addChargeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('material_charges')
        .insert({
          checklist_item_id: checklistItem.id,
          quantity_added: quantity,
          quantity_withdrawn: 0,
          operation_type: 'charge',
          sa_code: saCode,
          reason: reason || null,
          created_by: user.id,
          user_id: userId
        })
        .select();
      
      if (error) {
        console.error('Erro ao inserir carga:', error);
        throw error;
      }
      
      return data;
    },
          onSuccess: (data) => {
      // ✅ Invalidar todas as chaves relacionadas ao novo sistema
      queryClient.invalidateQueries({ queryKey: ['users-basic'] });
      queryClient.invalidateQueries({ queryKey: ['user-materials-aggregated'] });
      
      toast({
        title: "Carga adicionada",
        description: `${quantity} unidades de ${checklistItem.name} foram adicionadas com sucesso.`,
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Erro na mutação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a carga.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || quantity <= 0) {
      toast({
        title: "Erro",
        description: "A quantidade deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }
    if (!saCode.trim()) {
      toast({
        title: "Erro",
        description: "O código da SA é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    addChargeMutation.mutate();
  };

  const handleClose = () => {
    setQuantity(1);
    setSaCode('');
    setReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Carga - {checklistItem.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sa-code">Código da SA</Label>
            <Input
              id="sa-code"
              value={saCode}
              onChange={(e) => setSaCode(e.target.value)}
              placeholder="Digite o código da SA"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Digite o motivo da carga"
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={addChargeMutation.isPending}>
              {addChargeMutation.isPending ? 'Adicionando...' : 'Adicionar Carga'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialChargeModal; 
