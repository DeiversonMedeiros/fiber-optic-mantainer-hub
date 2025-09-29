import React from 'react';
import { Unit } from '@/integrations/supabase/rh-types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, MoreHorizontal, Move, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UnitsTableProps {
  units: Unit[];
  onEdit: (unit: Unit) => void;
  onDelete: (id: string) => void;
  onView: (unit: Unit) => void;
  onMove: (id: string, newParentId: string | null) => void;
  isLoading?: boolean;
  unitsForSelect: Array<{ id: string; codigo: string; nome: string; parent_id: string | null }>;
}

export function UnitsTable({ 
  units, 
  onEdit, 
  onDelete, 
  onView, 
  onMove,
  isLoading = false,
  unitsForSelect
}: UnitsTableProps) {
  const [expandedUnits, setExpandedUnits] = React.useState<Set<string>>(new Set());

  const toggleExpanded = (unitId: string) => {
    setExpandedUnits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(unitId)) {
        newSet.delete(unitId);
      } else {
        newSet.add(unitId);
      }
      return newSet;
    });
  };

  const renderUnitRow = (unit: Unit, level: number = 0) => {
    const isExpanded = expandedUnits.has(unit.id);
    const hasChildren = unit.children && unit.children.length > 0;

    return (
      <React.Fragment key={unit.id}>
        <TableRow>
          <TableCell className="font-medium">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 20}px` }}>
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => toggleExpanded(unit.id)}
                >
                  <ChevronRight 
                    className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                  />
                </Button>
              )}
              {!hasChildren && <div className="w-6" />}
              <span>{unit.codigo}</span>
            </div>
          </TableCell>
          <TableCell>
            <div className="max-w-[200px] truncate" title={unit.nome}>
              {unit.nome}
            </div>
          </TableCell>
          <TableCell>
            <div className="max-w-[150px] truncate text-muted-foreground" title={unit.descricao || ''}>
              {unit.descricao || '-'}
            </div>
          </TableCell>
          <TableCell>
            <Badge variant="outline">
              Nível {unit.nivel_hierarquico}
            </Badge>
          </TableCell>
          <TableCell>
            {unit.parent ? (
              <div className="text-sm">
                <div className="font-medium">{unit.parent.codigo}</div>
                <div className="text-muted-foreground truncate max-w-[100px]">
                  {unit.parent.nome}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">Raiz</span>
            )}
          </TableCell>
          <TableCell>
            <Badge variant={unit.is_active ? 'default' : 'secondary'}>
              {unit.is_active ? 'Ativa' : 'Inativa'}
            </Badge>
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(unit)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(unit)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onMove(unit.id, null)}>
                  <Move className="h-4 w-4 mr-2" />
                  Mover para Raiz
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(unit.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
        {isExpanded && hasChildren && unit.children.map(child => 
          renderUnitRow(child, level + 1)
        )}
      </React.Fragment>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground mb-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <span className="text-2xl">🏢</span>
          </div>
          <p className="text-lg font-medium">Nenhuma unidade encontrada</p>
          <p className="text-sm">Crie sua primeira unidade para começar</p>
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
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Nível</TableHead>
            <TableHead>Unidade Pai</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.map(unit => renderUnitRow(unit))}
        </TableBody>
      </Table>
    </div>
  );
}
































































