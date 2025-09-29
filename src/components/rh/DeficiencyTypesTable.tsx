import React from 'react';
import { DeficiencyType } from '@/integrations/supabase/rh-types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DeficiencyTypesTableProps {
  deficiencyTypes: DeficiencyType[];
  onEdit: (deficiencyType: DeficiencyType) => void;
  onDelete: (id: string) => void;
  onView: (deficiencyType: DeficiencyType) => void;
  isLoading?: boolean;
}

export function DeficiencyTypesTable({
  deficiencyTypes,
  onEdit,
  onDelete,
  onView,
  isLoading = false,
}: DeficiencyTypesTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Carregando tipos de deficiência...</span>
      </div>
    );
  }

  if (deficiencyTypes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum tipo de deficiência encontrado.</p>
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
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deficiencyTypes.map((deficiencyType) => (
            <TableRow key={deficiencyType.id}>
              <TableCell className="font-medium">
                {deficiencyType.codigo}
              </TableCell>
              <TableCell>{deficiencyType.descricao}</TableCell>
              <TableCell>
                <Badge variant={deficiencyType.is_active ? 'default' : 'secondary'}>
                  {deficiencyType.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(deficiencyType)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(deficiencyType)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o tipo de deficiência{' '}
                          <strong>{deficiencyType.codigo} - {deficiencyType.descricao}</strong>?
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(deficiencyType.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}





















