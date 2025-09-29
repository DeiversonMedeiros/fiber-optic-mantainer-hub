import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

type Props = {
  moduleName: string;
  action?: 'read' | 'create' | 'edit' | 'delete';
  children: React.ReactNode;
};

export const RequirePermission: React.FC<Props> = ({ moduleName, action = 'read', children }) => {
  const { checkModule } = useAuthorization();
  const { data: allowed, isLoading } = useQuery({
    queryKey: ['route-guard', moduleName, action],
    queryFn: () => checkModule(moduleName, action),
  });

  if (isLoading) return null;
  if (!allowed) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              Acesso negado
            </CardTitle>
          </CardHeader>
          <CardContent>
            Você não tem permissão para acessar esta página.
          </CardContent>
        </Card>
      </div>
    );
  }
  return <>{children}</>;
};


