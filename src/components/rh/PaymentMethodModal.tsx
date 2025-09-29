import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Building2, Smartphone, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaymentMethod {
  type: 'flash' | 'transfer' | 'pix';
  label: string;
  description: string;
  icon: React.ReactNode;
  isAvailable: boolean;
  restriction?: string;
}

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (method: PaymentMethod) => void;
  benefitType: string;
  amount: number;
  employeeName: string;
  allowedMethods?: string[];
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  benefitType,
  amount,
  employeeName,
  allowedMethods = ['flash', 'transfer', 'pix']
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const paymentMethods: PaymentMethod[] = [
    {
      type: 'flash',
      label: 'Cartão Flash',
      description: 'Pagamento via cartão da empresa Flash',
      icon: <CreditCard className="h-6 w-6" />,
      isAvailable: allowedMethods.includes('flash'),
      restriction: benefitType === 'VR' || benefitType === 'VA' ? 'Obrigatório para VR/VA' : undefined
    },
    {
      type: 'transfer',
      label: 'Transferência Bancária',
      description: 'Transferência para conta do funcionário',
      icon: <Building2 className="h-6 w-6" />,
      isAvailable: allowedMethods.includes('transfer'),
      restriction: benefitType === 'VR' || benefitType === 'VA' ? 'Não permitido para VR/VA' : undefined
    },
    {
      type: 'pix',
      label: 'PIX',
      description: 'PIX para conta do funcionário',
      icon: <Smartphone className="h-6 w-6" />,
      isAvailable: allowedMethods.includes('pix'),
      restriction: benefitType === 'VR' || benefitType === 'VA' ? 'Não permitido para VR/VA' : undefined
    }
  ];

  const handleMethodSelect = (method: PaymentMethod) => {
    if (!method.isAvailable) return;
    setSelectedMethod(method);
  };

  const handleConfirm = () => {
    if (selectedMethod) {
      onSelect(selectedMethod);
      onClose();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getBenefitTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'VR': 'Vale Refeição',
      'VA': 'Vale Alimentação',
      'transporte': 'Transporte',
      'premiacao': 'Premiação',
      'producao': 'Produtividade',
      'equipamento': 'Locação de Equipamentos',
      'Múltiplos Benefícios': 'Múltiplos Benefícios'
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Selecionar Forma de Pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do pagamento */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Funcionário:</span>
                <span className="text-sm font-medium">{employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Benefício:</span>
                <span className="text-sm font-medium">{getBenefitTypeLabel(benefitType)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Valor:</span>
                <span className="text-sm font-bold text-green-600">{formatCurrency(amount)}</span>
              </div>
            </div>
          </div>

          {/* Métodos de pagamento */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Escolha a forma de pagamento:</h3>
            
            {paymentMethods.map((method) => (
              <Card
                key={method.type}
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  method.isAvailable
                    ? "hover:shadow-md hover:border-primary/50"
                    : "opacity-50 cursor-not-allowed",
                  selectedMethod?.type === method.type && "ring-2 ring-primary border-primary"
                )}
                onClick={() => handleMethodSelect(method)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      method.isAvailable ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {method.icon}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{method.label}</h4>
                        {selectedMethod?.type === method.type && (
                          <CheckCircle className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                      
                      {method.restriction && (
                        <Badge 
                          variant={method.isAvailable ? "secondary" : "destructive"}
                          className="mt-1 text-xs"
                        >
                          {method.restriction}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Botões de ação */}
          <div className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedMethod}
              className="flex-1"
            >
              Confirmar Pagamento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodModal;
