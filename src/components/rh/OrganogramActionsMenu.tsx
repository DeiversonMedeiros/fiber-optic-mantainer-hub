import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  User, 
  Edit, 
  Trash2, 
  Eye, 
  Users,
  ArrowUp,
  ArrowDown,
  Move
} from 'lucide-react';
import { OrganogramNode } from '@/services/rh/organogramService';

interface OrganogramActionsMenuProps {
  node: OrganogramNode;
  onView?: (node: OrganogramNode) => void;
  onEdit?: (node: OrganogramNode) => void;
  onDelete?: (node: OrganogramNode) => void;
  onMoveUp?: (node: OrganogramNode) => void;
  onMoveDown?: (node: OrganogramNode) => void;
  onMoveTo?: (node: OrganogramNode) => void;
  onManageSubordinates?: (node: OrganogramNode) => void;
}

export function OrganogramActionsMenu({
  node,
  onView,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onMoveTo,
  onManageSubordinates
}: OrganogramActionsMenuProps) {
  const getActionsByType = () => {
    switch (node.type) {
      case 'person':
        return [
          { icon: <Eye className="h-4 w-4" />, label: 'Ver Detalhes', action: onView },
          { icon: <Edit className="h-4 w-4" />, label: 'Editar Funcionário', action: onEdit },
          { icon: <Users className="h-4 w-4" />, label: 'Gerenciar Subordinados', action: onManageSubordinates },
          { separator: true },
          { icon: <ArrowUp className="h-4 w-4" />, label: 'Promover', action: onMoveUp },
          { icon: <ArrowDown className="h-4 w-4" />, label: 'Reorganizar', action: onMoveDown },
          { icon: <Move className="h-4 w-4" />, label: 'Mover para...', action: onMoveTo },
          { separator: true },
          { icon: <Trash2 className="h-4 w-4" />, label: 'Desativar', action: onDelete, destructive: true },
        ];
      
      case 'position':
        return [
          { icon: <Eye className="h-4 w-4" />, label: 'Ver Detalhes', action: onView },
          { icon: <Edit className="h-4 w-4" />, label: 'Editar Cargo', action: onEdit },
          { icon: <Users className="h-4 w-4" />, label: 'Ver Funcionários', action: onManageSubordinates },
          { separator: true },
          { icon: <ArrowUp className="h-4 w-4" />, label: 'Subir Nível', action: onMoveUp },
          { icon: <ArrowDown className="h-4 w-4" />, label: 'Descer Nível', action: onMoveDown },
          { separator: true },
          { icon: <Trash2 className="h-4 w-4" />, label: 'Desativar', action: onDelete, destructive: true },
        ];
      
      case 'cost_center':
        return [
          { icon: <Eye className="h-4 w-4" />, label: 'Ver Detalhes', action: onView },
          { icon: <Edit className="h-4 w-4" />, label: 'Editar Centro de Custo', action: onEdit },
          { icon: <Users className="h-4 w-4" />, label: 'Ver Funcionários', action: onManageSubordinates },
          { separator: true },
          { icon: <ArrowUp className="h-4 w-4" />, label: 'Subir Nível', action: onMoveUp },
          { icon: <ArrowDown className="h-4 w-4" />, label: 'Descer Nível', action: onMoveDown },
          { separator: true },
          { icon: <Trash2 className="h-4 w-4" />, label: 'Desativar', action: onDelete, destructive: true },
        ];
      
      default:
        return [];
    }
  };

  const actions = getActionsByType();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {actions.map((action, index) => {
          if (action.separator) {
            return <DropdownMenuSeparator key={`separator-${index}`} />;
          }
          
          return (
            <DropdownMenuItem
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                action.action?.(node);
              }}
              className={action.destructive ? 'text-destructive' : ''}
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
