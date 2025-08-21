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

interface MaterialChargeWithdrawalModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  checklistItem: {
    id: string;
    name: string;
    currentCharge: number;
  };
}

const MaterialChargeWithdrawalModal: React.FC<MaterialChargeWithdrawalModalProps> = ({
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

  const withdrawChargeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      // Validar se a quantidade não excede o disponível
      if (quantity > checklistItem.currentCharge) {
        throw new Error('Quantidade a retirar não pode exceder a carga disponível');
      }
      
      const { data, error } = await supabase
        .from('material_charges')
        .insert({
          checklist_item_id: checklistItem.id,
          quantity_added: 0, // Para retirada, não adiciona nada
          quantity_withdrawn: quantity,
          operation_type: 'withdrawal',
          sa_code: saCode,
          reason: reason || null,
          created_by: user.id,
          user_id: userId
        })
        .select();
      
      if (error) {
        console.error('Erro ao registrar retirada:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-materials-aggregated'] });
      toast({
        title: "Retirada registrada",
        description: `${quantity} unidades de ${checklistItem.name} foram retiradas da carga com sucesso.`,
      });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Erro na mutação:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível registrar a retirada.",
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
    
    if (quantity > checklistItem.currentCharge) {
      toast({
        title: "Erro",
        description: "A quantidade a retirar não pode exceder a carga disponível.",
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
    
    withdrawChargeMutation.mutate();
  };

  const handleClose = () => {
    setQuantity(1);
    setSaCode('');
    setReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Retirar Material da Carga</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="material-name">Material</Label>
            <Input
              id="material-name"
              value={checklistItem.name}
              disabled
              className="bg-gray-50"
            />
          </div>
          
          <div>
            <Label htmlFor="current-charge">Carga Disponível para Retirada</Label>
            <Input
              id="current-charge"
              value={checklistItem.currentCharge}
              disabled
              className="bg-gray-50"
            />
            <p className="text-sm text-gray-500 mt-1">
              Quantidade líquida (carga - retiradas já feitas)
            </p>
          </div>
          
          <div>
            <Label htmlFor="quantity">Quantidade a Retirar</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={checklistItem.currentCharge}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              placeholder="Digite a quantidade"
            />
            <p className="text-sm text-gray-500 mt-1">
              Máximo disponível: {checklistItem.currentCharge}
            </p>
          </div>
          
          <div>
            <Label htmlFor="sa-code">Código da SA *</Label>
            <Input
              id="sa-code"
              value={saCode}
              onChange={(e) => setSaCode(e.target.value)}
              placeholder="Digite o código da SA"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="reason">Motivo (Opcional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Digite o motivo da retirada"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={withdrawChargeMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {withdrawChargeMutation.isPending ? 'Registrando...' : 'Registrar Retirada'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialChargeWithdrawalModal;
