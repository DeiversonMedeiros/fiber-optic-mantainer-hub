import React from 'react';
import { Position } from '@/integrations/supabase/rh-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Edit, Trash2 } from 'lucide-react';

export interface PositionTableProps {
  data: Position[];
  onEdit?: (position: Position) => void;
  onDelete?: (position: Position) => void;
  onView?: (position: Position) => void;
  isLoading?: boolean;
  className?: string;
}

export function PositionTable({
  data,
  onEdit,
  onDelete,
  onView,
  isLoading = false,
  className = ''
}: PositionTableProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Cargos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Carregando cargos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Cargos</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum cargo encontrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome do Cargo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((position) => (
                <TableRow key={position.id}>
                  <TableCell className="font-mono text-sm">
                    {position.codigo}
                  </TableCell>
                  <TableCell className="font-medium">
                    {position.nome}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {position.descricao || 'Sem descrição'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      Nível {position.nivel_hierarquico || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={position.is_active ? 'default' : 'secondary'}>
                      {position.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {onView && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(position)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(position)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(position)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}


