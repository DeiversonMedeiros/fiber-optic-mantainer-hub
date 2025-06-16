
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface MaterialAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  materialId: string;
  onSuccess: () => void;
}

const MaterialAdjustmentModal: React.FC<MaterialAdjustmentModalProps> = ({
  isOpen,
  onClose,
  userId,
  materialId,
  onSuccess
}) => {
  const [quantity, setQuantity] = useState('');
  const [saCode, setSaCode] = useState('');
  const [reason, setReason] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createAdjustmentMutation = useMutation({
    mutationFn: async () => {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('material_adjustments')
        .insert({
          user_id: userId,
          material_id: materialId,
          quantity_reduced: parseInt(quantity),
          sa_code: saCode,
          reason: reason || null,
          created_by: currentUser.user.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-materials'] });
      toast({
        title: "Baixa registrada",
        description: "A baixa do material foi registrada com sucesso",
      });
      onSuccess();
      handleClose();
    },
    onError: (error) => {
      console.error('Erro ao registrar baixa:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar a baixa do material",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!quantity || !saCode) {
      toast({
        title: "Campos obrigatórios",
        description: "Quantidade e Código da SA são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (parseInt(quantity) <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "A quantidade deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    createAdjustmentMutation.mutate();
  };

  const handleClose = () => {
    setQuantity('');
    setSaCode('');
    setReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Baixa de Material</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="quantity">Quantidade a Reduzir*</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Digite a quantidade"
              required
            />
          </div>

          <div>
            <Label htmlFor="saCode">Código da SA*</Label>
            <Input
              id="saCode"
              value={saCode}
              onChange={(e) => setSaCode(e.target.value)}
              placeholder="Digite o código de autorização"
              required
            />
          </div>

          <div>
            <Label htmlFor="reason">Motivo (Opcional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo da baixa..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createAdjustmentMutation.isPending}
            >
              {createAdjustmentMutation.isPending ? 'Registrando...' : 'Registrar Baixa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialAdjustmentModal;
