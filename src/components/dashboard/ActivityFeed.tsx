
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Clock, User } from 'lucide-react';

const activities = [
  {
    id: 1,
    action: 'Relatório R254 validado por João',
    type: 'validation',
    time: '5 min atrás',
    status: 'completed'
  },
  {
    id: 2,
    action: 'Novo risco cadastrado na Zona Sul',
    type: 'risk',
    time: '12 min atrás',
    status: 'warning'
  },
  {
    id: 3,
    action: 'Manutenção preventiva agendada',
    type: 'maintenance',
    time: '25 min atrás',
    status: 'pending'
  },
  {
    id: 4,
    action: 'Técnico Carlos em campo - OS #1847',
    type: 'field',
    time: '1 hora atrás',
    status: 'active'
  },
  {
    id: 5,
    action: 'Material consumido: Cabo 50m',
    type: 'material',
    time: '2 horas atrás',
    status: 'completed'
  },
];

const getIcon = (type: string) => {
  switch (type) {
    case 'validation':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'risk':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case 'maintenance':
      return <Clock className="h-4 w-4 text-blue-600" />;
    case 'field':
      return <User className="h-4 w-4 text-primary" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">Concluído</Badge>;
    case 'warning':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">Atenção</Badge>;
    case 'pending':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">Pendente</Badge>;
    case 'active':
      return <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30">Ativo</Badge>;
    default:
      return <Badge variant="outline">Status</Badge>;
  }
};

const ActivityFeed = () => {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-primary">
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="mt-0.5">
              {getIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {activity.action}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {activity.time}
                </span>
                {getStatusBadge(activity.status)}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
