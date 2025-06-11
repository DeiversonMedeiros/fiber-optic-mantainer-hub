
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, CheckSquare, UserPlus } from 'lucide-react';

interface QuickActionsProps {
  onAction: (action: string) => void;
}

const QuickActions = ({ onAction }: QuickActionsProps) => {
  const actions = [
    {
      id: 'create-os',
      label: 'Criar OS',
      icon: Plus,
      description: 'Nova Ordem de Serviço',
      color: 'primary'
    },
    {
      id: 'validate-reports',
      label: 'Validar Relatórios',
      icon: CheckSquare,
      description: 'Pendências de validação',
      color: 'secondary'
    },
    {
      id: 'new-user',
      label: 'Novo Usuário',
      icon: UserPlus,
      description: 'Cadastrar técnico',
      color: 'primary'
    }
  ];

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-1">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-primary">
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant="outline"
              className="w-full justify-start h-auto p-4 hover:bg-primary/5 hover:border-primary/30 transition-all"
              onClick={() => onAction(action.id)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-medium">{action.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default QuickActions;
