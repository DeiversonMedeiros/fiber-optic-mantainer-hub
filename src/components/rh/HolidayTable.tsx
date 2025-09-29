// @ts-nocheck
import React from 'react';
import { Holiday } from '@/integrations/supabase/rh-types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Edit, Trash2, Calendar, MapPin } from 'lucide-react';

interface HolidayTableProps {
  holidays: Holiday[];
  onEdit: (holiday: Holiday) => void;
  onDelete: (id: string) => void;
}

export const HolidayTable = ({ holidays, onEdit, onDelete }: HolidayTableProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'nacional':
        return 'secondary';
      case 'estadual':
        return 'secondary';
      case 'municipal':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'nacional':
        return 'text-blue-900';
      case 'estadual':
        return 'text-green-900';
      case 'municipal':
        return 'text-purple-900';
      default:
        return 'text-gray-900';
    }
  };

  if (holidays.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum feriado encontrado</h3>
        <p className="text-gray-500">Comece adicionando feriados nacionais ou criando novos feriados.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Localização</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {holidays.map((holiday) => (
            <TableRow key={holiday.id}>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{formatDate(holiday.data)}</span>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{holiday.nome}</div>
                  {holiday.observacoes && (
                    <div className="text-sm text-gray-500">{holiday.observacoes}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getTipoBadgeVariant(holiday.tipo)}>
                  <span className={getTipoColor(holiday.tipo)}>
                    {holiday.tipo.charAt(0).toUpperCase() + holiday.tipo.slice(1)}
                  </span>
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {holiday.tipo === 'nacional' && 'Nacional'}
                    {holiday.tipo === 'estadual' && (holiday.estado || 'Estado')}
                    {holiday.tipo === 'municipal' && (holiday.cidade || 'Município')}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={holiday.is_active ? 'default' : 'secondary'}>
                  {holiday.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(holiday)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(holiday.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
