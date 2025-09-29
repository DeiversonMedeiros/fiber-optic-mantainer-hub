import React from 'react';
import { Rubrica } from '@/integrations/supabase/rh-types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RubricasTableProps {
  rubricas: Rubrica[];
  onEdit: (rubrica: Rubrica) => void;
  onDelete: (id: string) => void;
  onView: (rubrica: Rubrica) => void;
  isLoading?: boolean;
}

export function RubricasTable({ 
  rubricas, 
  onEdit, 
  onDelete, 
  onView, 
  isLoading = false 
}: RubricasTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (rubricas.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground mb-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-lg font-medium">Nenhuma rubrica encontrada</p>
          <p className="text-sm">Crie sua primeira rubrica para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Natureza eSocial</TableHead>
            <TableHead>Referência</TableHead>
            <TableHead>Unidade</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rubricas.map((rubrica) => (
            <TableRow key={rubrica.id}>
              <TableCell className="font-medium">
                {rubrica.codigo}
              </TableCell>
              <TableCell>
                <div className="max-w-[200px] truncate" title={rubrica.descricao}>
                  {rubrica.descricao}
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={rubrica.tipo === 'provento' ? 'default' : 'destructive'}
                  className="capitalize"
                >
                  {rubrica.tipo}
                </Badge>
              </TableCell>
              <TableCell>
                {rubrica.natureza_esocial_id ? (
                  <div className="text-sm">
                    <div className="font-medium">ID: {rubrica.natureza_esocial_id}</div>
                    <div className="text-muted-foreground truncate max-w-[150px]">
                      Natureza eSocial
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {rubrica.referencia || '-'}
              </TableCell>
              <TableCell>
                {rubrica.unidade || '-'}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(rubrica)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(rubrica)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(rubrica.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
